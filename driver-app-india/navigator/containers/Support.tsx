// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  SupportForm,
  SupportHome,
  SupportTickets,
  SupportTicketDetails,
} from '@/modules/support/screens';

// styles
import {commonHeaderStyles} from '@/styles';
import {BackButtonArrow} from '@/components';

export type SupportStackParamList = {
  'support-form': undefined;
  'support-tickets': undefined;
  'support-home': undefined;
  'support-ticket-details': undefined;
};

const SupportStack = createStackNavigator<SupportStackParamList>();

const SupportNavigator: React.FC = () => {
  return (
    <SupportStack.Navigator
      initialRouteName="support-home"
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}>
      <SupportStack.Screen
        name="support-form"
        component={SupportForm}
        options={{
          title: 'Support Ticket',
        }}
      />
      <SupportStack.Screen
        name="support-tickets"
        component={SupportTickets}
        options={{
          title: 'My Tickets',
        }}
      />
      <SupportStack.Screen
        name="support-ticket-details"
        component={SupportTicketDetails}
        options={{
          title: 'Ticket Details',
        }}
      />
      <SupportStack.Screen
        name="support-home"
        component={SupportHome}
        options={{
          title: 'Ticket',
        }}
      />
    </SupportStack.Navigator>
  );
};

export default SupportNavigator;
