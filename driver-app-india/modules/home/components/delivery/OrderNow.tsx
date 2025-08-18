// todo: break down into smaller components
// dependencies
import {Dimensions, Keyboard, Platform, Pressable, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {MapPin, CalendarBlank, Info} from 'phosphor-react-native';
import {vs, ms, ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import {DateTime} from 'luxon';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import analytics from '@react-native-firebase/analytics';

// components
import {
  Button,
  Divider,
  FullScreenLoader,
  SimpleBottomSheet,
  Text,
} from '@/components';
import ProductInput from '../delivery/ProductInput';
import Nozzle from '@/assets/home/nozzle.svg';

// services
import {AssetService, BusinessService, UserService} from '@/services';
import {getActiveDelOrgUserId} from '@/utils/localStorage';
import {checkPermissions} from '@/utils/permissions';
import {getBusinessRole} from '@/utils/general';

// store
import {
  addressStore,
  businessStore,
  deliveryStore,
  userStore,
} from '@/globalStore';

// types and styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {commonBottomSheetView, commonInputStyles} from '@/styles';
import Toast from 'react-native-toast-message';
import {Permission, PERMISSIONS} from 'react-native-permissions';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {LocationPermissionRequest} from '@/modules/location/components';
import {fetchCurrentLocation} from '@/utils/general';

//imports
import BuddyCan from '@/assets/delivery/buddy-can.svg';

type Props = {
  scrollToPosition: () => void;
  openBottomSheet: () => void;
};

const OrderNow: React.FC<Props> = ({scrollToPosition, openBottomSheet}) => {
  const navigation = useNavigation();

  const addressLoaders = addressStore.use.loaders();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const userRole = getBusinessRole(activeDeliveryOrgUser);

  const isError = deliveryStore.use.isError();
  const shippingAddresses = addressStore.use.shippingAddresses(); //todo: to be used in prod
  const selectedShippingAddress = deliveryStore.use.selectedShippingAddress();
  const deliveryProducts = deliveryStore.use.fetchedDeliveryProducts();
  const selectedDeliveryDate = deliveryStore.use.selectedDate();
  const selectedDeliverySlot = deliveryStore.use.selectedSlot();
  const selectedDeliveryProducts = deliveryStore.use.selectedDeliveryProducts();
  const selectedDate = deliveryStore.use.selectedDate();
  const selectedDateForDisplay = deliveryStore.use.selectedDateForDisplay();
  const selectedSlotForDisplay = deliveryStore.use.selectedSlot();
  const selectedSlot = deliveryStore.use.selectedSlot();
  const fetchedDeliveryProducts = deliveryStore.use.fetchedDeliveryProducts();
  const deliveryPartner = deliveryStore.use.deliveryPartner();
  const selectedQty = deliveryStore.use.quantity();
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();
  const [error, setError] = useState<string>('');
  // const loggedInUser = userStore.use.loggedInUser();

  const locality = deliveryPartner?.partner_localities?.[0]?.locality;

  // loaders
  const loaders = deliveryStore.use.loaders();
  const startLoader = deliveryStore.use.startLoader();
  const stopLoader = deliveryStore.use.stopLoader();

  // botton sheet modal for location permission
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const openLocationBottomSheet = () => {
    bottomSheetRef.current?.present();
  };
  const closeLocationBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  // bottom sheet modal for profile completion
  const bottomSheetRefProfile = useRef<BottomSheetModal>(null);
  const openBottomSheetProfile = () => {
    bottomSheetRefProfile.current?.present();
  };
  const closeBottomSheetProfile = () => {
    bottomSheetRefProfile.current?.close();
  };
  const selectShippingAddress = async () => {
    let permission: Permission;

    Platform.OS === 'ios'
      ? (permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
      : (permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

    const locPermission = await checkPermissions([permission]);

    if (locPermission[permission] !== 'granted') {
      openLocationBottomSheet();
      return;
    } else {
      await fetchCurrentLocation();
    }

    const activeDeliveryAddresses = shippingAddresses.filter(address => {
      return address.is_active;
    });

    if (!activeDeliveryAddresses.length) {
      navigation.navigate('delivery', {screen: 'add-shipping-new-user'});
    } else {
      navigation.navigate('delivery', {screen: 'select-address'});
    }
  };

  const selectDateTime = () => {
    if (!selectedShippingAddress) {
      deliveryStore.setState(state => ({
        ...state,
        isError: [...state.isError, 'address'],
      }));
      Toast.show({
        type: 'error',
        text1: 'Select delivery address',
        text2: 'Please select a delivery address first',
      });
      return;
    }
    openBottomSheet();
  };

  const getFormattedDate = (dateTime: string) => {
    return DateTime.fromFormat(dateTime, 'yyyy-MM-dd').toFormat('dd LLL yyyy');
  };

  const getStartTime = () => {
    // Parse start and end times
    const startTime = DateTime.fromFormat(
      selectedSlotForDisplay?.startTime as string,
      'HH:mm',
    );

    // Format the result with AM/PM
    return startTime.toLocaleString(DateTime.TIME_SIMPLE).toUpperCase();
  };

  const getEndTime = () => {
    const endTime = DateTime.fromFormat(
      selectedSlotForDisplay?.endTime as string,
      'HH:mm',
    );

    return endTime.toLocaleString(DateTime.TIME_SIMPLE).toUpperCase();
  };

  const placeOrderHandler = async () => {
    Keyboard.dismiss();

    // Log the event when Place Order is clicked
    await analytics().logEvent('Place_Order_Event', {
      userRole,
      selectedShippingAddress,
      selectedDate,
      selectedSlot,
      selectedQty,
      deliveryProducts: selectedDeliveryProducts.map(product => product?.id), // Example of passing product IDs
    });

    startLoader('fetchCustomerAssets');
    const loggedInUser = await UserService.getUserProfile();

    if (userRole === 'individual' && loggedInUser?.length) {
      if (
        !loggedInUser[0]?.first_name ||
        !loggedInUser[0]?.last_name ||
        !loggedInUser[0]?.email
      ) {
        openBottomSheetProfile();
        return;
      }
    }

    const currentOrgUser = await BusinessService.fetchOrgUserById({
      id: activeDeliveryOrgUser?.id,
    });

    if (userRole !== 'individual') {
      if (
        !currentOrgUser?.user?.first_name ||
        !currentOrgUser?.user?.last_name ||
        !currentOrgUser?.user?.email
      ) {
        openBottomSheetProfile();
        return;
      }
    }

    if (!selectedAssetsForDelivery.length) {
      startLoader('fetchCustomerAssets');
      const response = await AssetService.getAllCustomerAssets({
        organization_user_id: getActiveDelOrgUserId(),
        search_key: '%%',
      });

      const activeAssets = response.filter(asset => asset.is_active);

      deliveryStore.setState(state => ({
        ...state,
        selectedAssetsForDeliveryDetails: activeAssets,
      }));

      setTimeout(() => {
        stopLoader('fetchCustomerAssets');
      }, 1000);

      if (!activeAssets.length) {
        navigation.navigate('delivery', {screen: 'add-asset-new-user'});
        setTimeout(() => {
          stopLoader('fetchCustomerAssets');
        }, 1000);
        return;
      }
    }

    navigation.navigate('delivery', {screen: 'delivery-checkout'});
  };

  const onFuelQtyPress = () => {
    if (!selectedShippingAddress && !selectedDate && !selectedSlot) {
      deliveryStore.setState(state => ({
        ...state,
        isError: ['address', 'dateTime'],
      }));
      Toast.show({
        type: 'error',
        text1: 'Select delivery address and date',
        text2: 'Please select a delivery address and date first',
      });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      deliveryStore.setState(state => ({
        ...state,
        isError: ['dateTime'],
      }));
      Toast.show({
        type: 'error',
        text1: 'Select delivery date & time',
        text2: 'Please select a delivery date and time first',
      });
    }

    scrollToPosition();
  };

  // listen to state changes and remove error message when user selects a date and time
  useEffect(() => {
    if (selectedDate && selectedSlot) {
      deliveryStore.setState(state => ({
        ...state,
        isError: [...state.isError.filter(err => err !== 'dateTime')],
      }));
    }
  }, [selectedDate, selectedSlot]);

  return (
    <View style={styles.orderNowContainer}>
      <Text size="3xl" letterSpacing="widest" weight="400">
        Order Now
      </Text>
      <Divider height={20} />
      <View style={styles.orderNowSectionContainer}>
        {/* delivery address section */}
        <OrderNowSection
          isError={isError}
          id="address"
          onPress={selectShippingAddress}
          borderBottomWidth={0.5}
          placeholder="Select delivery address"
          label={
            selectedShippingAddress
              ? `${selectedShippingAddress?.address_line1}`
              : ''
          }>
          <MapPin size={20} color={FBColors.neutral} />
        </OrderNowSection>

        {/* delivery date & time section */}
        <OrderNowSection
          isError={isError}
          id="dateTime"
          onPress={selectDateTime}
          borderBottomWidth={0.5}
          placeholder="Select date & time"
          label={
            selectedDateForDisplay && selectedSlotForDisplay
              ? `${getFormattedDate(
                  selectedDateForDisplay,
                )}, ${getStartTime()} - ${getEndTime()}`
              : ''
          }>
          <CalendarBlank size={20} color={FBColors.neutral} />
        </OrderNowSection>
      </View>

      {/* product qty section */}
      <Divider height={20} />
      <View style={styles.productContainer}>
        <View style={{flexDirection: 'row', columnGap: 12}}>
          <Nozzle
            width={24}
            height={24}
            style={{
              transform: [{rotateY: '180deg'}],
            }}
          />
          <Text color="neutral">Fuel Quantity </Text>
        </View>

        <View
          style={{flexDirection: 'row', alignItems: 'flex-end', columnGap: 4}}>
          {deliveryProducts.length && selectedDate && selectedSlot ? (
            deliveryProducts.map(product => {
              return (
                <ProductInput
                  product={product}
                  key={product.id}
                  scrollToPosition={scrollToPosition}
                  error={error}
                  setError={setError}
                />
              );
            })
          ) : (
            <View
              style={[
                commonInputStyles,
                {
                  height: 36,
                  width: 140,
                  fontSize: 14,
                  color: FBColors.steelBlue,
                },
              ]}>
              <Pressable
                onPress={onFuelQtyPress}
                style={{
                  height: 36,
                  width: '75%',
                  paddingVertical: 0,
                  justifyContent: 'center',
                  paddingLeft: 0,
                }}>
                {selectedQty ? (
                  <Text color="steelBlue" style={{fontSize: 14}}>
                    {selectedQty}
                  </Text>
                ) : null}
              </Pressable>
              <Text
                color="steelBlue"
                weight="300"
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 4,
                }}>
                Litre.
              </Text>
            </View>
          )}
        </View>
      </View>
      <Divider height={16} />
      <Text>
        {fetchedDeliveryProducts.map(product => {
          return (
            <View
              key={product.product_variation_id}
              style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text size="sm" color="neutral" weight="600">
                {`${product?.product_variation?.product?.name}`} -{' '}
              </Text>
              <Text size="sm" color="primary" weight="600">
                {`${product?.sale_price}/litre`}
              </Text>
              {locality?.is_buddycan_delivery && (
                <Menu>
                  <MenuTrigger style={{marginLeft: 6}}>
                    <Info weight="bold" size={16} />
                  </MenuTrigger>
                  <MenuOptions customStyles={slideInMenuStyles}>
                    <MenuOption>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          position: 'relative',
                        }}>
                        <Text
                          weight="bold"
                          size="lg"
                          style={{
                            fontSize: 12,
                            marginLeft: 4,
                          }}>
                          Buddy can delivery available
                        </Text>
                        <BuddyCan style={styles.buddyIcon} />
                      </View>

                      <Divider height={6} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: FBColors.neutral,
                          marginLeft: 4,
                        }}>
                        Please make sure orders below 120 litres are in
                        multiples of 20
                      </Text>
                      <Divider height={6} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: FBColors.neutral,
                          marginLeft: 4,
                        }}>
                        ( ex. 40 litres, 60 litres etc. )
                      </Text>
                    </MenuOption>
                  </MenuOptions>
                </Menu>
              )}
            </View>
          );
        })}
      </Text>

      <Divider height={16} />
      <Button
        variant="solid"
        onPress={placeOrderHandler}
        loading={loaders.fetchCustomerAssets}
        disabled={
          !selectedShippingAddress ||
          !selectedDeliveryDate ||
          !selectedDeliveryProducts[0]?.product.qty ||
          !selectedDeliverySlot ||
          error
            ? true
            : false
        }>
        Place order
      </Button>
      {/* location permission  */}
      <SimpleBottomSheet
        ref={bottomSheetRef}
        closeSheet={closeLocationBottomSheet}
        snapPoints={['30%']}>
        <BottomSheetView style={commonBottomSheetView}>
          <LocationPermissionRequest
            closeBottomSheet={closeLocationBottomSheet}
          />
        </BottomSheetView>
      </SimpleBottomSheet>
      {/* <FullScreenLoader
        showLoader={addressLoaders.fetchAddresses}
        loaderText="Please wait"
      /> */}

      <SimpleBottomSheet
        ref={bottomSheetRefProfile}
        snapPoints={['45%']}
        closeSheet={closeBottomSheetProfile}>
        <BottomSheetView style={commonBottomSheetView}>
          <View
            style={{
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: FBBorders.secondary,
            }}>
            <Text size="lg" weight="600" color="neutral">
              Profile Incomplete
            </Text>
          </View>
          <Divider height={20} />
          <Text color="darkGray">
            You need to complete your profile before placing an order.
          </Text>
          <Divider height={20} />
          <Text color="darkGray">
            Please make sure to fill all mandatory fields -
          </Text>
          <Divider />
          <Text color="complementary" weight="600">
            First Name, Last Name and Email
          </Text>
          <Divider height={60} />
          <Button
            variant="solid"
            onPress={() => {
              closeBottomSheetProfile();
              navigation.navigate('user', {screen: 'user-profile'});
            }}>
            Complete Profile
          </Button>
        </BottomSheetView>
      </SimpleBottomSheet>
    </View>
  );
};

