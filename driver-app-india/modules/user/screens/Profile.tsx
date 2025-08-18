import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import {CaretDown} from 'phosphor-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {
  Pressable,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import {ScaledSheet} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';
import * as z from 'zod';

// store
import {authStore} from '@/globalStore';
import userStore from '../store';

//service
import {FetchCustomerSegmentationListQuery} from '@/generated/graphql';
import UserService from '../services';

// components
import {
  Avatar,
  Button,
  Divider,
  HeaderAvoidingContainer,
  IconButton,
  Text,
  TextButton,
} from '@/components';
import {CustomFormInput} from '../components';
import UserSegmentationList from '../components/UserSegmentationList';

// types & styles
import {signOut} from '@/modules/auth/services';
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';
import {Trash} from 'phosphor-react-native';

//zod schema for validation
const schema = z.object({
  firstName: z.string().min(1, {message: 'First name is required'}),
  lastName: z.string().min(1, {message: 'Last name is required'}),
  phoneNumber: z
    .string()
    .min(1, {message: 'Phone number must be 10 digits'})
    .optional(),
  pan: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/i, {message: 'Invalid PAN format'})
    .optional()
    .or(z.literal(''))
    .nullable(),

  customerSegmentation: z
    .string()
    .min(1, {message: 'Customer segmentation is required'})
    .optional()
    .or(z.literal(''))
    .nullable(),
  email: z.string().email({message: 'Invalid email address'}),
});
type FormFields = z.infer<typeof schema>;

