// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  AddShippingAddress,
  AddBillingAddress,
  FillupRequest as FillupRequestScreen,
  FillupDetails,
  FillupIndent,
} from '@/modules/fillupRequest/screens';
import {FillAsset} from '@/modules/order/screens';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';

export type FillupRequestParamList = {
  'add-shipping-address': undefined;
  'add-billing-address': undefined;
  'fillup-request': undefined;
  'fillup-details': {fillupId: string};
  'fillup-indent': {fillupId: string};
  'search-location': undefined;
  'fill-asset': undefined;
};

const FillupRequestStack = createStackNavigator<FillupRequestParamList>();

const FillupRequestNavigator: React.FC = () => {
  return (
    <FillupRequestStack.Navigator
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}
      initialRouteName="fillup-request">
      <FillupRequestStack.Screen
        name="fillup-request"
        component={FillupRequestScreen}
        options={{headerTitle: 'Fillup Request'}}
      />
      <FillupRequestStack.Screen
        name="fillup-details"
        component={FillupDetails}
        options={{headerTitle: 'Fillup Details'}}
      />
      <FillupRequestStack.Screen
        name="fillup-indent"
        component={FillupIndent}
        options={{headerTitle: 'Upload Indent'}}
      />
      <FillupRequestStack.Screen
        name="add-shipping-address"
        component={AddShippingAddress}
        options={{headerTitle: 'Add shipping address'}}
      />
      <FillupRequestStack.Screen
        name="add-billing-address"
        component={AddBillingAddress}
        options={{headerTitle: 'Add billing address'}}
      />
      <FillupRequestStack.Screen
        name="fill-asset"
        component={FillAsset}
        options={{headerTitle: 'Fill Asset'}}
      />
    </FillupRequestStack.Navigator>
  );
};

export default FillupRequestNavigator;
