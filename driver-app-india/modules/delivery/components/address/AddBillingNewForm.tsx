//dependencies
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {Keyboard, ScrollView, StyleSheet, View} from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import {z} from 'zod';

//imports and components
import {Button, Divider, Text} from '@/components';
import {
  ActiveCityBilling,
  ActiveStateBilling,
} from '@/modules/fillupRequest/components/AddNewAddress';

//stores
import {
  addressStore,
  businessStore,
  deliveryStore,
  locationStore,
  userStore,
} from '@/globalStore';

//services
import AddressService from '@/modules/fillupRequest/services';

//types
import {Address_Type_Enum} from '@/generated/graphql';
import {commonInputStyles} from '@/styles';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

//zod schema for validation
const schema = z.object({
  gst: z.preprocess(
    val => (val === '' ? undefined : val),
    z
      .string()
      .length(15, {message: 'Invalid GST number'})
      .optional()
      .nullable(),
  ),
  // companyName: z.string().min(1, {message: 'Please enter company name'}),
  addressLine: z.string().min(1, {message: 'Address is required'}),
  pinCode: z
    .string()
    .regex(/^\d{6}$/, {message: 'Pincode must be a 6 digit number'}),
  houseNumber: z.string().optional(),
});
type FormFields = z.infer<typeof schema>;

interface Props {
  closeBottomSheet: () => void;
}

