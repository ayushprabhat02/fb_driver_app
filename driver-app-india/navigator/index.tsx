//dependencies
import {createStackNavigator, StackScreenProps} from '@react-navigation/stack';
import React from 'react';
import {Client, Provider} from 'urql';

// components
import {
  AddressNavigator,
  AssetsNavigator,
  BusinessNavigator,
  DeliveryNavigator,
  HomeNavigator,
  LocationNavigator,
  OrderNavigator,
  PickupNavigator,
  SettingsNavigator,
  SupportNavigator,
  UserNavigator,
  WalletNavigator,
  ReportNavigator,
  CheckinNavigator,
} from './containers';

//store
import {authStore} from '@/globalStore';

// styles
import {BackButtonArrow} from '@/components';
import {commonHeaderStyles} from '@/styles';

const ProtectedStack = createStackNavigator();

export type ProtectedStackParamList = {
  home: undefined;
  delivery: any;
  pickup: undefined;
  assets: undefined;
  location: undefined;
  address: undefined;
  order: undefined;
  settings: undefined;
  wallet: undefined;
  user: undefined;
};
export type Props = StackScreenProps<ProtectedStackParamList, 'home'>;

const ProtectedNavigator: React.FC<Props> = () => {
  const graphQLClient = authStore.use.graphQLClient();

  return (
    // production
    <Provider value={graphQLClient as Client}>
      <ProtectedStack.Navigator
        screenOptions={{headerShown: false, gestureEnabled: false}}
        initialRouteName="checkin">
        <ProtectedStack.Screen
          name="home"
          component={HomeNavigator as React.ComponentType}
        />
        <ProtectedStack.Screen name="delivery" component={DeliveryNavigator} />
        <ProtectedStack.Screen name="pickup" component={PickupNavigator} />
        <ProtectedStack.Screen name="assets" component={AssetsNavigator} />
        <ProtectedStack.Screen
          name="location"
          component={LocationNavigator}
          options={{headerShown: false}}
        />

        <ProtectedStack.Screen name="reports" component={ReportNavigator} />
        <ProtectedStack.Screen name="address" component={AddressNavigator} />
        <ProtectedStack.Screen
          name="wallet"
          component={WalletNavigator}
          // options={{
          //   title: '',
          //   ...commonHeaderStyles,
          //   headerTintColor: FBColors.primary,
          // }}
        />
        <ProtectedStack.Screen
          name="settings"
          component={SettingsNavigator}
          options={{
            title: '',
            ...commonHeaderStyles,
            headerLeft: BackButtonArrow,
          }}
        />
        <ProtectedStack.Screen name="order" component={OrderNavigator} />
        <ProtectedStack.Screen name="support" component={SupportNavigator} />
        <ProtectedStack.Screen name="user" component={UserNavigator} />
        <ProtectedStack.Screen name="business" component={BusinessNavigator} />
        <ProtectedStack.Screen name="checkin" component={CheckinNavigator} />
      </ProtectedStack.Navigator>
    </Provider>
  );
};

export default ProtectedNavigator;
