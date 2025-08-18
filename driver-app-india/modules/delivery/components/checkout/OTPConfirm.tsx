// dependencies
import {View} from 'react-native';
import React from 'react';
import {ScaledSheet} from 'react-native-size-matters';
import {StackNavigationProp} from '@react-navigation/stack';

// store
import deliveryStore from '../../store';
import {walletStore} from '@/globalStore';

// services
import DeliveryServices from '../../services';
import {WalletService} from '@/services';

// components
import {Button, Divider, Text} from '@/components';
import {DeliveryStackParamList} from '@/navigator/containers/Delivery';

/**
 * Props -
 * @navigation: StackNavigationProp - we need to pass navigation as a props as bottom sheet lies outside the navigator
 * we can't use useNavigation as it will give an error
 * @callback: () => void - callback function to be called after the order is created
 * we need this to close the bottom sheet before navigating to the delivery order tracking screen
 */
interface Props {
  navigation: StackNavigationProp<
    DeliveryStackParamList,
    'delivery-checkout',
    undefined
  >;

  callback: () => void;
}

const OTPConfirm: React.FC<Props> = ({navigation, callback}) => {
  const loaders = deliveryStore.use.loaders();
  const startLoader = deliveryStore.use.startLoader();

  const createDeliveryOrder = async () => {
    startLoader('createDeliveryOrder');

    const response = await DeliveryServices.createDeliveryOrder();

    if (response) {
      /**
       * if order created, we need to deduct the order amount from the wallet
       */
      await WalletService.payForOrderViaWallet({
        amount: response.insert_customer_order_one?.amount_to_be_paid,
        order_id: response.insert_customer_order_one?.id,
        wallet_id: walletStore.getState().currentWallet?.wallet_id,
      });

      /**
       * if order created, we need to fetch the newly created order's details
       */
      await DeliveryServices.getDeliveryOrderById({
        OrderId: response.insert_customer_order_one?.id,
      });
      // @ts-ignore
      callback();
      navigation.navigate('delivery-order-tracking');
    } else {
      throw new Error('Failed to create delivery order');
    }
  };

  return (
    <View style={styles.otpContainer}>
      {!loaders.createDeliveryOrder ? (
        <>
          <Text weight="600">Would you like an OTP for this order ?</Text>
          <Divider />
          <Text size="sm" color="mediumGray">
            If you choose yes, an OTP will be generated with the order which
            will be used by the delivery partner to verify the order at the time
            of delivery.
          </Text>

          <Divider height={32} />
          <View style={{width: '100%'}}>
            <Button onPress={createDeliveryOrder} variant="solid">
              Yes, I would like an OTP
            </Button>
            <Divider />
            <Button onPress={createDeliveryOrder} variant="solid">
              No, I don't want an OTP
            </Button>
          </View>
        </>
      ) : (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
          }}>
          <Text style={{textAlign: 'center'}}>
            Creating your order. Please wait...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  otpContainer: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: '16@s',
  },
});

export default OTPConfirm;
