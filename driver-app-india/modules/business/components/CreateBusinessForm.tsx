//dependencies
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import {CaretDown} from 'phosphor-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Pressable, StyleSheet, View, Keyboard} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import * as z from 'zod';

//imports and components
import {Button, Divider, Text} from '@/components';
import {CustomBottomFormInput} from '@/modules/fillupRequest/components';
import OrganisationSegmentList from './common/OrganisationSegmentList';

//stores
import {businessStore, userStore} from '@/globalStore';

//services
import {
  CreateNewBusinessOrganizationMutationVariables,
  FetchOrganizationSegmentationQuery,
} from '@/generated/graphql';
import {BusinessService, UserService} from '@/services';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import SetupBusinessProfileLoader from './CreateBusiness/SetupBusinessProfileLoader';
import AddingBusinessLoader from './CreateBusiness/AddingBusinessLoader';

//zod schema for validation
const schema = z.object({
  businessName: z.string().min(1, {message: 'Business name is required'}),
  email: z.string().email({message: 'Invalid email address'}),
  contactNumber: z
    .string()
    .length(13, {message: 'Contact number must be 10 digits'}),
  panNumber: z
    .string()
    .length(10, {message: 'PAN must be 10 characters'})
    .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/i, {message: 'Invalid PAN format'}),
  gstNumber: z
    .string()
    .regex(/^[0-9A-Z]{15}$/i, {message: 'Invalid GST number'})
    .optional()
    .or(z.literal('')),
});
type FormFields = z.infer<typeof schema>;

type LoaderView = 'please-wait' | 'updating-profile';

interface Props {
  closeBottomSheet: () => void;
}

