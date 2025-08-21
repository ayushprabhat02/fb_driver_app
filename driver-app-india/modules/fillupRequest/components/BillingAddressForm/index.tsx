//dependencies
import React from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import * as z from 'zod';
import {ms} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';
// local storage (mmkv)
import {localStorage, getActiveDelOrgUserId} from '@/utils/localStorage';
//imports and components
import {
  CustomBottomFormInput,
  CustomSelectInput,
} from '@/modules/fillupRequest/components';
import {Button, Text, Divider} from '@/components';
//stores
import {deliveryStore, addressStore, homeStore} from '@/globalStore';
//services
import AddressService from '@/modules/fillupRequest/services';
//types
import {Address_Type_Enum} from '@/generated/graphql';
import {StyleSheet, View} from 'react-native';
import {FBBorders, FBColors} from '@/types/styles';
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {commonInputStyles} from '@/styles';
//zod schema for validation
const schema = z.object({
  gst: z
    .string()
    .regex(/^[0-9A-Z]{15}$/i, {message: 'Invalid GST number'})
    .optional(),
  companyName: z.string().optional(),
  plot: z.string().optional(),
  addressLine: z.string().min(1, {message: 'Address line is required'}),
  pinCode: z
    .string()
    .regex(/^\d{6}$/, {message: 'Pincode must be a 6 digit number'}),
  state: z.string().min(1, {message: 'State is required'}),
  city: z.string().min(1, {message: 'City is required'}),
  country: z.string().optional(),
  houseNumber: z.string().optional(),
  landmark: z.string().optional(),

  addressNote: z.string().optional(),
});
type FormFields = z.infer<typeof schema>;

type Props = {
  onPress: () => void;
};
const BillingAddressForm: React.FC<Props> = ({onPress}) => {
  //states
  const [states, setStates] = React.useState([]);
  const [cities, setCities] = React.useState([]);
  const [selectedState, setSelectedState] = React.useState('');
  const [state, setState] = React.useState({});
  const currentSelectedAddress = deliveryStore.getState()
    .selectedShippingAddress
    ? deliveryStore.getState().selectedShippingAddress
    : homeStore.getState().userLocationAddress;

  //to fetch countries and states and set states
  React.useEffect(() => {
    const fetchCountries = async () => {
      await AddressService.fetchAllCountries();
      setStates(addressStore.getState().deliveryStates);
    };
    fetchCountries();
  }, []);
  //to set cities for that state when selected state changes
  React.useEffect(() => {
    if (selectedState) {
      setCities(
        addressStore
          .getState()
          .deliveryCountry?.states?.find(
            (state: any) => state?.id === selectedState,
          )
          ?.cities.map((city: any) => {
            return {
              label: city?.name,
              value: city?.id,
            };
          }),
      );
      setState(
        addressStore
          .getState()
          .deliveryCountry?.states?.find(
            (s: any) => s?.id === selectedState,
          ) || {
          label: '',
          value: '',
          countryId: '',
        },
      );
    }
  }, [selectedState, states]);
  //default values for fields
  const defaultValues = {
    locationName: 'home',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    houseNumber: '',
    landmark: '',
    pinCode: '',
    gst: '',
    addressNote: '',
  };

  const {
    control,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  //submit function
  const addAddress = async (data: FormFields) => {
    const coords = currentSelectedAddress?.location
      ? currentSelectedAddress?.location?.slice(1, -1).split(',')
      : currentSelectedAddress?.coordinates;
    const lng = currentSelectedAddress?.location
      ? parseFloat(coords[0])
      : coords.longitude;
    const lat = currentSelectedAddress?.location
      ? parseFloat(coords[1])
      : coords.latitude;
    try {
      const payload = {
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        city_id: data?.city,
        country_id: (state as any).country_id,
        is_active: true,
        landMark: data.landmark,
        location: `(${lng},${lat})`,
        pincode: data.pinCode,
        organization_user_id: localStorage.getString(
          'deliveryOrgUserId',
        ) as string,
        state_id: data.state,
        street_address: data.addressLine1,
        address_type: 'BILLING',
        ownership: 'INDIVIDUAL',
        instruction: data?.addressNote,
        house_number: data.houseNumber,
        // gst_number: data.gst?.toUpperCase(),
        gst_number: '',
        name: '',
      };
      await AddressService.addNewBillingAddress({...payload} as any);
      //to fetch all billing addresses again
      await AddressService.getBillingAddresses({
        address_type: Address_Type_Enum.Billing,
        organization_user_id: getActiveDelOrgUserId(),
      });
      //show toast of success
      Toast.show({
        type: 'success',
        text1: 'Added billing address successfully',
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
      onPress && onPress();
    }
  };

  return (
    <View style={{height: '90%'}}>
      <FormHeading />
      <Divider />
      <View style={{flex: 1}}>
        <ScrollView>
          <View>
            <Text color="steelBlue" size="sm">
              GST Number
            </Text>
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
              name="gst"
            />
          </View>

          {/* company name */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              Company Name
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
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
              name="gst"
            />
          </View>

          {/* plot */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              Plot/Building
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
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
              name="gst"
            />
          </View>

          {/* plot */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              Address
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
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
              name="gst"
            />
          </View>

          {/* phone number */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              Phone Number
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
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
              name="gst"
            />
          </View>

          {/* city */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              City
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
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
              name="gst"
            />
          </View>
          {/* postal code */}
          <Divider height={16} />
          <View>
            <Text color="steelBlue" size="sm">
              Postal Code
            </Text>
            <Divider />
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({field: {onChange, value}}) => (
                <BottomSheetTextInput
                  placeholderTextColor={FBColors.placeHolderPrimary}
                  onChangeText={onChange}
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
              name="gst"
            />
          </View>
          <Divider height={16} />
          <Button onPress={() => {}} variant="outlined">
            Save
          </Button>
        </ScrollView>
      </View>
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
        Adding billing address to your FuelBuddy business profile is essential
        for efficient order placement.
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
});
