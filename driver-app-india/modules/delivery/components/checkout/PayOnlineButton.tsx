// dependencies
import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import PaymentHelper from '../axis/PaymentHelper';

// components
import {Button, Text} from '@/components';

// services
import {deliveryStore, orderStore, walletStore} from '@/globalStore';
import {DeliveryService, OrderService, WalletService} from '@/services';
import {formatAmountInternational} from '@/utils/general';

// types & styles
import {CreateDeliveryOrderMutation} from '@/generated/graphql';
import {FBColorPalette} from '@/types/styles';
import {Alert} from 'react-native';

interface Props {
  scrollToBillingAddress: () => void;
}

const PayOnlineButton: React.FC<Props> = ({
  scrollToBillingAddress,
  newlyConfirmedOrder,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  const totalAmount = deliveryStore.use.totalAmount();
  // const totalAmount = 1;

  // const totalAmount = 1; // Set the static amount to 1 INR for testing purposes
  const currentWallet = walletStore.use.currentWallet();
  const billingAddress = deliveryStore.use.selectedBillingAddress();
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  const selectedPaymentMethod = deliveryStore.use.selectedPaymentMethod();
  const startLoader = deliveryStore.use.startLoader();
  const stopLoader = deliveryStore.use.stopLoader();
  const navigation = useNavigation();
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  const payOnline = async (response: CreateDeliveryOrderMutation) => {
    const amount = response?.insert_customer_order_one?.amount_to_be_paid;
    // const amount = 1; // Set the static amount to 1 INR for testing purposes
    switch (selectedPaymentMethod) {
      case 'online': {
        setLoading(true);
        const confirmationPayment = await WalletService.payOnline(
          amount,
          response?.insert_customer_order_one?.id,
        );
        if (!confirmationPayment) {
          return;
        }
        setTimeout(() => {
          stopLoader('createDeliveryOrder');
        }, 4000);
        navigation.navigate('delivery-order-tracking');
        return;
      }

      case 'icici_cobranded_card': {
        startLoader('createDeliveryOrder');

        setLoading(true);
        walletStore.setState(state => ({
          ...state,
          iciciAmount: amount,
          orderId: response.insert_customer_order_one?.id,
        }));
        WalletService.initiateIciciCobrandedCardPayment({
          object: {
            amount: parseFloat(amount),
            wallet_id: currentWallet?.wallet_id,
            failure_callback_url: 'https://app.fuelbuddy.in/icici-failure',
            success_callback_url: 'https://app.fuelbuddy.in/icici-success',
          },
        }).then(() => {
          setTimeout(() => {
            stopLoader('createDeliveryOrder');
          }, 4000);
          navigation.navigate('icici-payment-del');
        });

        return;
      }

      case 'axis_cobranded_card': {
        setProcessing(true);
        startLoader('createDeliveryOrder');
        setLoading(true);
        // if (parseFloat(amount) < 500) {
        //   Alert.alert(
        //     'Minimum transaction amount for Axis Co-branded Card is ₹500',
        //   );
        //   stopLoader('createDeliveryOrder');
        //   return; // Prevent further execution if the amount is less than 500
        // }

        let merchantDetails: {
          merchantId: string | null | undefined;
          custEmailId: string;
          custMobileNumber: string;
          amount: any;
        }; // Declare merchantDetails in the parent scope
        let callbackReturnUrl: any;
        // Set Axis Payment Data in State
        walletStore.setState(state => ({
          ...state,
          axisAmount: amount,
          orderId: response.insert_customer_order_one?.id,
        }));

        WalletService.initiateAxisCobrandedCardPayment({
          object: {
            amount: parseFloat(amount),
            wallet_id: currentWallet?.wallet_id,
            failure_callback_url: 'https://app.fuelbuddy.in/axis-failure',
            success_callback_url: 'https://app.fuelbuddy.in/axis-success',
          },
        })
          .then(walletResponse => {
            // walletStore.setState(state => ({
            //   ...state,
            //   axisWalletTransactionId:
            //     walletResponse?.axisBankPayment?.wallet_transaction_id,
            // }));
            merchantDetails = {
              merchantId: walletResponse?.axisBankPayment?.transaction_id,
              custEmailId: walletResponse?.axisBankPayment?.email || '',
              custMobileNumber:
                walletResponse?.axisBankPayment?.phone_number?.replace(
                  '+91',
                  '',
                ) || '',
              amount: amount || '',
            };

            callbackReturnUrl = walletResponse?.axisBankPayment
              ?.call_back_url as string;

            // console.log('Final merchantDetails:', merchantDetails);

            const atomTokenId = walletResponse?.axisBankPayment?.atom_token_id;
            if (atomTokenId) {
              stopLoader('createDeliveryOrder');
              setLoading(false); // Reset loading
              initNDPSTransaction(atomTokenId);
            }
          })
          .finally(() => {
            setProcessing(false); // Reset processing after successful setup
          });
        const initNDPSTransaction = async (atomTokenId: string) => {
          try {
            const ndps = new PaymentHelper();
            let aipayContent = ndps.openAipayPopUp(
              atomTokenId,
              merchantDetails,
              callbackReturnUrl,
            );
            navigation.navigate('axis-payment-del', {
              htmlPage: aipayContent,
              merchantDetails: merchantDetails,
            });
          } catch (e) {
            console.error('Error in transaction:', e);
            setProcessing(false); // Reset processing after successful setup
          }
        };

        return;
      }

      default:
        break;
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = !isUpComingOrderVerify?.is_verified
        ? await DeliveryService.createDeliveryOrder()
        : newlyConfirmedOrder;
      // const response = await DeliveryService.createDeliveryOrder();
      if (response) {
        await OrderService.fetchCustomerOrderById({
          OrderId: response.insert_customer_order_one?.id,
        });
        payOnline(response);
      }
    } catch (error) {
      console.error('Payment process failed:', error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1200);
      orderStore.setState(state => ({
        ...state,
        upcomingOrdersVerify: undefined,
      }));
    }
  };

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

  return (
    <Button
      variant="solid"
      onPress={handlePayment}
      loading={loading || processing}>
      <Text color="white" weight="600">
        Pay {formatAmountInternational(totalAmount)}
      </Text>
    </Button>
  );
};

export default PayOnlineButton;
