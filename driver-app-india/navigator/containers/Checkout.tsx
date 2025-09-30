import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {commonHeaderStyles} from '@/styles';
import {CheckoutPage} from '@/modules/checkout';

export type CheckoutStackParamList = {
  checkoutFlow: undefined;
};

const CheckOutStack = createStackNavigator<CheckoutStackParamList>();

const CheckoutContainer = () => {
  return (
    <CheckOutStack.Navigator screenOptions={{...commonHeaderStyles}}>
      <CheckOutStack.Screen
        name="CheckoutPage"
        component={CheckoutPage}
        options={{
          headerTitle: 'Check Out',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </CheckOutStack.Navigator>
  );
};

export default CheckoutContainer;
