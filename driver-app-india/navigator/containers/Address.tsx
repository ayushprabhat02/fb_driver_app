// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  AddShippingAddress,
  AddBillingAddress,
  MyAddress,
} from '@/modules/address/screens';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';

export type AddressStackParamList = {
  'add-shipping-address': undefined;
  'add-billing-address': undefined;
  'my-address': undefined;
  'search-location': undefined;
};

const AddressStack = createStackNavigator<AddressStackParamList>();

const AddressNavigator: React.FC = () => {
  return (
    <AddressStack.Navigator
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}
      initialRouteName="my-address">
      <AddressStack.Screen
        name="my-address"
        component={MyAddress}
        options={{headerTitle: 'My Address'}}
      />
      <AddressStack.Screen
        name="add-shipping-address"
        component={AddShippingAddress}
        options={{headerTitle: 'Add shipping address'}}
      />
      <AddressStack.Screen
        name="add-billing-address"
        component={AddBillingAddress}
        options={{headerTitle: 'Add billing address'}}
      />
    </AddressStack.Navigator>
  );
};

export default AddressNavigator;
