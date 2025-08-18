// dependencies
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Keyboard, View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// components
import PaymentOptionList from './PaymentOptionList';
import PayViaWalletButton from './PayViaWalletButton';
import PayOnlineButton from './PayOnlineButton';
import {FullScreenLoader, SimpleBottomSheet, Text} from '@/components';
import {WalletForm} from '@/modules/wallet/components';
import {Button} from '@/components';

// store
import {
  businessStore,
  deliveryStore,
  orderStore,
  walletStore,
} from '@/globalStore';

// services
import {DeliveryService, OrderService, WalletService} from '@/services';

// types and styles
import {FBBackground, FBColorPalette} from '@/types/styles';
import {commonBottomSheetView} from '@/styles';
import OtpTextInput from '@/modules/order/delivery/components/OtpTextInput';
import {getBusinessRole} from '@/utils/general';

interface Props {
  scrollToBillingAddress: () => void;
}
const PaymentSummary: React.FC<Props> = ({scrollToBillingAddress}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [newlyConfirmedOrder, setNewlyConfirmedOrder] = useState();
  const [upComingloading, setUpComingLoading] = useState<boolean>(false);

  const loaders = deliveryStore.use.loaders();
  const startLoader = deliveryStore.use.startLoader();
  const stopLoader = deliveryStore.use.stopLoader();
  const startOrderLoader = orderStore.use.startLoader();
  const stopOrderLoader = orderStore.use.stopLoader();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const upComingOrders = orderStore.use.upcomingOrders();
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();
  const isOwner = activeDeliveryOrgUser?.is_owner;
  // getBusinessRole(activeDeliveryOrgUser) === 'owner' ||
  // getBusinessRole(activeDeliveryOrgUser) === 'individual';
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  // bottom sheet
  const bottomSheetRefOtp = useRef<BottomSheetModal>(null);
  const setBottomSheetRefOtp = orderStore.use.setBottomSheetRefOtp();

  const selectedPaymentMethod = deliveryStore.use.selectedPaymentMethod();
  const currentWallet = walletStore.use.currentWallet();

  const totalAmount = deliveryStore.use.totalAmount();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const createDeliveryOrder = async () => {
    startLoader('createDeliveryOrder');
    startLoader('paymentSuccess');

    const response = !isUpComingOrderVerify?.is_verified
      ? await DeliveryService.createDeliveryOrder()
      : newlyConfirmedOrder;

    if (response) {
      /**
       * if order created, we need to deduct the order amount from the wallet
       */
      await WalletService.payForOrderViaWallet({
        amount: response.insert_customer_order_one?.amount_to_be_paid,
        order_id: response.insert_customer_order_one?.id,
        wallet_id: walletStore.getState().currentWallet?.wallet_id,
      }).finally(() => {
        setTimeout(() => {
          stopLoader('createDeliveryOrder');
        }, 1000);
      });
      /**
       * if order created, we need to fetch the newly created order's details
       */
      await OrderService.fetchCustomerOrderById({
        OrderId: response.insert_customer_order_one?.id,
      }).finally(() => {
        stopLoader('paymentSuccess');
        navigation.replace('payment-successful');
      });
    } else {
      stopLoader('paymentSuccess');
    }
  };

  useEffect(() => {
    if (currentWallet) {
      setLoading(false);
    }
  }, [currentWallet]);

  // optBottomsheet ref

  // const bottomSheetRefOtp = useRef<BottomSheetModal>(null);
  useEffect(() => {
    setBottomSheetRefOtp(bottomSheetRefOtp);
  }, []);

  const openBottomSheetOtp = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRefOtp.current?.present();
    // Set a timeout to auto-close the OTP sheet after 5 minutes
    // setTimeout(() => {
    //   Alert.alert(
    //     'Your time is up',
    //     'Please generate OTP again',
    //     [
    //       {
    //         text: 'OK',
    //         onPress: () => {
    //           // Your custom logic here
    //           bottomSheetRefOtp.current?.close(); // Example: Close OTP sheet
    //           navigation.navigate('home-tab');
    //           // Or trigger another OTP request
    //           // generateOtp();
    //         },
    //       },
    //     ],
    //     {cancelable: false},
    //   );
    // }, 1000 * 60 * 10); // 10 minutes
  }, []);

  const closeOtpBottomSheet = useCallback(() => {
    bottomSheetRefOtp.current?.close();
  }, []);

  const verifyPlacedOrderOtp = async (otp: string) => {
    try {
      startOrderLoader('verifyPlacedOrderOtp');

      const res = await OrderService.verifyPlacedOrderOtp({
        customer_order_id: newlyConfirmedOrder?.insert_customer_order_one?.id,
        otp: Number(otp),
      });

      console.log('--res----', res);

      if (res?.is_verified) {
        closeOtpBottomSheet();
        Toast.show({
          type: 'success',
          text1: 'Order Confirmed Successfully',
        });
        // Alert.alert('Success', 'Order Confirmed Successfully');
      } else {
        Alert.alert('Failed', 'Please Enter correct OTP');
      }
    } catch (error) {
      console.error('OTP Verification failed:', error);
    } finally {
      stopOrderLoader('verifyPlacedOrderOtp');
    }
  };

  const handleOtpSuccess = (otp: string) => {
    verifyPlacedOrderOtp(otp);
    // Alert.alert('Success', `Order Confirmed Successfully`);
  };

  const handleGenerateOtpClick = async () => {
    try {
      setUpComingLoading(true);
      const res = await DeliveryService.createDeliveryOrder();
      setNewlyConfirmedOrder(res);
      // await OrderService.fetchOrganizationUpcomingOrders({
      //   organization_id: activeDeliveryOrgUser?.organization_id,
      // });
    } catch (error) {
      console.log('----error-----', error);
    } finally {
      setUpComingLoading(false);
    }
    openBottomSheetOtp();
  };

  const handleOtpTimeUp = () => {
    closeOtpBottomSheet();
    Toast.show({
      type: 'error',
      text1: 'Otp expired.',
      text2: ' Please continue again',
      visibilityTime: 3000,
    });
    setTimeout(() => {
      navigation.navigate('home-tab');
      resetDeliveryStore();
    }, 1000);
  };

  // const matchedUpcomingOrder = upComingOrders?.find(
  //   (order: any) =>
  //     order?.customer_order_id ===
  //     newlyConfirmedOrder?.insert_customer_order_one?.id,
  // );

  // console.log('---newlyConfirmedOrder-----', newlyConfirmedOrder);

  return (
    <View style={styles.container}>
      {!loading ? (
        <>
          {isOwner ||
          !activeDeliveryOrgUser?.organization?.is_otp_required_placed_order ||
          isUpComingOrderVerify?.is_verified ? (
            <>
              <View>
                <PaymentOptionList />
              </View>
              {selectedPaymentMethod === 'fb-wallet' ||
              selectedPaymentMethod === 'POD' ||
              selectedPaymentMethod === 'COD' ? (
                <PayViaWalletButton
                  scrollToBillingAddress={scrollToBillingAddress}
                  openBottomSheet={openBottomSheet}
                  newlyConfirmedOrder={newlyConfirmedOrder}
                />
              ) : (
                <PayOnlineButton
                  scrollToBillingAddress={scrollToBillingAddress}
                  newlyConfirmedOrder={newlyConfirmedOrder}
                />
              )}
            </>
          ) : (
            <Button
              loading={upComingloading}
              variant="solid"
              onPress={handleGenerateOtpClick}>
              <Text color="white" weight="600">
                Generate Otp for Place order
              </Text>
            </Button>
          )}
        </>
      ) : null}

      <SimpleBottomSheet
        ref={bottomSheetRef}
        snapPoints={['50%']}
        closeSheet={closeBottomSheet}>
        <BottomSheetView style={commonBottomSheetView}>
          <WalletForm
            callback={createDeliveryOrder}
            receivedAmount={
              totalAmount - currentWallet?.available_balance > 0
                ? `${(totalAmount - currentWallet?.available_balance).toFixed(
                    2,
                  )}`
                : `${totalAmount}`
            }
            currentWallet={currentWallet}
            onClose={closeBottomSheet}
          />
        </BottomSheetView>
      </SimpleBottomSheet>
      <SimpleBottomSheet
        pressBehavior="none"
        snapPoints={[]}
        closeSheet={closeOtpBottomSheet}
        ref={bottomSheetRefOtp}
        showCloseBtn={false}>
        <BottomSheetView>
          <OtpTextInput
            onSuccess={handleOtpSuccess}
            onTimeUp={handleOtpTimeUp}
          />
        </BottomSheetView>
      </SimpleBottomSheet>

      {/* <FullScreenLoader
        showLoader={loaders.createDeliveryOrder}
        loaderText="Creating order..."
      /> */}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: FBBackground.softBlue,
    flex: 1,
  },
});

export default PaymentSummary;
