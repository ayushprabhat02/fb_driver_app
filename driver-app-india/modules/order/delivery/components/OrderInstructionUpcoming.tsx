import React from 'react';
import {View, ScrollView} from 'react-native';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {ms, ScaledSheet} from 'react-native-size-matters';

// Store import
import orderStore from '../../store';
import {Divider, Text} from '@/components';

const OrderInstructionUpcoming: React.FC = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetailsId();

  if (!singleOrderDetails) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.box}>
        <View>
          <Text weight="bold" color="darkGray">
            Order Note :
          </Text>
          <Divider height={6} />
          <Text color="mediumGray">
            {singleOrderDetails?.instruction || 'No additional instructions'}
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

export default OrderInstructionUpcoming;
