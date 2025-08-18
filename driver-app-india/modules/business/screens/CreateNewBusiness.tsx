//dependencies
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import {CaretDown} from 'phosphor-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {Pressable, StyleSheet, View, Keyboard, TextInput} from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import * as z from 'zod';

//imports and components
import {
  Button,
  Divider,
  FocusAwareStatusBar,
  HeaderAvoidingContainer,
  Text,
} from '@/components';
import OrganisationSegmentList from '../components/common/OrganisationSegmentList';

//stores
import {businessStore, userStore} from '@/globalStore';

//services
import {
  CreateNewBusinessOrganizationMutationVariables,
  FetchOrganizationSegmentationQuery,
} from '@/generated/graphql';
import {BusinessService, UserService} from '@/services';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import SetupBusinessProfileLoader from '../components/CreateBusiness/SetupBusinessProfileLoader';
import AddingBusinessLoader from '../components/CreateBusiness/AddingBusinessLoader';
import {commonInputStyles} from '@/styles';
import {useNavigation} from '@react-navigation/native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

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
  // gstNumber: z
  //   .string()
  //   .regex(/^[0-9A-Z]{15}$/i, {message: 'Invalid GST number'})
  //   .optional()
  //   .or(z.literal('')),
});
type FormFields = z.infer<typeof schema>;

type LoaderView = 'please-wait' | 'updating-profile';

const CreateBusinessForm: React.FC = () => {
  const navigation = useNavigation();

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
    // gstNumber: '',
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
          // gst_number: data.gstNumber?.toUpperCase().trim(),
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
          navigation.goBack();

          stopLoader('createBusiness');
          setCurrentLoaderView('please-wait');
          Toast.show({
            type: 'success',
            text1: 'Created business organization successfully',
          });
        }, 10000);

        const allOrgs = await BusinessService.fetchAllOrgUsersByType({
          organization_user_type: 'DELIVERY',
        });

        const newOrg = allOrgs?.businessOrgUsers.find(org => {
          return org.id === newBusiness?.id;
        });

        await BusinessService.createWalletForNewOrg({
          object: {
            currency_id: 'b8b0753d-df29-42c3-a7af-bb5a212a7600', //todo: hardcoded for now
            organization_id: newOrg?.organization_id,
            organization_user_id: newOrg?.id,
          },
        }).catch(err => {
          console.log('error', err);
          Toast.show({
            type: 'error',
            text1: 'Error creating organisation wallet',
          });
        });
      })
      .catch(err => {
        console.log('error', err);
        Toast.show({
          type: 'error',
          text1: 'Error creating business',
        });

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
    <HeaderAvoidingContainer>
      <FocusAwareStatusBar
        barStyle={'dark-content'}
        backgroundColor={'white'}
      />
      <View style={styles.bottomSheetContainer}>
        <Text size="sm" color="accent" weight="400">
          Enter your details to order doorstep fuel delivery. Convenient,
          efficient, and always ready to fuel your success.
        </Text>
      </View>

      <Divider height={16} />
      <KeyboardAwareScrollView style={{flex: 1}}>
        <Controller
          control={control}
          name="businessName"
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  Business Organisation Name
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  style={styles.inputStyle}
                  placeholder="Enter Business Name"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />
        {errors.businessName ? (
          <View>
            <Text color="error">Please enter business name</Text>
          </View>
        ) : null}

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
        <Controller
          control={control}
          name="email"
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  Email
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  editable={false}
                  onChangeText={onChange}
                  style={[
                    styles.inputStyle,
                    {color: FBColors.disabledInputText},
                  ]}
                  placeholder="Email"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />

        <Divider height={16} />
        <Controller
          control={control}
          name="contactNumber"
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  Contact Number
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  editable={false}
                  onChangeText={onChange}
                  style={[
                    styles.inputStyle,
                    {color: FBColors.disabledInputText},
                  ]}
                  placeholder="Contact Number"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />

        <Divider height={16} />
        <Controller
          control={control}
          name="panNumber"
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  PAN
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  autoCapitalize="characters"
                  value={value}
                  onChangeText={onChange}
                  style={styles.inputStyle}
                  placeholder="PAN"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  maxLength={10}
                />
              </>
            );
          }}
        />
        {errors.panNumber ? (
          <View>
            <Text color="error">Please enter valid PAN</Text>
          </View>
        ) : null}

        <Divider height={16} />
        {/* <Controller
          control={control}
          name="gstNumber"
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  GST Number
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  style={styles.inputStyle}
                  placeholder="GST Number"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />

        <Divider height={16} /> */}
        <Button
          disabled={!selectedBusinessType}
          variant="solid"
          style={{width: '80%', alignSelf: 'center', marginTop: 10}}
          onPress={() => {
            handleSubmit(createBusiness)();
          }}>
          {isSubmitting ? 'Submitting .. ' : ' Create Business '}
        </Button>

        <Modal
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
        </Modal>
      </KeyboardAwareScrollView>

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

      <Modal
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
      </Modal>
    </HeaderAvoidingContainer>
  );
};

export default CreateBusinessForm;

const styles = StyleSheet.create({
  inputStyle: {
    ...commonInputStyles,
    height: 40,
    fontSize: 14,
    fontWeight: '400',
  },

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
