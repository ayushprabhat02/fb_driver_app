// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  MyOrders,
  OrderDetails,
  OrderDetailsUpcoming,
} from '@/modules/order/delivery/screens';
import FillAsset from '@/modules/order/screens/FillAsset';
import UploadImageAsset from '@/modules/order/screens/UploadImageAsset';
import TotalizerAfterManual from '@/modules/order/screens/TotalizerAfterManual';
import LiveStreamScreen from '@/modules/order/screens/LiveStreamScreen';
import ChooseAssetScreen from '@/modules/order/screens/ChooseAssetScreen';
import ReachLocationScreen from '@/modules/order/screens/ReachLocationScreen';
import DeliveryChallanScreen from '@/modules/order/screens/DeliveryChallanScreen';
import BuddyChallanScreen from '@/modules/order/screens/BuddyChallanScreen';
import OCRReadingScreen from '@/modules/order/screens/OCRReadingScreen';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';
import {FBBackground} from '@/types/styles';

export type OrderStackParamList = {
  'ocr-reading': undefined;
  'delivery-orders': undefined;
  'order-details': {
    orderId: string;
  };
  'order-details-upcoming': {
    orderId: string;
  };
  'choose-asset': undefined;
  'reach-location': undefined;
  'fill-asset': undefined;
  'upload-image-asset': undefined;
  'totalizer-after-manual': undefined;
  'live-stream': undefined;
  'delivery-challan': undefined;
  'buddy-challan': undefined;
};

const OrderStack = createStackNavigator<OrderStackParamList>();

const OrderNavigator: React.FC = () => {
  return (
    <OrderStack.Navigator
      initialRouteName="ocr-reading"
      screenOptions={{...commonHeaderStyles}}>
      <OrderStack.Screen
        name="ocr-reading"
        component={OCRReadingScreen}
        options={{
          title: 'OCR Reading',
          headerLeft: BackButtonArrow,
        }}
      />
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
        component={ChooseAssetScreen}
        options={{
          title: 'Choose Asset',
          headerTransparent: false,
          headerStyle: {
            backgroundColor: FBBackground.white,
          },
        }}
      />
      <OrderStack.Screen
        name="reach-location"
        component={ReachLocationScreen}
        options={{
          title: 'Reach Location',
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
          title: 'Start Totalizer Reading',
        }}
      />
      <OrderStack.Screen
        name="totalizer-after-manual"
        component={TotalizerAfterManual}
        options={{
          title: 'End Totalizer Reading',
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
      <OrderStack.Screen
        name="delivery-challan"
        component={DeliveryChallanScreen}
        options={{
          title: 'Delivery Challan',
          headerTransparent: false,
          headerStyle: {
            backgroundColor: FBBackground.white,
          },
        }}
      />
      <OrderStack.Screen
        name="buddy-challan"
        component={BuddyChallanScreen}
        options={{
          title: 'Buddy Challan',
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
