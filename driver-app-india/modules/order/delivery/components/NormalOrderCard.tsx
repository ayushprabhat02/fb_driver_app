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

const NormalOrderCard: React.FC<Props> = ({order}) => {
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const isSelected = currentDriverOrder?.id === order?.id;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const handleOrderSelect = () => {
    if (isSelected) {
         orderStore.setState(state=>({
           ...state,
           currentDriverOrder: null
         }))
       } else {
           orderStore.setState(state=>({
           ...state,
           currentDriverOrder: order
         }))
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
          #{order.customer_order?.order_code}
        </Text>
        <View style={styles.statusChip}>
          <Text color="primary" size="xs" weight="600">
            {order?.state}
          </Text>
          <Check size={12} color="#1E40AF" style={{marginLeft: 4}} />
        </View>
      </View>

      {/* Customer + Quantity */}
      <View style={styles.row}>
        <User size={14} color="#6B7280" />
        <Text size="sm" style={{marginLeft: 4}}>
          {order.customer_order?.organization_user?.user?.first_name +
            ' ' +
            order.customer_order?.organization_user?.user?.last_name}
        </Text>
        <Package size={14} color="#6B7280" style={styles.iconSpacing} />
        <Text size="sm">
          {(order.customer_order?.customer_order_items[0]?.qty || 0) + 'L'}
        </Text>
      </View>

      {/* Organization Name */}
      <View style={styles.row}>
        <Text size="sm" color="lightGray">
          {order.customer_order?.organization_user?.organization?.name ||
            'Organization'}
        </Text>
      </View>

      {/* Site */}
      <View style={styles.row}>
        <Text size="sm" color="lightGray">
          Site:{' '}
          {order.customer_order?.organizationAddressByShippingAddressId?.name}
        </Text>
      </View>

      {/* Address */}
      <View style={styles.row}>
        <MapPin size={14} color="#6B7280" />
        <Text size="sm" style={{marginLeft: 4}}>
          {
            order.customer_order?.organizationAddressByShippingAddressId
              ?.address_line1
          }
        </Text>
      </View>

      <Divider height={8} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.deliveryChip}>
          <Text color="lightGray" size="xs" weight="600">
            DELIVERY
          </Text>
        </View>
        <Text size="sm">{formatDate(order.customer_order?.order_date)}</Text>
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
    borderColor: '#3B82F6', // blue border for normal orders
    marginBottom: '10@vs',
    marginHorizontal: '0@s',
  },
  selectedCard: {
    backgroundColor: '#E8F0FF',
    borderColor: '#1E40AF',
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
    backgroundColor: '#E8F0FF',
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
    backgroundColor: '#F3F4F6',
    borderRadius: '6@s',
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
  },
});

export default NormalOrderCard;