import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {MyAssets} from '@/modules/assets/delivery/screens';
import {commonHeaderStyles} from '@/styles';
import {BackButtonArrow} from '@/components';

export type AssetsStackParamList = {
  'assets-delivery': undefined;
  'assets-pickup': undefined;
  'add-delivery-asset': undefined;
};

const AssetsStack = createStackNavigator<AssetsStackParamList>();

const AssetsNavigator: React.FC = () => {
  return (
    <AssetsStack.Navigator
      initialRouteName="assets-delivery"
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}>
      <AssetsStack.Screen
        name="assets-delivery"
        component={MyAssets}
        options={{
          title: '',
        }}
      />
    </AssetsStack.Navigator>
  );
};

export default AssetsNavigator;
