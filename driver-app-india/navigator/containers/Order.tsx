// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  MyOrders,
  OrderDetails,
  OrderDetailsUpcoming,
} from '@/modules/order/delivery/screens';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';

export type OrderStackParamList = {
  'delivery-orders': undefined;
  'order-details': {
    orderId: string;
  };
  'order-details-upcoming': {
    orderId: string;
  };
};

const OrderStack = createStackNavigator<OrderStackParamList>();

const OrderNavigator: React.FC = () => {
  return (
    <OrderStack.Navigator
      initialRouteName="delivery-orders"
      screenOptions={{...commonHeaderStyles}}>
      <OrderStack.Screen
        name="delivery-orders"
        component={MyOrders}
        options={{
          title: 'My Orders',
          headerLeft: BackButtonArrow,
        }}
      />
      <OrderStack.Screen
        name="order-details"
        component={OrderDetails as React.ComponentType}
        options={{
          title: 'Order Details',
        }}
      />
      <OrderStack.Screen
        name="order-details-upcoming"
        component={OrderDetailsUpcoming as React.ComponentType}
        options={{
          title: 'Order Details',
        }}
      />
    </OrderStack.Navigator>
  );
};

export default OrderNavigator;
