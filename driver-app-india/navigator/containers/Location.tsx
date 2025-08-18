import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  // Map,
  MapUpdated,
} from '@/modules/location/screens';
import {BackButtonArrow} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';

export type LocationStackParamList = {
  map: undefined;
};

const LocationStack = createStackNavigator<LocationStackParamList>();

const LocationNavigator: React.FC = () => {
  return (
    <LocationStack.Navigator
      initialRouteName="map"
      screenOptions={{
        ...commonHeaderStyles,
        headerLeft: BackButtonArrow,
      }}>
      <LocationStack.Screen
        name="map"
        component={MapUpdated}
        options={{title: ''}}
      />
    </LocationStack.Navigator>
  );
};

export default LocationNavigator;
