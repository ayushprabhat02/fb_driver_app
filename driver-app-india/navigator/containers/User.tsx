// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  UserProfile,
  AddDefaultOrg,
} from '@/modules/user/screens';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';

export type UserStackParamList = {
  'user-profile': undefined;
  'add-default-org': undefined;
};

const UserStack = createStackNavigator<UserStackParamList>();

const UserNavigator: React.FC = () => {
  return (
    <UserStack.Navigator
      initialRouteName="user-profile"
      screenOptions={{
        ...commonHeaderStyles,
        headerTitleAlign: 'center',
      }}>
      <UserStack.Screen
        name="user-profile"
        component={UserProfile}
        options={{
          title: '',
          headerLeft: BackButtonArrow,
        }}
      />
      <UserStack.Screen
        name="add-default-org"
        component={AddDefaultOrg}
        options={{
          title: '',
          headerLeft: BackButtonArrow,
        }}
      />
    </UserStack.Navigator>
  );
};

export default UserNavigator;
