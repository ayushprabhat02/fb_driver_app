import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';

interface AssetSummaryCardProps {
  orderId: string;
  totalQuantity: number;
  filledQuantity: number;
  pendingQuantity: number;
  unit?: string;
}

const AssetSummaryCard: React.FC<AssetSummaryCardProps> = ({
  orderId,
  totalQuantity,
  filledQuantity,
  pendingQuantity,
  unit = 'L',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size="lg" weight="700" color="neutral">
          Assets to be filled
        </Text>
        <Text size="sm" color="lightGray">
          Order #{orderId}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text size="sm" color="lightGray">
            Total:
          </Text>
          <Text size="base" weight="600" color="neutral">
            {totalQuantity}
            {unit}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text size="sm" color="lightGray">
            Filled:
          </Text>
          <Text size="base" weight="600" color="primary">
            {filledQuantity}
            {unit}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text size="sm" color="lightGray">
            Pending:
          </Text>
          <Text size="base" weight="600" color="error">
            {pendingQuantity}
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: FBBackground.white,
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: FBBorders.primary,
    shadowColor: FBColors.lightGray,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: '12@vs',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
});

export default AssetSummaryCard;
