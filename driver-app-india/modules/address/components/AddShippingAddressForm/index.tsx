// !todo: delete this

//dependencies
import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import * as z from 'zod';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal';

// local storage (mmkv)
import {localStorage} from '@/utils/localStorage';

//imports and components
// import {CustomBottomFormInput, CustomSelectInput} from '..';
import {Button, Divider, Input, Text, TextButton} from '@/components';

//add in future if needed
// import {ShippingBillingSameCheckbox} from '@/modules/delivery/components';

//services
import {AddressService, LocationService} from '@/services';

//stores
import addressStore from '@/modules/address/store';
import {ScaledSheet, ms} from 'react-native-size-matters';

//types
import {StackNavigationProp} from '@react-navigation/stack';
import {DeliveryStackParamList} from '@/navigator/containers/Delivery';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {locationStore} from '@/globalStore';
import {FetchAllCountriesQuery} from '@/generated/graphql';
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {AddressTypeChips, CityList, StateList} from '../AddNewAddress';

//zod schema for validation
const schema = z.object({
  // locationName: z.string().optional(),
  // addressLine1: z.string().min(1, {message: 'Address line is required'}),
  addressLine: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, {message: 'Postal code must be a 6 digit number'}),
  // state: z.string().min(1, {message: 'State is required'}),
  // city: z.string().min(1, {message: 'City is required'}),
  // country: z.string().optional(),
  // houseNumber: z.string().optional(),
  // nearbyLandmark: z.string().optional(),
});
type FormFields = z.infer<typeof schema>;