const Profile: React.FC = () => {
  const loggedInUser = userStore.use.loggedInUser();
  const customerSegmentationList = userStore.use.customerSegmentationList();
  const xHasuraId = authStore.use.xHasuraId();

  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSegmentType, setSelectedSegmentType] = useState<
    FetchCustomerSegmentationListQuery['customer_segmentation'][0] | undefined
  >();

  const [showCustomerSegmentation, setShowCustomerSegmentation] =
    useState(false);

  //default values for fields
  const defaultValues = {
    firstName: loggedInUser?.length ? loggedInUser[0]?.first_name : '',
    lastName: loggedInUser?.length ? loggedInUser[0]?.last_name : '',
    phoneNumber: loggedInUser?.length ? loggedInUser[0]?.phone_number : '',
    customerSegmentation: loggedInUser?.length
      ? loggedInUser[0]?.customer_segmentation?.id
      : '',
    pan: loggedInUser?.length ? loggedInUser[0]?.pan_number : '',
    email: loggedInUser?.length ? loggedInUser[0]?.email : '',
  };

  const {
    control,
    reset,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
    // @ts-ignore
  } = useForm<FormFields>({resolver: zodResolver(schema), defaultValues});

  /**
   * This checks if the user has a first name
   * if yes, then the profile fields are disabled
   * if no, then the fields are enabled
   * This is done so that first-time users can update their profiles without having to click on update
   */
  const [isEditabled, setIsEditabled] = useState(
    loggedInUser && loggedInUser.length > 0 && loggedInUser[0]?.first_name
      ? false
      : true,
  );
  const toggleFieldsDisabled = (resetState: boolean) => {
    if (resetState) {
      reset();
    }

    setIsEditabled(!isEditabled);
  };

  const updateProfile = async (data: FormFields) => {
    try {
      const payload = {
        first_name: data.firstName.trim() || '',
        last_name: data.lastName.trim() || '',
        phone_number: data.phoneNumber || '',
        email: data.email?.trim() || '',
        pan_number: data.pan?.trim() || '',
        customer_segmentation_id: selectedSegmentType?.id || '',
        id: xHasuraId,
      };

      if (!selectedSegmentType?.id) {
        delete payload.customer_segmentation_id;
      }

      await UserService.updateProfile({
        ...payload,
      });

      await UserService.getUserProfile();
      toggleFieldsDisabled(false); //show toast of success
      Toast.show({
        type: 'success',
        text1: 'Updated profile successfully',
      });
    } catch (e) {
      setError('root', {message: 'Error updating profile'});
      Toast.show({
        type: 'error',
        text1: 'Error updating profile',
        text2: 'Please try with a different email id',
      });
      throw new Error('error');
    } finally {
      //callback to close modal
    }
  };

  const showOrgSegmentation = useCallback(() => {
    // callback to open customer segmentation list modal
    setShowCustomerSegmentation(true);
  }, []);

  useEffect(() => {
    UserService.fetchCustomerSegmentation().then(response => {
      if (loggedInUser) {
        const currentSegmentation = response.find(segment => {
          return segment.id === loggedInUser[0]?.customer_segmentation?.id;
        });
        setSelectedSegmentType(currentSegmentation);
      }
    });
  }, [loggedInUser]);

  useEffect(() => {
    UserService.getUserProfile();
  }, []);

  // const pollCall = () => {
  //   let counter = 5;
  //   let timer;
  //   let response;

  //   const pr = new Promise(async (resolve, reject) => {
  //     timer = setInterval(async () => {
  //       if (counter === 0) {
  //         clearInterval(timer);
  //         resolve(response);
  //       }

  //       console.log('counter', counter);

  //       response = await UserService.checkIfUserExists({
  //         phone_number: '9797979797',
  //       }).finally(() => {
  //         counter--;
  //       });
  //     }, 5000);
  //   });

  //   return pr;
  // };

  // useEffect(() => {
  //   pollCall().then(() => {
  //     console.log('fired after poll');
  //   });
  // }, []);

  return (
    <HeaderAvoidingContainer>
      {isEditabled ? (
        <IconButton
          variant="text"
          onPress={() => setDeleteModalVisible(true)}
          style={{
            backgroundColor: 'transparent',
            alignSelf: 'flex-start',
            position: 'absolute',
            top: 67,
            right: 16,
          }}>
          <IconButton.Icon>
            <Trash size={24} color="red" weight="bold" />
          </IconButton.Icon>
        </IconButton>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{alignItems: 'center', paddingBottom: 20}}
          showsVerticalScrollIndicator={false}>
          <Avatar
            variant="rounded"
            buttonStyle={styles.avatarStyle}
            buttonTextSize="4xl"
            fullName={`${loggedInUser ? loggedInUser[0]?.first_name : ''} ${
              loggedInUser ? loggedInUser[0]?.last_name : ''
            }`}
          />
          <View style={styles.form}>
            <CustomFormInput
              name="firstName"
              label="First Name"
              control={control}
              errors={errors}
              placeholder="First Name"
              required={true}
              editable={isEditabled}
            />

            <Divider />
            <CustomFormInput
              name="lastName"
              label="Last Name"
              control={control}
              errors={errors}
              placeholder="Last Name"
              required={true}
              editable={isEditabled}
            />

            <Divider />
            <CustomFormInput
              name="phoneNumber"
              label="Mobile Number"
              control={control}
              errors={errors}
              editable={false}
              placeholder={'Mobile Number'}
              required={true}
              keyboardType={'phone-pad'}
            />

            <Divider />
            <CustomFormInput
              name="pan"
              label="PAN"
              maxLength={10}
              control={control}
              errors={errors}
              required={false}
              editable={
                loggedInUser?.length
                  ? !loggedInUser[0]?.pan_number && isEditabled
                    ? true
                    : false
                  : false
              }
              placeholder={'PAN'}
              textInputStyle={{textTransform: 'uppercase'}}
            />

            <Divider />
            <View>
              <Text
                size="sm"
                color="steelBlue"
                weight="500"
                style={{marginBottom: 5}}>
                Customer Segmentation
                <Text color="error"> *</Text>
              </Text>
              <Pressable
                onPress={() => {
                  if (
                    loggedInUser?.length &&
                    !loggedInUser[0]?.customer_segmentation?.id &&
                    isEditabled
                  ) {
                    showOrgSegmentation();
                  }
                }}
                style={styles.pressable}>
                <Text size="sm" color={'disabledInputText'} weight="400">
                  {selectedSegmentType?.name || ' '}
                </Text>
                <CaretDown size={20} color={FBColorPalette.disabledInputText} />
              </Pressable>
            </View>

            <Divider />
            <CustomFormInput
              name="email"
              label="Email"
              control={control}
              errors={errors}
              required={true}
              editable={
                loggedInUser?.length
                  ? !loggedInUser[0]?.email && isEditabled
                    ? true
                    : false
                  : false
              }
              placeholder={'Email'}
              keyboardType={'email-address'}
            />

            {/* Submit Button */}
            <Divider height={24} />
            <View style={{width: '100%'}}>
              {!isEditabled ? (
                <Button
                  onPress={() => toggleFieldsDisabled(false)}
                  variant="solid">
                  Edit profile
                </Button>
              ) : (
                <>
                  <View style={{alignItems: 'center', width: '100%'}}>
                    <Button
                      variant="solid"
                      onPress={() => {
                        handleSubmit(updateProfile)(); //force execution to submit
                      }}
                      style={{width: '100%'}}>
                      {isSubmitting ? 'Updating .. ' : ' Update '}
                    </Button>
                    <Divider height={12} />
                    <TextButton
                      onPress={() => toggleFieldsDisabled(true)}
                      underline
                      textColor="error">
                      Cancel
                    </TextButton>
                  </View>
                </>
              )}
            </View>
          </View>
          <Modal
            isVisible={isDeleteModalVisible}
            backdropTransitionOutTiming={0}
            backdropTransitionInTiming={0}
            backdropOpacity={0.8}
            animationIn="fadeIn"
            animationOut="slideOutDown">
            <View style={styles.modalContent}>
              <Text>
                Your account will be deleted after 30 days. All your data and
                settings will be deleted.
              </Text>
              <Divider height={20} />
              <View style={styles.modalButtons}>
                <Button
                  onPress={() => setDeleteModalVisible(false)}
                  variant="outlined"
                  style={{
                    width: '45%',
                  }}>
                  Cancel
                </Button>
                <Button
                  onPress={signOut}
                  variant="solid"
                  style={{
                    backgroundColor: FBColors.error,
                    width: '45%',
                  }}>
                  Delete
                </Button>
              </View>
            </View>
          </Modal>
          <Modal
            isVisible={showCustomerSegmentation}
            backdropTransitionOutTiming={0}
            backdropTransitionInTiming={1000}
            backdropOpacity={0.5}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            onBackdropPress={() => {
              setShowCustomerSegmentation(false);
            }}>
            <UserSegmentationList
              customerSegments={customerSegmentationList}
              selectedCustomerType={selectedSegmentType}
              setShowCustomerSegmentation={setShowCustomerSegmentation}
              setSelectedCustomerType={setSelectedSegmentType}
            />
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </HeaderAvoidingContainer>
  );
};

export default Profile;

const styles = ScaledSheet.create({
  avatarStyle: {
    width: '100@vs',
    height: '100@vs',
    borderRadius: 100,
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
  form: {width: '100%', marginTop: 20},

  modalContent: {
    backgroundColor: FBBackground.white,
    borderRadius: 8,
    padding: 20,
    columnGap: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
