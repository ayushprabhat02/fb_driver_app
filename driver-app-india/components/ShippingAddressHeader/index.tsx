// dependencies
import {Pressable, StyleSheet, View} from 'react-native';
import React from 'react';
import {ArrowLeft} from 'phosphor-react-native';
import {useNavigation} from '@react-navigation/native';

// store
import {deliveryStore} from '@/globalStore';

// types
import {FBColorPalette} from '@/types/styles';
import Text from '../Text';

const ShippingAddressHeader: React.FC = () => {
  const selectedShippingAddress = deliveryStore.use.selectedShippingAddress();

  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', columnGap: 12}}>
        <Pressable onPress={() => navigation.goBack()}>
          <ArrowLeft color={FBColorPalette.primary} weight="bold" />
        </Pressable>
        <View>
          <Text weight="600" size="sm" color="steelBlue">
            {selectedShippingAddress?.name}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              position: 'relative',
              alignItems: 'flex-end',
            }}>
            <Text weight="500">Deliver at</Text>
            <Text
              lines={1}
              style={{width: '70%'}}
              color="steelBlue"
              weight="500">
              {' '}
              | {selectedShippingAddress?.address_line1}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ShippingAddressHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 48,
    paddingHorizontal: 12,
  },
});
