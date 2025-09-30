import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CheckoutPage } from './';

export type CheckoutStackParamList = {
  Checkout: undefined;
};

const Stack = createStackNavigator<CheckoutStackParamList>();

const CheckoutNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#45B877',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Checkout"
        component={CheckoutPage}
        options={{ title: 'Checkout' }}
      />
    </Stack.Navigator>
  );
};

export default CheckoutNavigator;