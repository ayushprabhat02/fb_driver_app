//dependencies
import {createStackNavigator, StackScreenProps} from '@react-navigation/stack';
import React from 'react';
import {View} from 'react-native';
import {Client, Provider} from 'urql';
import {Text} from '@/components';

// components
import {
  AddressNavigator,
  AssetsNavigator,
  DeliveryNavigator,
  HomeNavigator,
  LocationNavigator,
  OrderNavigator,
  SettingsNavigator,
  SupportNavigator,
  UserNavigator,
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
  assets: undefined;
  location: undefined;
  address: undefined;
  order: undefined;
  settings: undefined;
  user: undefined;
};
export type Props = StackScreenProps<ProtectedStackParamList, 'home'>;

const ProtectedNavigator: React.FC<Props> = () => {
  const graphQLClient = authStore.use.graphQLClient();

  // Show loading immediately if client is not ready
  if (!graphQLClient) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
        <ProtectedStack.Screen name="assets" component={AssetsNavigator} />
        <ProtectedStack.Screen
          name="location"
          component={LocationNavigator}
          options={{headerShown: false}}
        />

        <ProtectedStack.Screen name="address" component={AddressNavigator} />
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
        <ProtectedStack.Screen name="checkin" component={CheckinNavigator} />
      </ProtectedStack.Navigator>
    </Provider>
  );
};

export default ProtectedNavigator;
