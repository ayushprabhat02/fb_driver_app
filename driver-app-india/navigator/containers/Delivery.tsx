// dependencies
import React, {useCallback} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackScreenProps} from '@react-navigation/stack';

// components
import {
  DeliveryCartPage,
  DeliveryCheckout,
  DeliveryOrderTracking,
  SelectAddress,
  AddAssetsNewUser,
  AddBillingNewUser,
  AddShippingNewUser,
  PaymentSuccessful,
  IciciPaymentDelivery,
  IciciDeliverySuccess,
  IciciDeliveryFailure,
  AxisDeliverySuccess,
  AxisDeliveryFailure,
} from '@/modules/delivery/screens';

// styles
import {commonHeaderStyles} from '@/styles';
import {BackButtonCross} from '@/components';
import {ProtectedStackParamList} from '..';
import {BackButtonArrow} from '@/components';
import AxisPaymentDelivery from '@/modules/delivery/screens/AxisPaymentDelivery';

export type DeliveryStackParamList = {
  'delivery-cart': undefined;
  'delivery-checkout': undefined;
  'delivery-order-tracking': undefined;
  'select-address': undefined;
  'add-asset-new-user': undefined;
  'add-shipping-new-user': undefined;
  'add-billing-new-user': undefined;
  'payment-successful': undefined;
  'icici-payment-del': undefined;
  'icici-success-del': undefined;
  'icici-failure-del': undefined;
  'axis-payment-del': undefined;
  'axis-success-del': undefined;
  'axis-failure-del': undefined;
};

const DeliveryStack = createStackNavigator<DeliveryStackParamList>();

type Props = StackScreenProps<ProtectedStackParamList, 'delivery'>;

const DeliveryNavigator: React.FC<Props> = ({navigation}) => {
  const jumpToHome = useCallback(() => {
    navigation.pop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DeliveryStack.Navigator
      initialRouteName="select-address"
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}>
      <DeliveryStack.Screen
        name="delivery-checkout"
        component={DeliveryCheckout}
        options={{
          title: 'Check-Out',
          headerTitleStyle: {fontSize: 28, fontWeight: '600'},
        }}
      />
      <DeliveryStack.Screen
        name="delivery-cart"
        component={DeliveryCartPage}
        options={{
          headerTitle: 'My Cart',
        }}
      />
      <DeliveryStack.Screen
        name="select-address"
        component={SelectAddress}
        options={{
          headerTitle: 'Select Delivery Address',
        }}
      />
      <DeliveryStack.Screen
        name="add-asset-new-user"
        component={AddAssetsNewUser}
        options={{
          headerTitle: 'Add Assets',
        }}
      />
      <DeliveryStack.Screen
        name="add-shipping-new-user"
        component={AddShippingNewUser}
        options={{
          headerTitle: '',
        }}
      />
      <DeliveryStack.Screen
        name="add-billing-new-user"
        component={AddBillingNewUser}
        options={{
          headerTitle: 'Add Billing Address',
        }}
      />
      <DeliveryStack.Screen
        name="payment-successful"
        component={PaymentSuccessful}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
      <DeliveryStack.Screen
        name="icici-payment-del"
        component={IciciPaymentDelivery}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
      <DeliveryStack.Screen
        name="icici-success-del"
        component={IciciDeliverySuccess}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
      <DeliveryStack.Screen
        name="icici-failure-del"
        component={IciciDeliveryFailure}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
      <DeliveryStack.Screen
        name="delivery-order-tracking"
        component={DeliveryOrderTracking}
        options={{
          headerTitle: 'Order Summary',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => <BackButtonCross onPress={jumpToHome} />,
        }}
      />
      <DeliveryStack.Screen
        name="axis-payment-del"
        component={AxisPaymentDelivery}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
      <DeliveryStack.Screen
        name="axis-success-del"
        component={AxisDeliverySuccess}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
      <DeliveryStack.Screen
        name="axis-failure-del"
        component={AxisDeliveryFailure}
        options={{
          headerTitle: '',
          headerShown: false,
        }}
      />
    </DeliveryStack.Navigator>
  );
};

export default DeliveryNavigator;
