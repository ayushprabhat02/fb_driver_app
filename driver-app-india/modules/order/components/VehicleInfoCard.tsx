import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text, Divider, CardElevated} from '@/components';

interface VehicleInfoCardProps {
  vehicleName: string;
  tankTypeName: string;
  requestedQuantity: number | string;
  orderState: string;
  statusColor: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
}

const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({
  vehicleName,
  tankTypeName,
  requestedQuantity,
  orderState,
  statusColor,
}) => {
  return (
    <CardElevated style={styles.card}>
      <View style={styles.header}>
        <Text size="base" weight="600" color="neutral">
          Vehicle Information
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusColor.backgroundColor,
              borderColor: statusColor.borderColor,
            },
          ]}>
          <Text
            size="xs"
            weight="600"
            style={{color: statusColor.textColor}}>
            {orderState}
          </Text>
        </View>
      </View>

      <Divider height={12} />

      <View style={styles.infoRow}>
        <Text size="sm" color="secondary">
          Vehicle Name
        </Text>
        <Text size="sm" weight="600" color="neutral">
          {vehicleName}
        </Text>
      </View>

      <Divider height={8} />

      <View style={styles.infoRow}>
        <Text size="sm" color="secondary">
          Tank Type
        </Text>
        <Text size="sm" weight="600" color="neutral">
          {tankTypeName}
        </Text>
      </View>

      <Divider height={8} />

      <View style={styles.infoRow}>
        <Text size="sm" color="secondary">
          Requested Quantity
        </Text>
        <Text size="sm" weight="600" color="primary">
          {requestedQuantity} L
        </Text>
      </View>
    </CardElevated>
  );
};

const styles = ScaledSheet.create({
  card: {
    padding: '16@s',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: '10@s',
    paddingVertical: '4@vs',
    borderRadius: '12@s',
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default VehicleInfoCard;
