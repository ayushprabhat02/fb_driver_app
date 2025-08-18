//dependencies
import React from 'react';
import {View} from 'react-native';
import {Text} from '@/components';
import {vs, s} from 'react-native-size-matters';

// styles
import {FBColorPalette} from '@/types/styles';

const NoAddress: React.FC = () => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: s(10),
      }}>
      <View style={{flexDirection: 'column', paddingLeft: s(10)}}>
        <Text weight="bold" style={{color: FBColorPalette.error}}>
          You have no saved addresses
        </Text>
        <Text size="xs" style={{color: FBColorPalette.error, marginTop: vs(5)}}>
          Please add new address to order
        </Text>
      </View>
    </View>
  );
};

export default NoAddress;
