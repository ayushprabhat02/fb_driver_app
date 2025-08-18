import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import React from 'react';
import {ScrollView, View} from 'react-native';
import {ms, ScaledSheet} from 'react-native-size-matters';

// Store import
import {Divider, Text} from '@/components';
import orderStore from '../../store';

const BillingAddressUpcoming: React.FC = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetailsId();

  if (!singleOrderDetails) {
    return null;
  }

  const address = singleOrderDetails.organization_address;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.box}>
        <View>
          <Text weight="bold" color="darkGray">
            Billing Address:
          </Text>
          <Divider height={6} />
          <Text color="mediumGray">
            {address?.address_line1},{address?.city?.name},
            {address?.country?.name}, {address?.pincode}
          </Text>
        </View>
        <Divider height={12} />
        {address?.landMark ? (
          <View>
            <Text weight="bold" color="darkGray">
              Nearest Landmark:
            </Text>
            <Divider height={6} />
            <Text color="mediumGray">{address?.landMark}</Text>
          </View>
        ) : null}
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

export default BillingAddressUpcoming;
