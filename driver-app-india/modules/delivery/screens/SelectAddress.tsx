// dependencies
import {View, FlatList, Platform} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {ScaledSheet, vs, s} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';

// components
import {
  Text,
  Divider as Separator,
  HeaderAvoidingContainer,
  SimpleBottomSheet,
  FullScreenLoader,
  Button,
} from '@/components';
import {AddressCard} from '@/modules/fillupRequest/components';
import {SearchBox} from '../components/address';
import {LocationPermissionRequest} from '@/modules/location/components';

// store
import {addressStore, deliveryStore} from '@/globalStore';

// services
import {LocationService} from '@/services';
import {retrieveCoordsFromString} from '@/utils/general';

// styles
import {FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';

//types
import {FetchAddressByTypeQuery} from '@/generated/graphql';
import {StackScreenProps} from '@react-navigation/stack';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {DeliveryStackParamList} from '@/navigator/containers/Delivery';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {commonBottomSheetView} from '@/styles';
import {Permission, PERMISSIONS} from 'react-native-permissions';
import {checkPermissions} from '@/utils/permissions';

const ItemSeparator = React.memo(() => <Separator />);
const loaderCount = Array.from({length: 6}, (_, index) => index); // number of loaders. depends on screen size

type Props = StackScreenProps<DeliveryStackParamList, 'select-address'>;

const SelectAddress: React.FC<Props> = ({navigation}) => {
  const shippingAddresses = addressStore.use.shippingAddresses();
  const loaders = addressStore.use.loaders();
  const stopLoader = addressStore.use.stopLoader();

  const [addressesToShow, setAddressesToShow] = useState<
    FetchAddressByTypeQuery['organization_address'] | []
  >([]);

  const [addressesToShowOriginal, setAddressesToShowOriginal] = useState<
    FetchAddressByTypeQuery['organization_address'] | []
  >([]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showLoader, setShowLoader] = useState<boolean>(false);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const changeText = (value: string) => {
    setSearchTerm(value);
  };

  const selectAddress = async (
    address: FetchAddressByTypeQuery['organization_address'][0],
  ) => {
    setShowLoader(true);
    deliveryStore.setState(state => ({
      ...state,
      isError: [...state.isError.filter(error => error !== 'address')],
    }));

    const coords = retrieveCoordsFromString(address.location);

    /**
     * Before we can select an address, we need to check if the address is serviceable.
     * Here we call the checkServiceability method from the LocationService class.
     * This method returns the partners (if any) that are serviceable at the given location.
     * If the response is not null/undefined, we set the selectedShippingAddress in the deliveryStore.
     * This is a necessary step before we can proceed to the next step in the delivery flow.
     */
    const response = await LocationService.checkServiceability({
      latitude: coords.lat,
      longitude: coords.lng,
    });

    if (response && response?.partner_localities) {
      // /**
      //  * If serviceable, we fetch the products of that particular partner.
      //  */

      // /**
      //  * Then we fetch the timeslots of that partner
      //  */
      // DeliveryService.fetchDeliveryDatesWithSlots({
      //   date: DateTime.now().toISO() as string,
      //   latitude: coords.lat,
      //   longitude: coords.lng,
      // });

      // /**
      //  * If the address is serviceable, we set the shipping address and deliveryPartner in the deliveryStore
      //  * Then take the user back to the previous screen.
      //  */
      deliveryStore.setState(state => ({
        ...state,
        selectedShippingAddress: address,
        deliveryPartner: response,
        selectedBillingAddress: undefined,
        selectedDate: '',
        quantity: '',
        selectedSlot: undefined,
      }));
      setTimeout(() => {
        setShowLoader(false);
      }, 300);
      navigation.goBack();
    } else {
      /**
       * Else, we show a toast message to the user and clear any shipping address in the deliveryStore.
       */

      Toast.show({
        type: 'error',
        text1: 'We are not serving at this location',
        text2: 'Please select a different address for delivery',
      });

      deliveryStore.setState(state => ({
        ...state,
        selectedShippingAddress: undefined,
        deliveryPartner: undefined,
        selectedBillingAddress: undefined,
        selectedDate: '',
        selectedSlot: undefined,
        quantity: '',
      }));

      setShowLoader(false);
    }
  };

  const addNewAddress = async () => {
    let permission: Permission;

    Platform.OS === 'ios'
      ? (permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
      : (permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

    const locPermission = await checkPermissions([permission]);

    if (locPermission[permission] !== 'granted') {
      openBottomSheet();
      return;
    }

    navigation.navigate('add-shipping-new-user');
  };

  useEffect(() => {
    if (shippingAddresses.length) {
      setAddressesToShow(
        shippingAddresses.filter(address => {
          return address.is_active;
        }),
      );
      setAddressesToShowOriginal(
        shippingAddresses.filter(address => {
          return address.is_active;
        }),
      );
      stopLoader('fetchAddresses');
    }
  }, [shippingAddresses, stopLoader]);

  useEffect(() => {
    if (!searchTerm) {
      setAddressesToShow(addressesToShowOriginal);
      return;
    }

    if (searchTerm) {
      const filteredAddresses = addressesToShowOriginal.filter(address => {
        return (
          address?.pincode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          address?.address_line1
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      });
      setAddressesToShow(filteredAddresses);
    }
  }, [addressesToShowOriginal, searchTerm]);

  return (
    <HeaderAvoidingContainer paddingHorizontal={0}>
      <View style={[styles.container]}>
        <SearchBox value={searchTerm} changeText={changeText} />
      </View>
      <View style={styles.divider}>
        <Text weight="600" color="neutral">
          Saved Addresses
        </Text>
        <Button
          variant="solid"
          style={{height: 30, paddingHorizontal: 10, borderRadius: 6}}
          onPress={addNewAddress}
          textStyle={{
            fontSize: 16,
          }}>
          Add new address
        </Button>
      </View>

      {loaders.fetchAddresses ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
          }}>
          {loaderCount.map(item => {
            return (
              <React.Fragment key={item}>
                <SkeletonPlaceholder>
                  <SkeletonPlaceholder.Item
                    height={140}
                    width={'100%'}
                    borderRadius={10}
                  />
                </SkeletonPlaceholder>
                <Separator height={24} />
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <View
          style={{
            marginTop: 20,
            paddingHorizontal: 16,
            flex: 1,
            paddingBottom: 8,
          }}>
          {
            addressesToShow?.length ? (
              <FlatList
                data={addressesToShow}
                renderItem={address => (
                  <AddressCard
                    address={address.item}
                    disabled={showLoader}
                    onPress={() => {
                      selectAddress(address.item);
                    }}
                  />
                )}
                keyExtractor={address => address.id}
                ItemSeparatorComponent={ItemSeparator}
              />
            ) : null //todo: implement NoSearchResult component later
          }
        </View>
      )}

      <SimpleBottomSheet
        ref={bottomSheetRef}
        closeSheet={closeBottomSheet}
        snapPoints={['30%']}>
        <BottomSheetView style={commonBottomSheetView}>
          <LocationPermissionRequest closeBottomSheet={closeBottomSheet} />
        </BottomSheetView>
      </SimpleBottomSheet>

      <FullScreenLoader showLoader={showLoader} />
    </HeaderAvoidingContainer>
  );
};

export default SelectAddress;

const styles = ScaledSheet.create({
  container: {
    paddingHorizontal: '16@s',
  },

  divider: {
    marginTop: '24@vs',
    paddingVertical: '8@vs',
    paddingHorizontal: '16@s',
    backgroundColor: FBBackground.subtleBlack,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputStyles: {
    borderRadius: 0,
    borderWidth: 0,
    paddingLeft: 0,
    width: '85%',
    fontSize: FontSizeEnum.base,
  },
  searchbar: {
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    backgroundColor: FBBackground.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    height: vs(44),
    paddingHorizontal: s(10),
    columnGap: s(8),
  },

  addAddressBtn: {
    width: '55%',
    marginVertical: '20@vs',
  },
});