type OrderNowSectionProps = {
  isError: string[];
  id: 'address' | 'dateTime';
  borderBottomWidth: number;
  label: string;
  placeholder: string;
  children?: React.ReactNode;
  onPress: () => void;
};

const OrderNowSection: React.FC<OrderNowSectionProps> = ({
  id,
  isError,
  borderBottomWidth,
  label,
  placeholder,
  children,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.orderNowSection,
        {
          borderBottomWidth: borderBottomWidth,
          borderWidth: isError.includes(id) ? 1 : 0,
          borderTopRightRadius:
            id === 'address' ? (isError.includes(id) ? 32 : 0) : 0,
          borderTopLeftRadius:
            id === 'address' ? (isError.includes(id) ? 32 : 0) : 0,
          borderBottomLeftRadius:
            id === 'dateTime' ? (isError.includes(id) ? 32 : 0) : 0,
          borderBottomRightRadius:
            id === 'dateTime' ? (isError.includes(id) ? 32 : 0) : 0,
          borderColor: isError.includes(id)
            ? FBBorders.error
            : FBBorders.secondary,
        },
      ]}>
      {children}
      {label ? (
        <Text lines={1} style={{maxWidth: '90%'}}>
          {label}
        </Text>
      ) : (
        <Text color="disabledInputText">{placeholder}</Text>
      )}
    </Pressable>
  );
};

