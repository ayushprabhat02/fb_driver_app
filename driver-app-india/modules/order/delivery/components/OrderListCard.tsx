import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text, Chip, Divider} from '@/components';
import {FBColors} from '@/types/styles';
import {DateTime} from 'luxon';
import {User, MapPin, Package, Check} from 'lucide-react-native';

interface Props {
  order: any; // type from your driverOrders API
}

const DriverOrderCard: React.FC<Props> = ({order}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text weight="700" size="lg" color={FBColors.secondary}>
          #{order?.customer_order?.order_code}
        </Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{order?.state}</Text>
          <Check size={12} color="#1E40AF" style={{marginLeft: 4}} />
        </View>
      </View>

      {/* Customer + Quantity */}
      <View style={styles.row}>
        <User size={14} color={FBColors.darkGray} />
        <Text size="sm" style={styles.text}>
          {order?.customer_order?.organization_user?.user?.first_name ||
          order?.customer_order?.organization_user?.user?.last_name
            ? `${
                order?.customer_order?.organization_user?.user?.first_name ?? ''
              } ${
                order?.customer_order?.organization_user?.user?.last_name ?? ''
              }`.trim()
            : 'Customer'}
        </Text>
        <Package
          size={14}
          color={FBColors.darkGray}
          style={styles.iconSpacing}
        />
        <Text size="sm">
          {(order?.customer_order?.customer_order_items?.[0]?.qty ?? 0) + 'L'}
        </Text>
      </View>

      {/* Customer Name */}
      <View style={styles.row}>
        <Text size="sm" color={FBColors.darkGray}>
          {order.customer_order?.organization_user?.organization?.name ||
            'Organization'}
        </Text>
      </View>

      {/* Site */}
      <View style={styles.row}>
        <Text size="sm" color={FBColors.darkGray}>
          Site:{' '}
          {order.customer_order?.organizationAddressByShippingAddressId?.name}
        </Text>
      </View>

      {/* Address */}
      <View style={styles.row}>
        <MapPin size={14} color={FBColors.darkGray} />
        <Text size="sm" style={styles.text}>
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
          <Text style={styles.deliveryText}>DELIVERY</Text>
        </View>
        <Text size="sm">{formatDate(order.customer_order?.order_date)}</Text>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  card: {
    backgroundColor: 'white',
    padding: '10@s',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: '#3B82F6', // blue border
    marginBottom: '10@vs',
    marginHorizontal: '12@s',
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
  statusText: {
    color: '#1E40AF',
    fontSize: '11@s',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  text: {
    marginLeft: '4@s',
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
    backgroundColor: FBColors.lightGray,
    borderRadius: '6@s',
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
  },
  deliveryText: {
    color: FBColors.darkGray,
    fontSize: '11@s',
    fontWeight: '600',
  },
});

export default DriverOrderCard;