type Props = {
  onAddNoteButtonPress: () => void;
  addressNote: string;
  serviceabilityPartner: any;
};
const AddShippingAddressForm: React.FC<Props> = ({
  onAddNoteButtonPress,
  addressNote,
  serviceabilityPartner,
}) => {
  const addressComponents = locationStore.use.addressComponents();

  //states
  // const [statesList, setStatesList] =
  //   useState<FetchAllCountriesQuery['country'][0]['states']>();

  // const [citiesList, setCitiesList] =
  //   useState<FetchAllCountriesQuery['country'][0]['states'][0]['cities']>();

  const [selectedState, setSelectedState] = useState<
    FetchAllCountriesQuery['country'][0]['states'][0] | undefined
  >();

  const [selectedCity, setSelectedCity] = useState<
    FetchAllCountriesQuery['country'][0]['states'][0]['cities'][0] | undefined
  >();

  const [buddyCanAvailable, setBuddyCanAvailable] = useState<boolean>(false);

  const currentLocationAddress = addressStore.use.currentLocationAddress();

  const [showStateList, setShowStateList] = useState<boolean>(false);
  const [showCityList, setShowCityList] = useState<boolean>(false);

  return (
    <BottomSheetView style={{flex: 1}}>
      <View
        style={{
          borderBottomWidth: 0.5,
          borderBottomColor: FBBorders.secondary,
          paddingBottom: 16,
        }}>
        <Text size="lg" weight="bold">
          Add Address
        </Text>
        <Divider />
        <Text size="sm" color="complementary" style={{maxWidth: '90%'}}>
          Adding an address to your FuelBuddy profile is crucial for ensuring
          seamless and efficient order processing.
        </Text>
      </View>
      <Divider />
      <View style={{flex: 1, borderWidth: 1}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{paddingBottom: 20}}
          contentContainerStyle={{paddingBottom: 24}}>
          <View>
            {/* <AddressTypeChips /> */}
            <Divider height={20} />
            {/* current location - disabled */}
            <View>
              <Text size="sm" color="steelBlue" weight="600">
                Current Location
              </Text>
              <Divider />
              <BottomSheetTextInput
                style={styles.textInput}
                numberOfLines={1}
                maxLength={129}
                editable={false}
                value={addressComponents?.formattedAddress.substring(0, 128)}
              />
            </View>

            {/* address line */}
            <Divider height={20} />
            <View>
              <Text size="sm" color="steelBlue" weight="600">
                Address Line
              </Text>
              <Divider />
              <BottomSheetTextInput
                placeholder="Enter complete address"
                placeholderTextColor={FBColors.placeHolderPrimary}
                multiline={true}
                numberOfLines={2}
                maxLength={129}
                style={[
                  styles.textInput,
                  {height: 60, justifyContent: 'flex-start'},
                ]}
              />
            </View>

            {/* state and city */}
            <Divider height={20} />
            <View style={{flexDirection: 'row', columnGap: 16}}>
              <View style={{flex: 1}}>
                <Text size="sm" color="steelBlue" weight="600">
                  State
                </Text>
                <Divider />
                <Pressable
                  onPress={() => {
                    setShowStateList(true);
                  }}
                  style={[styles.textInput, {justifyContent: 'center'}]}>
                  <Text lines={1}>{selectedState?.name}</Text>
                </Pressable>
                <Modal
                  onBackdropPress={() => {
                    setShowStateList(false);
                  }}
                  isVisible={showStateList}
                  backdropTransitionOutTiming={0}
                  backdropTransitionInTiming={1000}
                  backdropOpacity={0.5}
                  animationIn="slideInUp"
                  animationOut="slideOutDown">
                  <StateList
                    closeList={() => {
                      setShowStateList(false);
                    }}
                  />
                </Modal>
              </View>

              {/* cities list */}
              <View style={{flex: 1}}>
                <Text size="sm" color="steelBlue" weight="600">
                  City
                </Text>
                <Divider />
                <Pressable
                  onPress={() => {
                    setShowCityList(true);
                  }}
                  style={[styles.textInput, {justifyContent: 'center'}]}>
                  <Text lines={1}>{selectedState?.name}</Text>
                </Pressable>
                <Modal
                  onBackdropPress={() => {
                    setShowCityList(false);
                  }}
                  isVisible={showCityList}
                  backdropTransitionOutTiming={0}
                  backdropTransitionInTiming={1000}
                  backdropOpacity={0.5}
                  animationIn="slideInUp"
                  animationOut="slideOutDown">
                  <CityList
                    closeList={() => {
                      setShowCityList(false);
                    }}
                  />
                </Modal>
              </View>
            </View>

            {/* postal code */}
            <Divider height={20} />
            <View>
              <Text size="sm" color="steelBlue" weight="600">
                Postal Code
              </Text>
              <Divider />
              <BottomSheetTextInput
                placeholder="Enter Postal Code"
                placeholderTextColor={FBColors.placeHolderPrimary}
                maxLength={129}
                style={[styles.textInput]}
              />
            </View>

            {/* postal code */}
            <Divider height={20} />
            <View>
              <Text size="sm" color="steelBlue" weight="600">
                Country
              </Text>
              <Divider />
              <BottomSheetTextInput
                placeholderTextColor={FBColors.placeHolderPrimary}
                maxLength={129}
                style={[styles.textInput]}
              />
            </View>

            {/* Save button */}
            <Divider height={20} />
            <View>
              <Button variant="solid" onPress={() => {}}>
                Save
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </BottomSheetView>
  );
};

const styles = ScaledSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    height: 36,
    backgroundColor: FBBackground.input,
    borderRadius: 6,
    paddingVertical: 0,
    paddingLeft: 10,
    color: FBColors.steelBlue,
  },

  buddyCanDelivery: {
    flexDirection: 'row',
    borderRadius: '40@ms',
    backgroundColor: '#FEF8DF',
    borderColor: '#D8B98D',
    borderWidth: 1,
    width: '60%',
    padding: '8@ms',
  },
  inputContainer: {
    marginBottom: '20@ms',
  },
  label: {
    fontSize: '16@ms', // Adjust based on the image
    fontWeight: 'bold',
    color: FBColors.darkGray, // Replace with the label text color
    marginBottom: '5@ms', // Adjust spacing
  },
  errorText: {
    color: 'red',
    marginVertical: '10@ms',
  },
});

export default AddShippingAddressForm;
