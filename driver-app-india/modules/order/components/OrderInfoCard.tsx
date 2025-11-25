import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text, Divider} from '@/components';
import {FBBorders, FBBackground} from '@/types/styles';
import {orderStore} from '@/globalStore';

interface OrderInfoCardProps {
  dispensedQuantity?: number;
  dispensedAssets?: any[];
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({
  dispensedQuantity = 0,
  dispensedAssets = [],
}) => {
  const currentDriverOrder = orderStore.use.currentDriverOrder();

  // Get Indus ID and Date
  const indusId =
    currentDriverOrder?.organization_address?.name || 'N/A';
  const deliveryDate =
    currentDriverOrder?.customer_order?.customer_order_items?.[0]
      ?.estimate_delivery_date || 'N/A';

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return 'N/A';
    }
  };

  const renderDispensedAssets = () => {
    if (!dispensedAssets || dispensedAssets.length === 0) {
      return (
        <Text size="sm" color="lightGray" weight="400">
          No assets dispensed
        </Text>
      );
    }

    return dispensedAssets.map((asset: any, index: number) => (
      <View key={index}>
        {index > 0 && <Divider height={4} />}
        <View style={styles.assetRow}>
          <Text size="sm" color="neutral" weight="500">
            {asset.customer_asset?.name || 'Unknown Asset'}
          </Text>
          <Text size="sm" color="primary" weight="700">
            {asset.quantity_dispensed} L
          </Text>
        </View>
      </View>
    ));
  };

  // Render default variant
  return (
    <>
      {/* Order Summary */}
      <View style={styles.vehicleDetailsContainer}>
        <Text weight="700" size="base" color="neutral">
          Delivery Summary
        </Text>

        <Divider height={12} />

        <View style={styles.summaryRow}>
          <Text size="sm" color="secondary" weight="500">
            Order Code
          </Text>
          <Text size="sm" color="primary" weight="600">
            #{currentDriverOrder?.customer_order?.order_code || 'N/A'}
          </Text>
        </View>

        <Divider height={4} />

        <View style={styles.summaryRow}>
          <Text size="sm" color="secondary" weight="500">
            Indus ID
          </Text>
          <Text size="sm" color="primary" weight="600">
            {indusId}
          </Text>
        </View>

        <Divider height={4} />

        <View style={styles.summaryRow}>
          <Text size="sm" color="secondary" weight="500">
            Date
          </Text>
          <Text size="sm" color="primary" weight="600">
            {formatDate(deliveryDate)}
          </Text>
        </View>

        <Divider height={4} />

        <View style={styles.summaryRow}>
          <Text size="sm" color="secondary" weight="500">
            Total Dispensed
          </Text>
          <Text size="sm" color="primary" weight="700">
            {dispensedQuantity} L
          </Text>
        </View>
      </View>

      {/* Dispensed Assets - Only show when there are assets */}
      {dispensedAssets && dispensedAssets.length > 0 && (
        <>
          <Divider height={16} />
          <View style={styles.vehicleDetailsContainer}>
            <Text weight="700" size="base" color="neutral">
              Dispensed Assets
            </Text>
            <Divider height={12} />
            {renderDispensedAssets()}
          </View>
        </>
      )}
    </>
  );
};

const styles = ScaledSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleDetailsContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: FBBorders.primary,
    borderRadius: '12@s',
    padding: '16@s',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default OrderInfoCard;
