// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Divider} from '@/components';
import {
  CheckoutAssetCount,
  CheckoutBillingAddress,
  CheckoutShippingAddress,
} from './index';

// styles & types
import {FBBackground} from '@/types/styles';

const DeliveryDetails: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* date & time */}
      <CheckoutShippingAddress />

      {/* shipping address */}
      <Divider height={16} />
      <CheckoutBillingAddress />

      {/* asset count */}
      <Divider height={16} />
      <CheckoutAssetCount />
    </View>
  );
};

export default DeliveryDetails;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: FBBackground.softBlue,
  },
});
