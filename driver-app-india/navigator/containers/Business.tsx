// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  ChooseBusinessDelivery,
  BusinessListDelivery,
  ManageUsers,
  CreateNewBusiness,
  AddDefaultBusiness,
} from '@/modules/business/screens';
import {BackButtonArrow} from '@/components';
import {commonHeaderStyles} from '@/styles';

export type BusinessStackParamList = {
  'choose-business-delivery': undefined;
  'business-list-delivery': undefined;
  'manage-users': undefined;
  'create-new-business': undefined;
  'create-new-default-business': undefined;
};

const BusinessStack = createStackNavigator<BusinessStackParamList>();

const BusinessNavigator: React.FC = () => {
  return (
    <BusinessStack.Navigator initialRouteName="choose-business-delivery">
      <BusinessStack.Screen
        name="choose-business-delivery"
        component={ChooseBusinessDelivery}
        options={{headerShown: false}}
      />

      <BusinessStack.Screen
        name="business-list-delivery"
        component={BusinessListDelivery}
        options={{
          title: 'My Businesses',
          headerLeft: BackButtonArrow,
          ...commonHeaderStyles,
        }}
      />

      <BusinessStack.Screen
        name="manage-users"
        component={ManageUsers}
        options={{
          title: 'Manage Users',
          headerLeft: BackButtonArrow,
          ...commonHeaderStyles,
        }}
      />

      <BusinessStack.Screen
        name="create-new-business"
        component={CreateNewBusiness}
        options={{
          title: 'Create New Business',
          headerLeft: BackButtonArrow,
          ...commonHeaderStyles,
        }}
      />

      <BusinessStack.Screen
        name="create-new-default-business"
        component={AddDefaultBusiness}
        options={{
          title: 'Create Business Profile',
          headerLeft: () => null,
          ...commonHeaderStyles,
        }}
      />
    </BusinessStack.Navigator>
  );
};

export default BusinessNavigator;
