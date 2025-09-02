// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  MyOrders,
  OrderDetails,
  OrderDetailsUpcoming,
} from '@/modules/order/delivery/screens';
import ChooseAsset from '@/modules/order/screens/ChooseAsset';
import FillAsset from '@/modules/order/screens/FillAsset';
import UploadImageAsset from '@/modules/order/screens/UploadImageAsset';
import LiveStreamScreen from '@/modules/order/screens/LiveStreamScreen';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';
import {FBBackground} from '@/types/styles';

export type OrderStackParamList = {
  'delivery-orders': undefined;
  'order-details': {
    orderId: string;
  };
  'order-details-upcoming': {
    orderId: string;
  };
  'choose-asset': undefined;
  'fill-asset': undefined;
  'upload-image-asset': undefined;
  'live-stream': undefined;
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
      <OrderStack.Screen
        name="choose-asset"
        component={ChooseAsset}
        options={{
          title: 'Choose Asset ',
          headerTransparent: false,
          headerStyle: {
            backgroundColor: FBBackground.white,
          },
        }}
      />
      <OrderStack.Screen
        name="fill-asset"
        component={FillAsset}
        options={{
          title: 'Fill Asset',
          headerTransparent: false,
          headerStyle: {
            backgroundColor: 'white',
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 0,
          },
        }}
      />
      <OrderStack.Screen
        name="upload-image-asset"
        component={UploadImageAsset}
        options={{
          title: 'Upload Fillup Images',
        }}
      />
      <OrderStack.Screen
        name="live-stream"
        component={LiveStreamScreen}
        options={{
          title: 'Live Stream Recording',
          headerTransparent: false,
          headerStyle: {
            backgroundColor: FBBackground.white,
          },
        }}
      />
    </OrderStack.Navigator>
  );
};

export default OrderNavigator;