const CreateBusinessForm: React.FC<Props> = ({closeBottomSheet}) => {
  const user = userStore.use.loggedInUser();

  const loaders = businessStore.use.loaders();
  const startLoader = businessStore.use.startLoader();
  const stopLoader = businessStore.use.stopLoader();

  const [currentLoaderView, setCurrentLoaderView] =
    useState<LoaderView>('please-wait');

  //states
  const organizationSegments =
    businessStore.getState().fetchedOrganizationSegmentations;
  const [selectedBusinessType, setSelectedBusinessType] = useState<
    | FetchOrganizationSegmentationQuery['organization_segmentation'][0]
    | undefined
  >();

  const [showOrganisations, setShowOrganisations] = useState(false);

  const defaultValues = {
    businessName: '',
    email: user ? (user[0]?.email as string) : '',
    contactNumber: user ? (user[0]?.phone_number as string) : '',
    panNumber: '',
    gstNumber: '',
    orgWebsite: '',
  };

  const {
    control,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormFields>({
    mode: 'onBlur',
    resolver: zodResolver(schema),
    defaultValues,
  });

  //submit function
  const createBusiness = async (data: FormFields) => {
    Keyboard.dismiss();
    startLoader('createBusiness');
    //to check if same pan already exists for another org
    const response = await BusinessService.checkIfPanAlreadyExists({
      object: {
        organization_user_type: 'DELIVERY',
        pan_number: data.panNumber.toUpperCase().trim(),
      },
    });

    if (response) {
      stopLoader('createBusiness');

      Toast.show({
        type: 'error',
        text1: 'Entered PAN number already exists for this organization type',
      });
      return;
    }

    const payload: CreateNewBusinessOrganizationMutationVariables = {
      object: {
        is_active: true,
        is_owner: true,
        organization_user_type: 'DELIVERY',
        organization: {
          brand: data.businessName.trim(),
          brand_logo: '',
          cin_number: '',
          default_currency: 'b8b0753d-df29-42c3-a7af-bb5a212a7600',
          gst_number: data.gstNumber?.toUpperCase().trim(),
          head_office_general_email: data.email.trim(),
          head_office_general_phone_number: '',
          holding_company: false,
          holding_company_name: '',
          invoice_email: data.email.trim(),
          invoices_uploaded: true,
          is_active: true,
          is_business: true,
          is_post_paid: false,
          name: data?.businessName.trim(),
          pan_number: data.panNumber.toUpperCase()?.trim(),
          signed_invoice_on_email: true,
          technical_contact_email: data.email.trim(),
          technical_contact_full_name: user?.length
            ? `${user[0]?.first_name?.trim()} ${user[0]?.last_name?.trim()}`
            : data?.businessName.trim(),
          technical_contact_phone_number: `${data.contactNumber.trim()}`,
          website_url: '',
          organization_segmentation_id: selectedBusinessType?.id || '',
        },
        user_id: user?.length ? user[0]?.id : '',
      },
    };

    BusinessService.createNewBusinessOrganization(payload)
      .then(async newBusiness => {
        setCurrentLoaderView('updating-profile');

        setTimeout(() => {
          closeBottomSheet();
          stopLoader('createBusiness');
          setCurrentLoaderView('please-wait');
          Toast.show({
            type: 'success',
            text1: 'Created business organization successfully',
          });
        }, 21000);

        const allOrgs = await BusinessService.fetchAllOrgUsersByType({
          organization_user_type: 'DELIVERY',
        });

        const newOrg = allOrgs.businessOrgUsers.find(org => {
          return org.id === newBusiness?.id;
        });

        await BusinessService.createWalletForNewOrg({
          object: {
            currency_id: 'b8b0753d-df29-42c3-a7af-bb5a212a7600', //todo: hardcoded for now
            organization_id: newOrg?.organization_id,
            organization_user_id: newOrg?.id,
          },
        });
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Error creating business',
        });
        closeBottomSheet();
        stopLoader('createBusiness');
      });
  };

  const onFocus = useCallback(() => {
    setShowOrganisations(true);
  }, []);

  useEffect(() => {
    UserService.getUserProfile();
  }, []);

  return (
    <View style={{height: '90%'}}>
      <View style={styles.bottomSheetContainer}>
        <Text size="lg" weight="600" style={{textAlign: 'center'}}>
          Create Business
        </Text>

        <Text size="sm" color="accent" style={{marginTop: 16}} weight="400">
          Let's collaborate to tailor FuelBuddy's offerings to your unique needs
          and drive your success forward. Your inputs matter – let's fuel your
          business growth together!
        </Text>
      </View>

      <View style={{flex: 1}}>
        <Divider height={16} />
        <ScrollView
          contentContainerStyle={{paddingBottom: 20}}
          keyboardShouldPersistTaps="handled">
          <CustomBottomFormInput
            name="businessName"
            label="Business Organisation name"
            control={control}
            errors={errors}
            placeholder="Enter Business Name"
            required={true}
            textInputStyle={{width: '100%'}}
          />
          <Divider height={16} />
          <View>
            <Text
              size="sm"
              color="steelBlue"
              weight="500"
              style={{marginBottom: 5}}>
              Business Type
              <Text color="error">*</Text>
            </Text>

            <Pressable onPress={onFocus} style={styles.pressable}>
              <Text size="sm" color="neutral" weight="400">
                {selectedBusinessType?.name || ''}
              </Text>
              <CaretDown size={20} color={FBColors.neutral} />
            </Pressable>
          </View>

          <Divider height={16} />
          <CustomBottomFormInput
            name="email"
            label="Email"
            control={control}
            errors={errors}
            required={true}
            editable={false}
            placeholder={'Email'}
            inputContainerStyle={{position: 'relative', zIndex: 1}}
            keyboardType={'email-address'}
            textInputStyle={{textTransform: 'lowercase'}}
          />

          <Divider height={16} />
          <CustomBottomFormInput
            name="contactNumber"
            label="Contact Number"
            control={control}
            errors={errors}
            required={true}
            placeholder={'Contact Number'}
            textInputStyle={{width: '100%'}}
            keyboardType={'phone-pad'}
            editable={false}
          />
          <Divider height={16} />
          <CustomBottomFormInput
            name="panNumber"
            label="PAN"
            control={control}
            errors={errors}
            required={true}
            placeholder={'PAN'}
            maxLength={10}
            textInputStyle={{textTransform: 'uppercase'}}
          />
          <Divider height={16} />
          <CustomBottomFormInput
            name="gstNumber"
            label="GST Number"
            control={control}
            required={false}
            errors={errors}
            placeholder={'GST Number'}
          />
          <Divider height={16} />
          <Button
            disabled={!selectedBusinessType}
            variant="solid"
            style={{width: '80%', alignSelf: 'center', marginTop: 10}}
            onPress={() => {
              handleSubmit(createBusiness)();
            }}>
            {isSubmitting ? 'Submitting .. ' : ' Create Business '}
          </Button>

          {/* <Modal
            isVisible={loaders?.createBusiness}
            backdropTransitionOutTiming={0}
            backdropTransitionInTiming={1000}
            backdropOpacity={0.5}
            animationIn="slideInUp"
            animationOut="slideOutDown">
            <View
              style={{
                height: '50%',
                backgroundColor: FBBackground.white,
                borderRadius: 10,
              }}>
              {currentLoaderView === 'please-wait' ? (
                <AddingBusinessLoader />
              ) : (
                <SetupBusinessProfileLoader />
              )}
            </View>
          </Modal> */}
        </ScrollView>
      </View>

      <Modal
        isVisible={showOrganisations}
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={1000}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onBackdropPress={() => {
          setShowOrganisations(false);
        }}>
        <OrganisationSegmentList
          organizationSegments={organizationSegments}
          selectedBusinessType={selectedBusinessType}
          setShowOrganisations={setShowOrganisations}
          setSelectedBusinessType={setSelectedBusinessType}
        />
      </Modal>
    </View>
  );
};

export default CreateBusinessForm;

const styles = StyleSheet.create({
  bottomSheetContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.secondary,
  },
  pressable: {
    backgroundColor: FBBackground.input,
    borderWidth: 1,
    borderColor: FBBorders.input, // Replace with the image border color
    borderRadius: 8, // Adjust if corners are rounded
    height: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
  },
});
