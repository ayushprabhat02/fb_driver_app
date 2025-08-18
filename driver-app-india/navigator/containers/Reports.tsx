// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import ReportPage from '@/modules/reports/screen/reportPage';
import {commonHeaderStyles} from '@/styles';
import {BackButtonArrow} from '@/components';

export type ReportParamList = {
  'my-reports': undefined;
};

const ReportStack = createStackNavigator<ReportParamList>();

const ReportNavigator: React.FC = () => {
  return (
    <ReportStack.Navigator
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}
      initialRouteName="my-reports">
      <ReportStack.Screen
        name="my-reports"
        component={ReportPage}
        options={{headerTitle: 'My Reports'}}
      />
    </ReportStack.Navigator>
  );
};

export default ReportNavigator;
