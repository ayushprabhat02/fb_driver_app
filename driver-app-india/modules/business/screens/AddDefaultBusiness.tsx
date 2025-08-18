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
import {authStore, businessStore, userStore} from '@/globalStore';

//services
import {
  CreateNewBusinessOrganizationMutationVariables,
  FetchCustomerSegmentationListQuery,
  FetchOrganizationSegmentationQuery,
} from '@/generated/graphql';
import {BusinessService, UserService} from '@/services';
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';
import SetupBusinessProfileLoader from '../components/CreateBusiness/SetupBusinessProfileLoader';
import AddingBusinessLoader from '../components/CreateBusiness/AddingBusinessLoader';
import {commonInputStyles} from '@/styles';
import {useNavigation} from '@react-navigation/native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {ms} from 'react-native-size-matters';
import UserSegmentationList from '@/modules/user/components/UserSegmentationList';

const schema = z.object({
  firstName: z.string().min(1, {message: 'First name required'}),
  lastName: z.string().min(1, {message: 'Last name required'}),
  businessName: z.string().min(1, {message: 'Business name required'}),
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
  // cinNumber: z.string().optional(),
  orgWebsite: z.string().url({message: 'Invalid website URL'}).optional(),
});

type FormFields = z.infer<typeof schema>;

type LoaderView = 'please-wait' | 'updating-profile';

const AddDefaultBusiness: React.FC = () => {
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
    orgWebsite: '',
    firstName: '',
    lastName: '',
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
          cin_number: '',
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
            // closeBottomSheet();
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

          //   setActiveDelOrgUserId(activeOrg?.id);
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
          //   closeBottomSheet();
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
    <HeaderAvoidingContainer paddingHorizontal={16}>
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
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 16}}
        enableOnAndroid={true}
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="firstName"
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  First Name
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  style={styles.inputStyle}
                  placeholder="Enter First Name"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />
        {errors.firstName ? (
          <View>
            <Text color="error" size="xs">
              {errors?.firstName?.message}
            </Text>
          </View>
        ) : null}

        <Divider height={16} />
        <Controller
          control={control}
          name="lastName"
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  Last Name
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  style={styles.inputStyle}
                  placeholder="Enter Last Name"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />
        {errors.lastName ? (
          <View>
            <Text color="error" size="xs">
              {errors?.lastName?.message}
            </Text>
          </View>
        ) : null}

        <Divider height={16} />

        {/* customer segmentation */}
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
                  Business Organisation name
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  editable={true}
                  onChangeText={onChange}
                  style={[
                    styles.inputStyle,
                    // {color: FBColors.disabledInputText},
                  ]}
                  placeholder="Enter Organisation Name"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />
        {errors.businessName ? (
          <View>
            <Text color="error" size="xs">
              {errors?.businessName?.message}
            </Text>
          </View>
        ) : null}
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
                  editable={true}
                  onChangeText={onChange}
                  style={[
                    styles.inputStyle,
                    // {color: FBColors.disabledInputText},
                  ]}
                  placeholder="Email"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
        />
        {errors.email ? (
          <View>
            <Text color="error" size="xs">
              {errors?.email?.message}
            </Text>
          </View>
        ) : null}
        <Divider height={16} />

        <Controller
          control={control}
          name="contactNumber" //fix this later ( after release )
          rules={{
            required: true,
          }}
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  Mobile Number
                  <Text color="error">*</Text>
                </Text>
                <Divider />
                <TextInput
                  value={`+91${
                    user ? user[0]?.phone_number?.replace(/^(\+91)/, '') : ''
                  }`}
                  editable={false}
                  onChangeText={onChange}
                  style={[
                    styles.inputStyle,
                    {color: FBColors.disabledInputText},
                  ]}
                  placeholder="+91"
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
            <Text color="error" size="xs">
              Please enter valid PAN
            </Text>
          </View>
        ) : null}

        <Divider height={16} />
        <Controller
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
        {errors.gstNumber ? (
          <View>
            <Text color="error" size="xs">
              {errors?.gstNumber?.message}
            </Text>
          </View>
        ) : null}
        <Divider height={16} />
        <Controller
          control={control}
          name="orgWebsite"
          render={({field: {onChange, value}}) => {
            return (
              <>
                <Text size="sm" color="steelBlue" weight="500">
                  Org Website
                </Text>
                <Divider />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  style={styles.inputStyle}
                  placeholder="Org Website"
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            );
          }}
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
      </KeyboardAwareScrollView>
    </HeaderAvoidingContainer>
  );
};

export default AddDefaultBusiness;

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