const BillingAddressForm: React.FC<Props> = ({closeBottomSheet}) => {
  const [gstError, setGstError] = useState(false);
  const [isCheckedCheckbox, setIsCheckedCheckbox] =
    React.useState<boolean>(false);
  const user = userStore.use.loggedInUser();

  const billingAddressList = addressStore.use.billingAddresses();
  const selectedState = locationStore.use.selectedState();
  const selectedCity = locationStore.use.selectedCity();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const shippingAddress = deliveryStore.use.selectedShippingAddress();
  const currentCoords = locationStore.use.currentCoords();

  const loaders = locationStore.use.loaders();
  const startLoader = locationStore.use.startLoader();
  const stopLoader = locationStore.use.stopLoader();
  const statesList = locationStore.use.statesList();
  const {
    control,
    handleSubmit,
    setError,
    formState: {errors, isValid},
    setValue,
    reset,
    trigger,
  } = useForm<FormFields>({resolver: zodResolver(schema), mode: 'onChange'});

  const handleCheckboxToggle = async () => {
    setIsCheckedCheckbox(!isCheckedCheckbox);
    if (!isCheckedCheckbox) {
      if (shippingAddress) {
        const addresssplit = shippingAddress.address_line1
          ? shippingAddress.address_line1.split(',')
          : '';
        const addressLine = addresssplit ? addresssplit.slice(0).join(',') : '';
        const currentState = statesList.find(
          item => item.name === shippingAddress?.state?.name,
        );
        const currentCity = currentState?.cities?.find(city => {
          return city.name === shippingAddress?.city?.name;
        });

        if (currentCity) {
          locationStore.setState(state => ({
            ...state,
            selectedState: currentState,
            selectedCity: currentCity,
          }));
        }
        const values = {
          gst: shippingAddress.gst_number || null,
          companyName: activeDeliveryOrgUser?.organization?.name || '',
          addressLine: addressLine || '',
          pinCode: shippingAddress.pincode || '',
          houseNumber: '',
        };
        Object.keys(values).forEach(key => {
          setValue(key, values[key]);
        });

        const gstValue = shippingAddress.gst_number || null;
        if (!gstValue) {
          setGstError(false);
        }

        try {
          await trigger([
            'gst',
            // 'companyName',
            'addressLine',
            'pinCode',
            'houseNumber',
          ]);
        } catch (error) {
          console.error('Trigger validation failed:', error);
        }
      }
    } else {
      reset(); // Resets the form values and form state
      locationStore.setState(state => ({
        ...state,
        selectedState: undefined,
        selectedCity: undefined,
      }));
      setGstError(false);
      try {
        await trigger(['gst', 'addressLine', 'pinCode', 'houseNumber']);
      } catch (error) {
        console.error('Trigger validation failed:', error);
      }
    }
  };

  //submit function
  const addAddress = async (data: FormFields) => {
    Keyboard.dismiss();
    startLoader('addNewAddress');

    // const billingAddressExists =
    //   await AddressService.checkIfBillingAddressExists(
    //     {
    //       organization_user_id: activeDeliveryOrgUser?.id || '',
    //       address_line1: shippingAddress?.address_line1 || '',
    //       pincode: shippingAddress?.pincode || '',
    //       city_id: shippingAddress?.city?.id || '',
    //       country_id: shippingAddress?.country_id || '',
    //       state_id: shippingAddress?.state?.id || '',
    //     },
    //     shippingAddress?.location,
    //   );

    // if (billingAddressExists.length) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Error adding address',
    //     text2: 'Please check if the address is valid',
    //   });

    //   setTimeout(() => {
    //     stopLoader('addNewAddress');
    //   }, 3000);
    //   return;
    // }

    // Validate GST number before adding the address
    if (data.gst) {
      const gstinValidationResponse = await AddressService.isValidateGstin({
        gstin: data.gst, // Assuming you are sending gst number as 'gstin'
      });

      console.log('gstinValidationResponse-----', gstinValidationResponse);

      if (!gstinValidationResponse?.status) {
        Toast.show({
          type: 'error',
          text1: 'Invalid GST number',
          text2: 'Please enter a valid GST number.',
        });
        setTimeout(() => {
          stopLoader('addNewAddress');
        }, 3000);
        return; // Exit if GST number is invalid
      }
    }

    try {
      AddressService.addNewCustomerAddress({
        object: {
          address_line1: data.addressLine, //activeDeliveryOrgUser?.organization?.name || '',
          address_line2: '',
          city_id: selectedCity?.id || '',
          country_id: selectedState?.country_id || '',
          is_active: true,
          landMark: '',
          location: `(${currentCoords?.lng},${currentCoords?.lat})`,
          pincode: data?.pinCode,
          organization_user_id: activeDeliveryOrgUser?.id,
          state_id: selectedState?.id || '',
          street_address: `${data.addressLine} ${activeDeliveryOrgUser?.organization?.name}`,
          address_type: Address_Type_Enum.Billing,
          ownership: 'INDIVIDUAL',
          instruction: '',
          house_number: data.houseNumber,
          gst_number: data.gst,
          name: activeDeliveryOrgUser?.organization?.name,
        },
      }).then(async response => {
        if (response.addCustomerAddress.code == '200') {
          closeBottomSheet();
          //show toast of success
          Toast.show({
            type: 'success',
            text1: 'Added billing address successfully',
          });

          const allBillingAddresses = await AddressService.getBillingAddresses({
            address_type: Address_Type_Enum.Billing,
            organization_user_id: activeDeliveryOrgUser?.id,
          });

          const currentBillingAddress = allBillingAddresses.find(address => {
            return address.id === response?.addCustomerAddress?.address?.id;
          });

          deliveryStore.setState(state => ({
            ...state,
            selectedBillingAddress: currentBillingAddress,
          }));
        } else {
          Toast.show({
            type: 'error',
            text1: 'Invalid address details',
            text2: 'Please add a valid address',
          });

          setTimeout(() => {
            stopLoader('addNewAddress');
          }, 3000);
        }
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error adding billing address',
        text2: 'Try again after sometime',
      });
      setError('root', {message: 'Error adding billing address'});
      throw new Error('error');
    } finally {
      setTimeout(() => {
        stopLoader('addNewAddress');
      }, 3000);
    }
  };

  useEffect(() => {
    AddressService.fetchAllCountries();
  }, []);

  const validateGST = async (gstNumber: string) => {
    if (gstNumber.length === 15) {
      AddressService.validateGST({
        object: {
          gstin: `${gstNumber}`,
          is_tcs_gstin: false,
          is_transporter_id: false,
        },
      })
        .then(response => {
          if (response?.status) {
            setGstError(false);
          }
        })
        .catch(() => {
          setGstError(true);
        });
    }
  };

  return (
    <View style={{height: '92%'}}>
      <FormHeading />
      <Divider />
      <View style={styles.checkBox}>
        <BouncyCheckbox
          fillColor={FBColors.primary}
          unfillColor="transparent"
          isChecked={isCheckedCheckbox}
          iconStyle={{borderColor: FBColors.primary}}
          disableBuiltInState
          onPress={handleCheckboxToggle}
          innerIconStyle={{borderRadius: 10}}
        />
        <Text size="sm" color={isCheckedCheckbox ? 'primary' : 'neutral'}>
          My shipping and billing address are the same.
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View>
          <Text color="steelBlue" size="sm">
            GST Number
          </Text>
          <Divider />
          <Controller
            control={control}
            rules={{required: false}}
            render={({field: {onChange, value, onBlur}}) => (
              <BottomSheetTextInput
                maxLength={15}
                autoCapitalize="characters"
                placeholderTextColor={FBColors.placeHolderPrimary}
                onChangeText={text => onChange(text.toUpperCase())}
                // onBlur={() => {
                //   onBlur();
                //   if (value) {
                //     // validateGST(value);
                //   }
                // }}
                value={value as string}
                style={[
                  commonInputStyles,
                  {
                    height: 36,
                    fontSize: 14,
                    color: FBColors.neutral,
                    paddingVertical: 0,
                  },
                ]}
              />
            )}
            name="gst"
          />
          {!errors?.gst && gstError ? (
            <View style={styles.errorContainer}>
              <Text color="error" size="xs">
                GST validation failed. Try with a different GST No
              </Text>
            </View>
          ) : null}
          {errors?.gst ? (
            <View style={styles.errorContainer}>
              <Text color="error" size="xs">
                {errors?.gst?.message}
              </Text>
            </View>
          ) : null}
        </View>

        {/* company name */}
        {/* <Divider height={16} />
        <View>
          <View style={{flexDirection: 'row'}}>
            <Text color="steelBlue" size="sm">
              Organization name
            </Text>
            <Text style={{color: 'red', marginLeft: 2}}>*</Text>
          </View>
          <Divider />
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <BottomSheetTextInput
                placeholderTextColor={FBColors.placeHolderPrimary}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                style={[
                  commonInputStyles,
                  {
                    height: 36,
                    fontSize: 14,
                    color: FBColors.neutral,
                    paddingVertical: 0,
                  },
                ]}
              />
            )}
            name="companyName"
          />
          {errors?.companyName ? (
            <View style={styles.errorContainer}>
              <Text color="error" size="xs">
                {errors?.companyName?.message}
              </Text>
            </View>
          ) : null}
        </View> */}

        {/* plot */}
        {/* <Divider height={16} />
        <View>
          <View style={{flexDirection: 'row'}}>
            <Text color="steelBlue" size="sm">
              Plot/Building
            </Text>
            <Text style={{color: 'red', marginLeft: 2}}>*</Text>
          </View>
          <Divider />
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <BottomSheetTextInput
                placeholderTextColor={FBColors.placeHolderPrimary}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                style={[
                  commonInputStyles,
                  {
                    height: 36,
                    fontSize: 14,
                    color: FBColors.neutral,
                    paddingVertical: 0,
                  },
                ]}
              />
            )}
            name="houseNumber"
          />
          {errors?.houseNumber ? (
            <View style={styles.errorContainer}>
              <Text color="error" size="xs">
                {errors?.houseNumber?.message}
              </Text>
            </View>
          ) : null}
        </View> */}

        {/* plot */}
        <Divider height={16} />
        <View>
          <View style={{flexDirection: 'row'}}>
            <Text color="steelBlue" size="sm">
              Address
            </Text>
            <Text style={{color: 'red', marginLeft: 2}}>*</Text>
          </View>
          <Divider />
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <BottomSheetTextInput
                placeholderTextColor={FBColors.placeHolderPrimary}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                style={[
                  commonInputStyles,
                  {
                    height: 36,
                    fontSize: 14,
                    color: FBColors.neutral,
                    paddingVertical: 0,
                  },
                ]}
              />
            )}
            name="addressLine"
          />
          {errors?.addressLine ? (
            <View style={styles.errorContainer}>
              <Text color="error" size="xs">
                {errors?.addressLine?.message}
              </Text>
            </View>
          ) : null}
        </View>

        {/* phone number */}
        <Divider height={16} />
        <View>
          <View style={{flexDirection: 'row'}}>
            <Text color="steelBlue" size="sm">
              Phone Number
            </Text>
            <Text style={{color: 'red', marginLeft: 2}}>*</Text>
          </View>
          <Divider />
          <BottomSheetTextInput
            editable={false}
            value={`+91${
              user ? user[0]?.phone_number?.replace(/^(\+91)/, '').trim() : ''
            }`}
            style={{
              backgroundColor: FBBackground.input,
              borderWidth: 1,
              borderColor: FBBorders.input, // Replace with the image border color
              padding: 10,
              height: 40,
              borderRadius: 8,
              color: FBColors.disabledInputText,
            }}
          />
        </View>

        {/* city */}
        <Divider height={16} />
        {/* state and city */}
        <View style={{flexDirection: 'row', columnGap: 16}}>
          {/* state list */}
          <ActiveStateBilling />

          {/* city list */}
          <ActiveCityBilling />
        </View>
        {/* postal code */}
        <Divider height={16} />
        <View>
          <View style={{flexDirection: 'row'}}>
            <Text color="steelBlue" size="sm">
              Postal Code
            </Text>
            <Text style={{color: 'red', marginLeft: 2}}>*</Text>
          </View>
          <Divider />
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <BottomSheetTextInput
                placeholderTextColor={FBColors.placeHolderPrimary}
                maxLength={6}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={[
                  commonInputStyles,
                  {
                    height: 36,
                    fontSize: 14,
                    color: FBColors.neutral,
                    paddingVertical: 0,
                  },
                ]}
              />
            )}
            name="pinCode"
          />
          {errors?.pinCode ? (
            <View style={styles.errorContainer}>
              <Text color="error" size="xs">
                {errors?.pinCode?.message}
              </Text>
            </View>
          ) : null}
        </View>
        {billingAddressList?.length > 0 ? (
          <>
            <Divider height={20} />
            <Button
              loading={loaders.addNewAddress}
              onPress={() => {
                deliveryStore.setState(state => ({
                  ...state,
                  billingAddressView: 'select',
                }));
              }}
              variant="outlined">
              Select from existing addresses
            </Button>
          </>
        ) : null}
        <Divider height={16} />

        <Button
          disabled={!isValid || !selectedState || !selectedCity || gstError}
          loading={loaders.addNewAddress}
          onPress={() => {
            handleSubmit(addAddress)();
          }}
          variant="solid">
          Save
        </Button>
      </ScrollView>
    </View>
  );
};

const FormHeading: React.FC = () => {
  return (
    <View style={styles.heading}>
      <Text size="lg" weight="500">
        Add Billing Address
      </Text>
      <Divider height={16} />
      <Text size="sm" color="complementary" style={{maxWidth: '90%'}}>
        Add a billing address to your FuelBuddy profile to simplify payment
        processing and ensure accurate invoice generation for fuel deliveries.
      </Text>
    </View>
  );
};

export default BillingAddressForm;

const styles = StyleSheet.create({
  heading: {
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderColor: FBBorders.secondary,
  },

  errorContainer: {
    paddingLeft: 4,
    paddingTop: 4,
  },
  checkBox: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
});
