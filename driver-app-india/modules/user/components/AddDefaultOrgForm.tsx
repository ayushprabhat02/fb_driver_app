//dependencies
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import React, {useCallback, useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Keyboard, Pressable, StyleSheet, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import {ms} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';
import * as z from 'zod';

//imports and components
import {Button, Divider, Text} from '@/components';
import {CustomBottomFormInput} from '@/modules/address/components';
import OrganisationSegmentList from '@/modules/business/components/common/OrganisationSegmentList';
import UserSegmentationList from '../components/UserSegmentationList';

//stores
import {authStore, businessStore, userStore} from '@/globalStore';

//services
import {BusinessService, UserService} from '@/services';
import {
  CreateNewBusinessOrganizationMutationVariables,
  FetchCustomerSegmentationListQuery,
  FetchOrganizationSegmentationQuery,
} from '@/generated/graphql';
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';
import {setActiveDelOrgUserId} from '@/utils/localStorage';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import AddingBusinessLoader from '@/modules/business/components/CreateBusiness/AddingBusinessLoader';
import SetupBusinessProfileLoader from '@/modules/business/components/CreateBusiness/SetupBusinessProfileLoader';
import {CaretDown} from 'phosphor-react-native';

//zod schema for validation
const schema = z.object({
  firstName: z.string().min(1, {message: 'First name is required'}),
  lastName: z.string().min(1, {message: 'Last name is required'}),
  businessName: z.string().min(1, {message: 'Business name is required'}),
  email: z.string().email({message: 'Invalid email address'}),
  panNumber: z
    .string()
    .length(10, {message: 'PAN must be 10 characters'})
    .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/i, {message: 'Invalid PAN format'}),
  gstNumber: z
    .string()
    .regex(/^[0-9A-Z]{15}$/i, {message: 'Invalid GST number'})
    .optional()
    .or(z.literal('')),
  cinNumber: z.string().optional(),
  orgWebsite: z.string().url({message: 'Invalid website URL'}).optional(),
});

type FormFields = z.infer<typeof schema>;

type Props = {
  closeBottomSheet: () => void;
};

type LoaderView = 'please-wait' | 'updating-profile';

