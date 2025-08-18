// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  WalletDelivery,
  IciciPayments,
  IciciSuccess,
  IciciFailure,
  IciciFailureKnockoff,
  IciciPaymentsKnockoff,
  IciciSuccessKnockoff,
  AxisPaymentsKnockoff,
  AxisSuccessKnockoff,
  AxisFailureKnockoff,
  AxisPayments,
  AxisFailure,
  AxisSuccess,
} from '@/modules/wallet/delivery/screens';
import {UserInvoices} from '@/modules/wallet/delivery/screens';
import {commonHeaderStyles} from '@/styles';
import {FBColors} from '@/types/styles';

export type WalletStackParamList = {
  wallet: undefined;
  'wallet-delivery': undefined;
  'user-invoices': undefined;
  'icici-payments': undefined;
  'icici-success': undefined;
  'icici-failure': undefined;
  'icici-payments-knockoff': undefined;
  'icici-success-knockoff': undefined;
  'icici-failure-knockoff': undefined;
  'axis-payments-knockoff': undefined;
  'axis-success-knockoff': undefined;
  'axis-failure-knockoff': undefined;
  'axis-payments': undefined;
  'axis-success': undefined;
  'axis-failure': undefined;
};

const WalletStack = createStackNavigator<WalletStackParamList>();

const WalletNavigator: React.FC = () => {
  return (
    <WalletStack.Navigator initialRouteName="wallet-delivery">
      <WalletStack.Screen
        name="wallet-delivery"
        component={WalletDelivery}
        options={{
          ...commonHeaderStyles,
          headerTintColor: FBColors.primary,
          title: '',
        }}
      />
      <WalletStack.Screen
        name="user-invoices"
        component={UserInvoices}
        options={{
          title: 'Transactions',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="icici-payments"
        component={IciciPayments}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="icici-success"
        component={IciciSuccess}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="icici-failure"
        component={IciciFailure}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />

      <WalletStack.Screen
        name="axis-payments"
        component={AxisPayments}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="axis-success"
        component={AxisSuccess}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="axis-failure"
        component={AxisFailure}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />

      {/* knockoff screens */}
      <WalletStack.Screen
        name="icici-payments-knockoff"
        component={IciciPaymentsKnockoff}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="icici-success-knockoff"
        component={IciciSuccessKnockoff}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="icici-failure-knockoff"
        component={IciciFailureKnockoff}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      {/* Axis knockoff screens */}
      <WalletStack.Screen
        name="axis-payments-knockoff"
        component={AxisPaymentsKnockoff}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="axis-success-knockoff"
        component={AxisSuccessKnockoff}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
      <WalletStack.Screen
        name="axis-failure-knockoff"
        component={AxisFailureKnockoff}
        options={{
          title: '',
          ...commonHeaderStyles,
        }}
      />
    </WalletStack.Navigator>
  );
};

export default WalletNavigator;