export default OrderNow;

const styles = ScaledSheet.create({
  orderNowContainer: {
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    borderRadius: 32,
    paddingVertical: vs(16),
    paddingHorizontal: ms(16),
    backgroundColor: FBBackground.white,
    // iOS shadow properties
    shadowColor: '#000', // Shadow color
    shadowOffset: {width: 0, height: 3}, // Offset for the shadow
    shadowOpacity: 0.2, // Shadow opacity
    shadowRadius: 4, // Blur radius for the shadow

    // android shadow properties
    elevation: 6,
  },

  orderNowSectionContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 0.5,
    borderRadius: 32,
    borderColor: FBBorders.secondary,

    // iOS shadow properties
    shadowColor: '#000',
    shadowOffset: {width: 1, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  orderNowSection: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    paddingHorizontal: 14,
    paddingVertical: 20,
    borderColor: FBBorders.secondary,
  },

  productContainer: {
    backgroundColor: FBBackground.white,
    flexDirection: 'row',
    padding: 14,
    borderWidth: 0.5,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: FBBorders.secondary,

    // iOS shadow properties
    shadowColor: '#000',
    shadowOffset: {width: 1, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 4,

    elevation: 3,
  },

  orderNowInput: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: FBBorders.inputAlternate,
    height: 40,
    width: Dimensions.get('screen').width * 0.36,
    backgroundColor: FBBackground.inputAlternate,
    color: FBColors.neutral,
    paddingLeft: 10,
  },
  buddyCanContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FBBackground.lightYellow,
    borderColor: FBBorders.borderYellow,
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  buddyIcon: {
    position: 'absolute',
    top: -2,
    left: -18,
    transform: [{scale: 0.7}],
  },
  infoCardContainer: {
    backgroundColor: FBBackground.lightYellow,
    borderColor: FBBorders.borderYellow,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
});

const slideInMenuStyles = {
  optionsContainer: {
    width: 260,
    padding: 18,
    borderRadius: 20,
    backgroundColor: FBBackground.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    transform: [{translateX: 100}],
    transition: 'transform 0.3s ease-in-out',
    marginLeft: 30,
  },
  optionWrapper: {
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    color: 'black',
  },
};
