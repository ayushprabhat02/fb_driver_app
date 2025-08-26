import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text, Divider} from '@/components';
import {FBColors} from '@/types/styles';
import {User, MapPin, Package, Check} from 'lucide-react-native';
import orderStore from '../../store';

interface Props {
  order: any; // type from your driverOrders API
}

const FillupOrderCard: React.FC<Props> = ({order}) => {
  const selectedOrder = orderStore.use.selectedOrder();
  const setSelectedOrder = orderStore.use.setSelectedOrder();
  const isSelected = selectedOrder?.id === order?.id;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const handleOrderSelect = () => {
    if (isSelected) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(order);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={handleOrderSelect}
      activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <Text weight="700" size="lg" color="neutral">
          #{order.id.substring(0, 8)}
        </Text>
        <View style={styles.statusChip}>
          <Text color="primary" size="xs" weight="600">
            {order?.state}
          </Text>
          <Check size={12} color="#1E40AF" style={{marginLeft: 4}} />
        </View>
      </View>

      {/* Driver + Quantity */}
      <View style={styles.row}>
        <User size={14} color="#6B7280" />
        <Text size="sm" style={{marginLeft: 4}}>
          {order.fillup_requests[0]?.driver_vehicle?.user?.first_name ||
            'Driver'}
        </Text>
        <Package size={14} color="#6B7280" style={styles.iconSpacing} />
        <Text size="sm">
          {(order.fillup_requests[0]?.quantity_approved ||
            order.fillup_requests[0]?.quantity ||
            0) + 'L'}
        </Text>
      </View>

      {/* Product Type */}
      <View style={styles.row}>
        <Text size="sm" color="lightGray">
          {order.fillup_requests[0]?.vehicle_tank_type_product_variation
            ?.product_variation?.product?.name || 'Diesel'}
        </Text>
      </View>

      {/* Vehicle Information */}
      <View style={styles.row}>
        <Text size="sm" color="lightGray">
          {order.fillup_requests[0]?.driver_vehicle?.vehicle?.name || 'Vehicle'}
          -
          {order.fillup_requests[0]?.driver_vehicle?.vehicle
            ?.registration_number || 'N/A'}{' '}
        </Text>
      </View>

      <Divider height={8} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.deliveryChip}>
          <Text color="lightGray" size="xs" weight="600">
            FILL_UP
          </Text>
        </View>
        <Text size="sm">Fillup Request</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  card: {
    backgroundColor: 'white',
    padding: '10@s',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: '#28A745', // green border for fillup
    marginBottom: '10@vs',
    marginHorizontal: '0@s',
  },
  selectedCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#28A745',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6@vs',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: '12@s',
    paddingHorizontal: '8@s',
    paddingVertical: '2@vs',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  iconSpacing: {
    marginLeft: '10@s',
    marginRight: '4@s',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6@vs',
  },
  deliveryChip: {
    backgroundColor: '#E8F5E8',
    borderRadius: '6@s',
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
  },
});

export default FillupOrderCard;