const CreateBusinessForm: React.FC<Props> = ({closeBottomSheet}) => {
  const navigation = useNavigation();

  //states
  const user = userStore.use.loggedInUser();
  const customerSegmentationList = userStore.use.customerSegmentationList();
  const xHasuraId = authStore.use.xHasuraId();
  const organizationSegments =
    businessStore.getState().fetchedOrganizationSegmentations;
  const loaders = businessStore.use.loaders();
  const startLoader = businessStore.use.startLoader();
  const stopLoader = businessStore.use.stopLoader();

  const [selectedBusinessType, setSelectedBusinessType] = useState<
    | FetchOrganizationSegmentationQuery['organization_segmentation'][0]
    | undefined
  >();

  const [selectedCustomerType, setSelectedCustomerType] = useState<
    FetchCustomerSegmentationListQuery['customer_segmentation'][0] | undefined
  >();

  const [showOrganisations, setShowOrganisations] = useState(false);
  const [showCustomerSegmentation, setShowCustomerSegmentation] =
    useState(false);
  const [currentLoaderView, setCurrentLoaderView] =
    useState<LoaderView>('please-wait');

  const defaultValues = {
    businessName: '',
    email: '',
    panNumber: '',
    gstNumber: '',
    cinNumber: '',
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
    startLoader('createDefaultBusiness');
    //to check if same pan already exists for another org
    const response = await BusinessService.checkIfPanAlreadyExists({
      object: {
        organization_user_type: 'DELIVERY',
        pan_number: data.panNumber.toUpperCase()?.trim(),
      },
    });

    if (response) {
      stopLoader('createDefaultBusiness');
      Toast.show({
        type: 'error',
        text1: 'Entered PAN number already exists for this organization type',
      });
      return;
    }

    Keyboard.dismiss();

    try {
      await UserService.updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: user ? user[0]?.phone_number : '',
        email: data.email,
        pan_number: data.panNumber,
        customer_segmentation_id: selectedCustomerType?.id,
        id: xHasuraId,
      });

      // const response = await checkIfUserExists();
    } catch (error) {
      if ((error as any)?.message.includes('user_email_key')) {
        Toast.show({
          type: 'error',
          text1: 'Email already exists',
          text2: 'Please use a different email',
        });
      }

      stopLoader('createDefaultBusiness');
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
          cin_number: data.cinNumber?.toUpperCase().trim(),
          default_currency: 'b8b0753d-df29-42c3-a7af-bb5a212a7600',
          gst_number: data.gstNumber?.toUpperCase().trim(),
          head_office_general_email: data.email?.trim(),
          head_office_general_phone_number: '',
          holding_company: false,
          holding_company_name: '',
          invoice_email: data.email?.trim(),
          invoices_uploaded: true,
          is_active: true,
          is_business: true,
          is_post_paid: false,
          name: data?.businessName.trim(),
          pan_number: data.panNumber.toUpperCase()?.trim(),
          signed_invoice_on_email: true,
          technical_contact_email: data.email?.trim(),
          technical_contact_full_name: user?.length
            ? `${user[0]?.first_name?.trim()} ${user[0]?.last_name?.trim()}`
            : data?.businessName.trim(),
          technical_contact_phone_number: `+91${
            user ? user[0]?.phone_number?.replace(/^(\+91)/, '').trim() : ''
          }`,
          website_url: data.orgWebsite?.trim(),
          organization_segmentation_id: selectedBusinessType?.id || '',
        },
        user_id: user?.length ? user[0]?.id : '',
      },
    };

    setTimeout(() => {
      BusinessService.createNewBusinessOrganization(payload)
        .then(async newBusiness => {
          setCurrentLoaderView('updating-profile');
          setTimeout(() => {
            closeBottomSheet();
            stopLoader('createDefaultBusiness');
            setCurrentLoaderView('please-wait');
            Toast.show({
              type: 'success',
              text1: 'Created business organization successfully',
            });
            navigation.reset({
              index: 0,
              routes: [{name: 'home'}],
            });
          }, 56000);

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
          });

          const businessesList = await BusinessService.fetchAllOrgUsersByType({
            organization_user_type: 'DELIVERY',
          });

          const activeOrg = businessesList?.businessOrgUsers.find(business => {
            return business.id === newBusiness?.id;
          });

          setActiveDelOrgUserId(activeOrg?.id);
          businessStore.setState(state => ({
            ...state,
            activeDeliveryOrgUser: activeOrg,
          }));
        })
        .catch(() => {
          Toast.show({
            type: 'error',
            text1: 'Error creating business',
          });
          closeBottomSheet();
          stopLoader('createDefaultBusiness');
        })
        .finally(() => {
          stopLoader('setActiveDelOrgUser');
        });
    }, 20000);
  };

  const onFocus = useCallback(() => {
    setShowOrganisations(true);
  }, []);

  const onFocusUserSegmentation = useCallback(() => {
    setShowCustomerSegmentation(true);
  }, []);

  useEffect(() => {
    UserService.getUserProfile();
    UserService.fetchCustomerSegmentation();
  }, []);

  return (
    <View style={{flex: 1}}>
      <View style={styles.bottomSheetContainer}>
        <Text size="lg" weight="600">
          Create a Business Profile
        </Text>

        <Text size="sm" color="accent" style={{marginTop: 16}} weight="500">
          Enter Your Details to Order Doorstep Diesel Delivery. Convenient,
          Efficient, and Always Ready to Fuel Your Success!
        </Text>
      </View>

      <View style={{flex: 1}}>
        <Divider height={20} />
        <ScrollView
          contentContainerStyle={{paddingBottom: 20}}
          keyboardShouldPersistTaps="handled">
          <View
            style={{
              flexDirection: 'row',
              columnGap: 12,
              justifyContent: 'space-between',
            }}>
            <CustomBottomFormInput
              name="firstName"
              label="First name"
              control={control}
              errors={errors}
              placeholder=""
              required={true}
              inputContainerStyle={{flex: 1}}
              textInputStyle={{width: '100%'}}
            />
            <CustomBottomFormInput
              name="lastName"
              label="Last name"
              control={control}
              errors={errors}
              placeholder=""
              required={true}
              inputContainerStyle={{flex: 1}}
              textInputStyle={{width: '100%'}}
            />
          </View>

          {/* customer segmentation */}
          <Divider height={16} />
          <View>
            <Text
              size="sm"
              color="steelBlue"
              weight="500"
              style={{marginBottom: 5}}>
              User Type
              <Text color="error">*</Text>
            </Text>

            <Pressable
              onPress={onFocusUserSegmentation}
              style={{
                backgroundColor: FBColorPalette.input,
                borderWidth: 1,
                borderColor: FBBorders.input,
                borderRadius: 8,
                height: 40,
                justifyContent: 'space-between',
                paddingLeft: 10,
                paddingRight: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text size="sm" color="neutral" weight="400">
                {selectedCustomerType?.name || ''}
              </Text>
              <CaretDown size={20} color={FBColors.neutral} />
            </Pressable>
          </View>

          <Divider height={16} />
          <CustomBottomFormInput
            name="businessName"
            label="Business Organisation name"
            control={control}
            errors={errors}
            placeholder="Enter Organisation Name"
            required={true}
            textInputStyle={{width: '100%'}}
          />
          <Divider height={16} />
          <View>
            <Text
              size="sm"
              color="steelBlue"
              weight="500"
              style={{marginBottom: ms(5)}}>
              Business Type
              <Text color="error">*</Text>
            </Text>

            <Pressable
              onPress={onFocus}
              style={{
                backgroundColor: FBColorPalette.input,
                borderWidth: 1,
                borderColor: FBBorders.input,
                borderRadius: 8,
                height: 40,
                justifyContent: 'space-between',
                paddingLeft: 10,
                paddingRight: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
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
            placeholder={'Email'}
            inputContainerStyle={{position: 'relative', zIndex: 1}}
            keyboardType={'email-address'}
            textInputStyle={{textTransform: 'lowercase'}}
          />

          <Divider height={16} />
          <View>
            <Text weight="500" color="steelBlue" lines={1} size="sm">
              Mobile Number
              <Text color="error">*</Text>
            </Text>
            <Divider />
            <BottomSheetTextInput
              value={`+91${
                user ? user[0]?.phone_number?.replace(/^(\+91)/, '') : ''
              }`}
              editable={false}
              style={{
                backgroundColor: FBColorPalette.input,
                borderWidth: 1,
                borderColor: FBBorders.input, // Replace with the image border color
                padding: 10,
                height: 40,
                borderRadius: 8,
                color: FBColorPalette.disabledInputText,
              }}
            />
          </View>
          {/* <CustomBottomFormInput
            name="contactNumber"
            label="Contact Number"
            control={control}
            errors={errors}
            required={true}
            placeholder={'Contact Number'}
            textInputStyle={{width: '100%'}}
            keyboardType={'phone-pad'}
          /> */}

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
          {/* <Divider height={16} />
          <CustomBottomFormInput
            name="cinNumber"
            label="CIN"
            control={control}
            errors={errors}
            placeholder={'CIN'}
          /> */}
          <Divider height={16} />
          <CustomBottomFormInput
            name="orgWebsite"
            label="Org Website"
            control={control}
            errors={errors}
            placeholder={'Org Website'}
            keyboardType={'url'}
          />
          <Divider height={16} />
          <Button
            disabled={!selectedBusinessType}
            variant="solid"
            style={{width: '80%', alignSelf: 'center', marginTop: ms(10)}}
            onPress={() => {
              handleSubmit(createBusiness)();
            }}>
            {isSubmitting ? 'Submitting .. ' : ' Create Business '}
          </Button>

          <Modal
            isVisible={loaders?.createDefaultBusiness}
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
            isVisible={showCustomerSegmentation}
            backdropTransitionOutTiming={0}
            backdropTransitionInTiming={1000}
            backdropOpacity={0.5}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            onBackdropPress={() => {
              setShowOrganisations(false);
            }}>
            <UserSegmentationList
              customerSegments={customerSegmentationList}
              selectedCustomerType={selectedCustomerType}
              setShowCustomerSegmentation={setShowCustomerSegmentation}
              setSelectedCustomerType={setSelectedCustomerType}
            />
          </Modal>
        </ScrollView>
      </View>
    </View>
  );
};

export default CreateBusinessForm;

const styles = StyleSheet.create({
  bottomSheetContainer: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.secondary,
  },
});
