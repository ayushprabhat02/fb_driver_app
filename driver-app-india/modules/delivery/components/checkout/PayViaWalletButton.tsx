import React from 'react';
import {useNavigation} from '@react-navigation/native';
import analytics from '@react-native-firebase/analytics';

// store
import {
  businessStore,
  deliveryStore,
  orderStore,
} from '@/globalStore';

// services
import {formatAmountInternational, getBusinessRole} from '@/utils/general';
import {DeliveryService, OrderService} from '@/services';

// components
import {Button, Text} from '@/components';

// types
import {FBColorPalette} from '@/types/styles';
import Toast from 'react-native-toast-message';

interface Props {
  scrollToBillingAddress: () => void;
  openBottomSheet: () => void;
}

const PayViaWalletButton: React.FC<Props> = ({
  scrollToBillingAddress,
  openBottomSheet,
  newlyConfirmedOrder,
}) => {
  const navigation = useNavigation();
  const totalAmount = deliveryStore.use.totalAmount();
  // const currentInvoice = walletStore.use.pendingInvoice(); // Wallet module deleted
  const billingAddress = deliveryStore.use.selectedBillingAddress();
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();
  const selectedPaymentMethod = deliveryStore.use.selectedPaymentMethod();
  // const deliveryWalletAmountExists = walletStore.use.deliveryWalletAmountExists(); // Wallet module deleted
  const isPostpaidAllowed = deliveryStore.use.isPostpaid();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const isOwner =
    getBusinessRole(activeDeliveryOrgUser) === 'owner' ||
    getBusinessRole(activeDeliveryOrgUser) === 'individual';
  const loaders = deliveryStore.use.loaders();
  const startLoader = deliveryStore.use.startLoader();
  const stopLoader = deliveryStore.use.stopLoader();
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  const createDeliveryOrder = async () => {
    startLoader('createDeliveryOrder');
    startLoader('paymentSuccess');

    const response = !isUpComingOrderVerify?.is_verified
      ? await DeliveryService.createDeliveryOrder()
      : newlyConfirmedOrder;

    // const response = await DeliveryService.createDeliveryOrder();

    if (response) {
      /**
       * if order created, we need to deduct the order amount from the wallet
       */

      // Firebase Analytics Event: Order Created
      analytics().logEvent('Order_Paid_Event', {
        order_id: response.insert_customer_order_one?.id,
        amount_to_be_paid:
          response.insert_customer_order_one?.amount_to_be_paid,
        payment_method: selectedPaymentMethod,
        billing_address: billingAddress?.address_line_1,
      });
      console.log('------Order_Paid_Event------');

      // TODO: Replace with wallet payment functionality when wallet module is restored
      // WalletService.payForOrderViaWallet({
      //   amount: response.insert_customer_order_one?.amount_to_be_paid,
      //   order_id: response.insert_customer_order_one?.id,
      //   wallet_id: walletStore.getState().currentWallet?.wallet_id,
      // })
      //   .then(async () => {

      // For now, just complete the order without wallet payment
      await OrderService.fetchCustomerOrderById({
        OrderId: response.insert_customer_order_one?.id,
      });

      stopLoader('paymentSuccess');
      navigation.replace('payment-successful');
      //   })
      //   .catch(error => {
      //     Toast.show({
      //       type: 'error',
      //       text1: 'Please clear previous cheque',
      //       text2: 'Previous cheque against shipping address not cleared yet',
      //     });

      //     stopLoader('createDeliveryOrder');
      //     stopLoader('paymentSuccess');
      //   });

      /**
       * if order created, we need to fetch the newly created order's details
       */
      orderStore.setState(state => ({
        ...state,
        upcomingOrdersVerify: undefined,
      }));
    } else {
      stopLoader('paymentSuccess');
    }
  };

  // If no billing address, return early with a prompt
  if (!billingAddress) {
    return (
      <Button
        variant="solid"
        onPress={scrollToBillingAddress}
        style={{backgroundColor: FBColorPalette.faded}}
        textStyle={{color: FBColorPalette.mediumGray}}>
        Please add billing address
      </Button>
    );
  }

  if (!selectedAssetsForDelivery.length) {
    // If no assets selected for delivery, return early with a prompt
    return (
      <Button
        variant="solid"
        onPress={scrollToBillingAddress}
        style={{backgroundColor: FBColorPalette.faded}}
        textStyle={{color: FBColorPalette.mediumGray}}>
        Please add assets
      </Button>
    );
  }

  if (isPostpaidAllowed) {
    if (selectedPaymentMethod === 'POD') {
      return (
        <Button
          variant="solid"
          onPress={createDeliveryOrder}
          disabled={loaders.paymentSuccess}>
          <Text color="white" weight="600">
            Confirm Order {formatAmountInternational(totalAmount)}
          </Text>
        </Button>
      );
    }

    if (selectedPaymentMethod === 'COD') {
      return (
        <Button
          variant="solid"
          onPress={createDeliveryOrder}
          disabled={loaders.paymentSuccess}>
          <Text color="white" weight="600">
            Confirm Order {formatAmountInternational(totalAmount)}
          </Text>
        </Button>
      );
    }
  }

  if (selectedPaymentMethod === 'fb-wallet') {
    return (
      <Button
        variant="solid"
        disabled
        style={{ backgroundColor: FBColorPalette.error }}>
        <Text color="white" weight="600">
          Wallet Feature Unavailable
        </Text>
      </Button>
    );
  }

  // Check if the payment method is POD or COD
  const isPODorCOD = selectedPaymentMethod === 'COD';

  // Main return: All conditions met, show the payment button
  return (
    <Button
      variant="solid"
      onPress={createDeliveryOrder}
      disabled={loaders.paymentSuccess}>
      <Text color="white" weight="600">
        {isPODorCOD
          ? 'Confirm Order'
          : `Pay ${formatAmountInternational(totalAmount)}`}
      </Text>
    </Button>
  );
};

export default PayViaWalletButton;
