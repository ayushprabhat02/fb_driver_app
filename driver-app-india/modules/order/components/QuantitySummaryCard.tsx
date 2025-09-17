import React from 'react';
import {View, Text} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {orderStore} from '@/globalStore';
import {FBColorPalette} from '@/types/styles';

const QuantitySummaryCard: React.FC = () => {
  // Use Zustand selectors for reactive data (per project specification)
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();
  const orderAssets = orderStore.use.orderAssets();

  // Calculate totals (matching Vue.js QuantitySummaryCard logic)
  const totalQuantity = quantityToBeDispensed || 0;
  
  const dispensedQuantity = React.useMemo(() => {
    return (orderAssets || []).reduce((total, asset) => {
      return total + (asset.quantity_dispensed || 0);
    }, 0);
  }, [orderAssets]);

  const pendingQuantity = totalQuantity - dispensedQuantity;

  const progressPercentage = React.useMemo(() => {
    if (totalQuantity === 0) return 0;
    return Math.round((dispensedQuantity / totalQuantity) * 100);
  }, [dispensedQuantity, totalQuantity]);

  return (
    <View style={styles.container}>
      {/* Summary Numbers */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>Total:</Text>
          <Text style={[styles.value, styles.totalValue]}>{totalQuantity}L</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>Filled:</Text>
          <Text style={[styles.value, styles.filledValue]}>{dispensedQuantity}L</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>Pending:</Text>
          <Text style={[styles.value, styles.pendingValue]}>{pendingQuantity}L</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              {width: `${progressPercentage}%`}
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: '16@s',
    marginBottom: '12@vs',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  label: {
    fontSize: '12@s',
    color: FBColorPalette.mediumGray,
    marginBottom: '4@vs',
  },
  value: {
    fontSize: '14@s',
    fontWeight: '600',
  },
  totalValue: {
    color: FBColorPalette.text,
  },
  filledValue: {
    color: '#059669', // Green-600
  },
  pendingValue: {
    color: '#D97706', // Orange-600
  },
  progressContainer: {
    marginTop: '12@vs',
  },
  progressBackground: {
    height: '8@vs',
    backgroundColor: '#E5E7EB', // Gray-200
    borderRadius: '4@s',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981', // Green-500
    borderRadius: '4@s',
  },
});

export default QuantitySummaryCard;