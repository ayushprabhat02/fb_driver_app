import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {PickupHome} from '@/modules/pickup/screens';

const DelveryStack = createStackNavigator();

const PickupNavigator: React.FC = () => {
  return (
    <DelveryStack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="pickup-home">
      <DelveryStack.Screen name="pickup-home" component={PickupHome} />
    </DelveryStack.Navigator>
  );
};

export default PickupNavigator;
