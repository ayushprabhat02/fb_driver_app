// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import CheckinPage from '@/modules/checkin/screens/CheckinPage';
import {commonHeaderStyles} from '@/styles';
import {BackButtonArrow} from '@/components';

export type CheckInParamList = {
  'check-in': undefined;
};

const CheckInStack = createStackNavigator<CheckInParamList>();

const CheckinNavigator: React.FC = () => {
  return (
    <CheckInStack.Navigator
      screenOptions={{
        ...commonHeaderStyles,
      }}
      initialRouteName="check-in">
      <CheckInStack.Screen
        name="check-in"
        component={CheckinPage}
        options={{headerTitle: 'Check In'}}
      />
    </CheckInStack.Navigator>
  );
};

export default CheckinNavigator;
