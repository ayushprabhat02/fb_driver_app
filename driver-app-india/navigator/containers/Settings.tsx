// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import Settings from '@/modules/settings/screens';

export type SettingsStackParamList = {
  'user-settings': undefined;
};

const SettingsStack = createStackNavigator<SettingsStackParamList>();

const SettingsNavigator: React.FC = () => {
  return (
    <SettingsStack.Navigator initialRouteName="user-settings">
      <SettingsStack.Screen
        name="user-settings"
        component={Settings}
        options={{headerShown: false}}
      />
    </SettingsStack.Navigator>
  );
};

export default SettingsNavigator;
