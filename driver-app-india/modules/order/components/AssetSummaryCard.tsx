import React, { useMemo, useEffect } from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';
import {orderStore} from '@/globalStore';

const AssetSummaryCard: React.FC = ({}) => {
  const orderAssets = orderStore.use.orderAssets();
  const quantityToBeDispensed = orderStore.use.quantityDispensed();

  // Calculate total quantity from order assets
  const totalQuantity = useMemo(() => {
    return orderAssets?.reduce((total, asset) => {
      return total + (asset.quantity_requested || 0);
    }, 0) || quantityToBeDispensed || 0;
  }, [orderAssets, quantityToBeDispensed]);

  // Calculate dispensed quantity from order assets
  const dispensedQuantity = useMemo(() => {
    return orderAssets?.reduce((total, asset) => {
      return total + (asset.quantity_dispensed || 0);
    }, 0) || 0;
  }, [orderAssets]);

  // Calculate pending quantity
  const pendingQuantity = useMemo(() => {
    return totalQuantity - dispensedQuantity;
  }, [totalQuantity, dispensedQuantity]);

  // Update store with pending quantity
  useEffect(() => {
    orderStore.setState(state => ({
      ...state,
      pendingQuantity
    }));
  }, [pendingQuantity]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (totalQuantity === 0) return 0;
    return Math.round((dispensedQuantity / totalQuantity) * 100);
  }, [dispensedQuantity, totalQuantity]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size="lg" weight="700" color="neutral">
          Assets to be filled
        </Text>
        <Text size="sm" color="lightGray">
          Order Summary
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text size="sm" color="lightGray">
            Total:
          </Text>
          <Text size="base" weight="600" color="neutral">
            {totalQuantity}L
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text size="sm" color="lightGray">
            Filled:
          </Text>
          <Text size="base" weight="600" color="primary">
            {dispensedQuantity}L
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text size="sm" color="lightGray">
            Pending:
          </Text>
          <Text size="base" weight="600" color="error">
            {pendingQuantity}L
          </Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: FBBackground.white,
    borderRadius: '8@s',
    padding: '12@s',
    marginBottom: '12@vs',
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
    marginBottom: '8@vs',
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
  progressContainer: {
    marginTop: '12@vs',
  },
  progressBackground: {
    backgroundColor: FBColors.lightGray,
    borderRadius: '4@s',
    height: '8@vs',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: FBColors.primary,
    height: '100%',
    borderRadius: '4@s',
  },
});

export default AssetSummaryCard;
