import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import React from 'react';
import {ScrollView, View} from 'react-native';
import {ms, ScaledSheet} from 'react-native-size-matters';

// Store import
import {Divider, Text} from '@/components';
import orderStore from '../../store';

const ItemsTotal: React.FC = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetails();

  if (!singleOrderDetails) {
    return null;
  }

  const address = singleOrderDetails?.organizationAddressByShippingAddressId;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.box}>
        <View>
          <Text weight="bold" color="darkGray">
            Delivery Address:
          </Text>
          <Divider height={6} />
          <Text color="mediumGray">
            {address?.address_line1}, {address?.address_line2},
            {address?.city?.name}, {address?.country?.name}, {address?.pincode}
          </Text>
        </View>
        {address?.landMark ? <Divider height={12} /> : null}
        {address?.landMark ? (
          <View>
            <Text weight="bold" color="darkGray">
              Nearest Landmark:
            </Text>
            <Divider height={6} />
            <Text color="mediumGray">
              {address?.landMark || 'Not provided'}
            </Text>
          </View>
        ) : null}
        <Divider height={12} />
        <View>
          <Text weight="bold" color="darkGray">
            Address Note:
          </Text>
          <Text color="mediumGray">
            {address?.instruction || 'No additional instructions'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  box: {
    padding: ms(16),
    borderRadius: ms(8),
    backgroundColor: FBBackground.seaShell,
    borderColor: FBBorders.secondary,
    borderWidth: 1,
  },
  label: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: FBColors.primary,
  },
});

export default ItemsTotal;
