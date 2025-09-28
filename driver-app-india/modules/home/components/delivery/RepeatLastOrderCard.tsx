import React, {useCallback, useRef, useState} from 'react';
import {View} from 'react-native';
import {ms, ScaledSheet} from 'react-native-size-matters';
import Cross from 'react-native-vector-icons/MaterialIcons';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {ArrowRight} from 'phosphor-react-native';
import {useNavigation} from '@react-navigation/native';
import analytics from '@react-native-firebase/analytics';

// components
import {
  TextButton,
  CardElevated,
  Text as CustomText,
  SimpleBottomSheet,
  IconButton,
  FullScreenLoader,
} from '@/components';
import {DateTime} from '@/modules/delivery/components/cart';

// store
import {addressStore, deliveryStore, homeStore} from '@/globalStore';

// types
import {FBColors} from '@/types/styles';
import {getActiveDelOrgUserId} from '@/utils/localStorage';
import {LocationService} from '@/services';
// import {AssetService} from '@/services'; // Asset module deleted
import {retrieveCoordsFromString} from '@/utils/general';

type Props = {
  scrollToOrderNow: () => void;
};

const RepeatLastOrderCard: React.FC<Props> = ({scrollToOrderNow}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [serviceability, setServiceability] = useState<any>();

  const navigation = useNavigation();

  const billingAddresses = addressStore.use.billingAddresses();
  const lastOrder = homeStore.use.lastCustomerOrder();
  const selectedDate = deliveryStore.use.selectedDate();
  const selectedSlot = deliveryStore.use.selectedSlot();

  const startLoader = deliveryStore.use.startLoader();
  const stopLoader = deliveryStore.use.stopLoader();

  const dateTimeBottomSheet = useRef<BottomSheetModal>(null);

  const openDateTimeBottomSheet = useCallback(() => {
    dateTimeBottomSheet.current?.present();
  }, []);

  const closeDateTimeBottomSheet = useCallback(() => {
    dateTimeBottomSheet.current?.close();
  }, []);

  const placeOrderHandler = async () => {
    const minOrderQty =
      serviceability?.partner_localities[0]?.locality?.minimum_order_quantity;

    const orderQty =
      lastOrder?.customer_order?.customer_order_items[0]?.actual_qty;

    if (minOrderQty > orderQty) {
      closeDateTimeBottomSheet();
      setTimeout(() => {
        scrollToOrderNow();
      }, 300);

      // Log Firebase event for order quantity being below the minimum
      await analytics().logEvent('Checkout_Event', {
        orderQty,
        minOrderQty,
      });

      return;
    }

    startLoader('fetchCustomerAssets');

    setTimeout(() => {
      closeDateTimeBottomSheet();
    }, 50);

    // const response = await AssetService.getAllCustomerAssets({ // Asset module deleted
    //   organization_user_id: getActiveDelOrgUserId(),
    //   search_key: '%%',
    // });
    const response = []; // Mock for deleted asset module

    deliveryStore.setState(state => ({
      ...state,
      selectedAssetsForDeliveryDetails: response,
    }));

    setTimeout(() => {
      stopLoader('fetchCustomerAssets');
    }, 1000);

    if (!response.length) {
      navigation.navigate('delivery', {screen: 'add-asset-new-user'});
      setTimeout(() => {
        stopLoader('fetchCustomerAssets');
      }, 1000);
      return;
    }

    // Log Firebase event for successfully placing an order
    await analytics().logEvent('Order_Created_Event', {
      orderId: lastOrder?.customer_order?.id,
      deliveryDetails: {
        selectedShippingAddress:
          lastOrder?.customer_order?.organizationAddressByShippingAddressId,
        selectedBillingAddress: billingAddresses.find(
          address =>
            address.id === lastOrder?.customer_order?.billing_address_id,
        ),
      },
      quantity: `${lastOrder?.customer_order?.customer_order_items[0]?.actual_qty}`,
    });

    navigation.navigate('delivery', {screen: 'delivery-checkout'});
  };

  const repeatOrder = async () => {
    setLoading(true);

    const coords = retrieveCoordsFromString(
      lastOrder?.customer_order?.organizationAddressByShippingAddressId
        ?.location,
    );

    const foundServiceability = await LocationService.checkServiceability({
      latitude: coords.lat,
      longitude: coords.lng,
    });

    setServiceability(foundServiceability);

    if (foundServiceability && foundServiceability?.partner_localities) {
      const lastBilling = billingAddresses.find(address => {
        return address.id === lastOrder?.customer_order?.billing_address_id;
      });

      deliveryStore.setState(state => ({
        ...state,
        deliveryPartner: foundServiceability,
        selectedShippingAddress:
          lastOrder?.customer_order?.organizationAddressByShippingAddressId,
        selectedBillingAddress: lastBilling,
        quantity: `${lastOrder?.customer_order?.customer_order_items[0]?.actual_qty}`,
        selectedAssetsForDelivery:
          lastOrder?.customer_order?.customer_order_customer_assets.map(
            asset => asset.customer_asset?.id,
          ),
        selectedDeliveryProducts: [
          {
            product: {
              name: lastOrder?.customer_order?.customer_order_items[0]
                ?.product_variation?.product?.name as string,
              product_partner_localities_price_id:
                lastOrder?.customer_order?.customer_order_items[0]?.id,
              qty: lastOrder?.customer_order?.customer_order_items[0]
                ?.actual_qty,
              salePrice:
                lastOrder?.customer_order?.customer_order_items[0]?.unit_price,
              variation_id:
                lastOrder?.customer_order?.customer_order_items[0]
                  ?.product_variation_id,
            },
          },
        ],
      }));

      setTimeout(() => {
        openDateTimeBottomSheet();
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <CardElevated cardStyle={styles.card as any}>
      <View style={styles.header}>
        <View style={styles.title}>
          <CustomText weight="bold" size="lg" color="mediumGray">
            Last order
          </CustomText>
          <Cross
            onPress={() => {
              homeStore.setState(state => ({
                ...state,
                showRepeatOrder: false,
              }));
            }}
            name="close"
            color={FBColors.neutral}
            size={ms(25)}
          />
        </View>
        <CustomText
          size="sm"
          style={{width: '80%'}}
          color="lightGray"
          lines={2}>
          {
            lastOrder?.customer_order?.organizationAddressByShippingAddressId
              ?.address_line1
          }
        </CustomText>
      </View>
      <View style={styles.footer}>
        <CustomText size="sm" color="complementary">
          {`${lastOrder?.customer_order?.customer_order_customer_assets?.length} assets`}{' '}
          -{' '}
          {`${lastOrder?.customer_order?.customer_order_items[0]?.actual_qty} liters`}
        </CustomText>
        <TextButton
          textColor="complementary"
          underline={true}
          onPress={repeatOrder}
          style={{position: 'relative', bottom: 3}}>
          Repeat your order
        </TextButton>
      </View>

      <SimpleBottomSheet
        ref={dateTimeBottomSheet}
        closeSheet={closeDateTimeBottomSheet}>
        <BottomSheetView>
          <DateTime />
          <View style={{marginVertical: 40, width: 250, alignSelf: 'center'}}>
            <IconButton
              disabled={!selectedDate || !selectedSlot}
              style={{height: 52}}
              onPress={placeOrderHandler}
              variant="solid">
              <IconButton.Text>Checkout</IconButton.Text>
              <IconButton.Icon>
                <ArrowRight color={FBColors.white} size={16} />
              </IconButton.Icon>
            </IconButton>
          </View>
        </BottomSheetView>
      </SimpleBottomSheet>

      <FullScreenLoader showLoader={loading} />
    </CardElevated>
  );
};

const styles = ScaledSheet.create({
  card: {
    flexDirection: 'column',
    height: '115@ms',
    borderRadius: '20@ms',
    width: '95%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '-4@vs',
    marginBottom: '4@vs',
  },
  image: {
    width: '40%',
    position: 'relative',
    bottom: '10@vs',
    right: '10@vs',
  },
  footer: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '10@vs',
  },
});

export default RepeatLastOrderCard;
