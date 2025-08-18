// dependencies
import {Keyboard, ScrollView, StyleSheet, View} from 'react-native';
import React from 'react';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
// import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// store
import {businessStore, deliveryStore, locationStore} from '@/globalStore';

// components
import {Button, Divider, Text, FullScreenLoader} from '@/components';
import {
  ActiveCity,
  ActiveState,
  AddressLine,
  AddressNote,
  AddressTypeChips,
  PostalCode,
} from './index';

// services
import {AddressService} from '@/services';

// types and styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {Address_Type_Enum} from '@/generated/graphql';

interface Props {
  closeBottomSheet: () => void;
  goBack: () => void;
}

const AddNewAddressForm: React.FC<Props> = ({closeBottomSheet, goBack}) => {
  const addressComponents = locationStore.use.addressComponents();
  const selectedCountry = locationStore.use.selectedCountry();
  const addressLine = locationStore.use.addressLine();
  const selectedState = locationStore.use.selectedState();
  const selectedCity = locationStore.use.selectedCity();
  const postalCode = locationStore.use.postalCode();
  const addressType = locationStore.use.addressType();
  const deliveryPartner = locationStore.use.deliveryPartner();
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const addressNote = locationStore.use.addressNote();

  const startLoader = locationStore.use.startLoader();
  const stopLoader = locationStore.use.stopLoader();
  const loaders = locationStore.use.loaders();

  const addAddress = async () => {
    Keyboard.dismiss();

    startLoader('addNewAddress');

    const addressExists = await AddressService.checkIfAddressExists({
      organization_user_id: activeDeliveryOrgUser?.id,
      address_line1:
        addressComponents?.formattedAddress.substring(0, 128) || '',
      city_id: selectedCity?.id || '',
      country_id: selectedCountry?.id || '',
      pincode: postalCode,
      state_id: selectedState?.id || '',
    });

    if (addressExists.length) {
      Toast.show({
        type: 'error',
        text1: 'Address already exists',
        text2: 'Please choose a different address',
      });

      stopLoader('addNewAddress');

      return;
    }

    resetDeliveryStore();
    const pinCodeRegex = /^[1-9][0-9]{5}$/;
    if (!addressLine) {
      Toast.show({
        type: 'error',
        text1: 'Address line is required',
      });
      return;
    }
    if (postalCode.length > 6 || !pinCodeRegex.test(postalCode)) {
      Toast.show({
        type: 'error',
        text1: 'Pin code is invalid',
      });
      return;
    }

    const payload = {
      address_line1:
        addressComponents?.formattedAddress.substring(0, 128) || '',
      address_line2: addressLine || '',
      city_id: selectedCity?.id || '',
      country_id: selectedCountry?.id || '',
      is_active: true,
      landMark: '',
      location: `(${addressComponents?.coordinates?.lng},${addressComponents?.coordinates?.lat})`,
      pincode: postalCode,
      organization_user_id: activeDeliveryOrgUser?.id,
      state_id: selectedState?.id || '',
      street_address:
        addressComponents?.formattedAddress.substring(0, 128) || '',
      name: addressType,
      address_type: Address_Type_Enum.Shipping,
      ownership: 'INDIVIDUAL',
      instruction: addressNote || '',
      house_number: '',
    };

    await AddressService.addNewCustomerAddress({
      object: payload,
    })
      .then(async response => {
        locationStore.setState(state => ({
          ...state,
          selectedState: undefined,
          selectedCity: undefined,
          addressType: 'home',
          postalCode: '',
          addressLine: '',
          addressNote: '',
        }));
        closeBottomSheet();

        Toast.show({
          type: 'success',
          text1: 'Added shipping address successfully',
          visibilityTime: 2000,
        });

        if (response.addCustomerAddress?.code == '200') {
          const addressList = await AddressService.getShippingAddresses({
            organization_user_id: activeDeliveryOrgUser?.id as string,
            address_type: Address_Type_Enum.Shipping,
          });

          const latestAddress = addressList.find(address => {
            return address.id === response.addCustomerAddress?.address?.id;
          });

          deliveryStore.setState(state => ({
            ...state,
            selectedShippingAddress: latestAddress,
            deliveryPartner: deliveryPartner,
          }));
        }

        setTimeout(() => {
          stopLoader('addNewAddress');
        }, 1000);
        goBack();
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Error adding shipping address',
        });
      });
  };

  return (
    <View style={{height: '93%'}}>
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
      <View style={{flex: 1}}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 20}}>
          {/* address type */}
          <Divider height={20} />
          <AddressTypeChips />

          {/* current location - disabled */}
          <Divider height={20} />
          <View>
            <Text size="sm" color="steelBlue" weight="600">
              Current Location
              <Text color="error" weight="600" size="sm">
                *
              </Text>
            </Text>
            <Divider />
            <BottomSheetTextInput
              style={styles.textInput}
              numberOfLines={1}
              maxLength={129}
              editable={false}
              value={addressComponents?.formattedAddress}
            />
          </View>

          {/* address line */}
          <Divider height={20} />
          <AddressLine />

          {/* address note */}
          <Divider height={20} />
          <AddressNote />

          {/* state and city */}
          <Divider height={20} />
          <View style={{flexDirection: 'row', columnGap: 16}}>
            {/* state list */}
            <ActiveState />

            {/* city list */}
            <ActiveCity />
          </View>

          {/* postal code */}
          <Divider height={20} />
          <PostalCode />

          {/* country */}
          <Divider height={20} />
          <View>
            <Text size="sm" color="steelBlue" weight="600">
              Country
              <Text color="error" weight="600" size="sm">
                *
              </Text>
            </Text>
            <Divider />
            <BottomSheetTextInput
              placeholderTextColor={FBColors.placeHolderPrimary}
              maxLength={129}
              style={[styles.textInput, {color: FBColors.disabledInputText}]}
              editable={false}
              value={selectedCountry?.name || ''}
            />
          </View>

          {/* Save button */}
          <Divider height={20} />
          <View>
            <Button
              variant="solid"
              onPress={addAddress}
              disabled={!addressLine || !postalCode || !selectedCity}>
              Save Address
            </Button>
          </View>
        </ScrollView>
      </View>
      <FullScreenLoader
        showLoader={loaders.addNewAddress}
        loaderText="Adding Address"
      />
    </View>
  );
};

export default AddNewAddressForm;

const styles = StyleSheet.create({
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
    borderRadius: 40,
    backgroundColor: '#FEF8DF',
    borderColor: '#D8B98D',
    borderWidth: 1,
    width: '60%',
    padding: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16, // Adjust based on the image
    fontWeight: 'bold',
    color: FBColors.darkGray, // Replace with the label text color
    marginBottom: 5, // Adjust spacing
  },
  errorText: {
    color: 'red',
    marginVertical: 10,
  },
});
