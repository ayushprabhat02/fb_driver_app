// dependencies
import {View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

const Heading: React.FC = () => {
  return (
    <View style={{alignItems: 'center'}}>
      <Text style={{fontSize: 24}} weight="600">
        Choose your delivery profile
      </Text>
      <Divider />
      <Text color="steelBlue" style={{fontSize: 16}} weight="400">
        Select or create a business profile
      </Text>
    </View>
  );
};

export default Heading;
