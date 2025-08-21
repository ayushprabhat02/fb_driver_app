// dependencies
import {useNavigation} from '@react-navigation/native';
import {DateTime} from 'luxon';
import React, {memo} from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {Divider, Text, TextButton, Chip} from '@/components';

// types
import {FetchOrderForDriverNew2Query} from '@/generated/graphql';
import {FBBorders} from '@/types/styles';

interface Props {
  task: FetchOrderForDriverNew2Query['task'][0];
  onPress?: (task: FetchOrderForDriverNew2Query['task'][0]) => void;
}

const DriverTaskCard: React.FC<Props> = ({task, onPress}) => {
  const navigation = useNavigation();

  const handleTaskPress = () => {
    if (onPress) {
      onPress(task);
    }
  };

  const getTaskStatus = (state: string) => {
    switch (state) {
      case 'ASSIGNED':
        return 'ASSIGNED';
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'DELIVERED':
        return 'DELIVERED';
      default:
        return state;
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'ASSIGNED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'orange';
      case 'COMPLETED':
        return 'green';
      case 'DELIVERED':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const customerOrder = task.customer_order;
  const customerInfo = customerOrder?.organization_user;
  const shippingAddress = customerOrder?.organizationAddressByShippingAddressId;
  const orderItem = customerOrder?.customer_order_items?.[0];
  const product = orderItem?.product_variation?.product;

  return (
    <View style={styles.taskCardContainer}>
      {/* Task ID and Status */}
      <View style={styles.headerRow}>
        <Text size="lg" weight="700" color="primary">
          #{task.id.slice(-6)}
        </Text>
        <Chip
          text={getTaskStatus(task.state)}
          color={getStatusColor(task.state)}
          size="sm"
        />
      </View>

      <Divider height={8} />

      {/* Customer Name */}
      <TaskDetail
        detail="Customer Name"
        value={`${customerInfo?.user?.first_name || ''} ${customerInfo?.user?.last_name || ''}`.trim() || 'N/A'}
        emphasize
      />

      <Divider height={6} />
      
      {/* Organization */}
      <TaskDetail
        detail="Organization"
        value={customerInfo?.organization?.name || 'N/A'}
        emphasize
      />

      <Divider height={6} />
      
      {/* Site */}
      <TaskDetail
        detail="Site"
        value={shippingAddress?.name || 'N/A'}
      />

      {/* Address */}
      <Divider height={6} />
      <View style={styles.addressRow}>
        <Text size="sm" weight="600">
          Address:{' '}
        </Text>
        <View style={styles.addressTextContainer}>
          <Text size="sm" lines={2} style={styles.addressText}>
            {[
              shippingAddress?.address_line1,
              shippingAddress?.address_line2,
              task.organization_address?.address_line1,
              task.organization_address?.address_line2,
              task.organization_address?.pincode,
            ]
              .filter(Boolean)
              .join(', ') || 'Address not available'}
          </Text>
        </View>
      </View>

      {/* Product and Quantity */}
      {product && (
        <>
          <Divider height={6} />
          <View style={styles.productRow}>
            <TaskDetail
              detail="Product"
              value={`${product.name} ${orderItem?.qty}L`}
            />
            <Text size="sm" weight="700" color="primary">
              {orderItem?.qty}L
            </Text>
          </View>
        </>
      )}

      {/* Delivery Date */}
      <Divider height={6} />
      <TaskDetail
        detail="DELIVERY"
        value={DateTime.fromISO(orderItem?.estimate_delivery_date || task.customer_order?.customer_order_items?.[0]?.estimate_delivery_date || '').toFormat('dd/MM/yyyy')}
      />

      {/* Action Button */}
      <Divider height={12} />
      <View style={styles.actionRow}>
        <TextButton textSize="sm" onPress={handleTaskPress}>
          View Task Details
        </TextButton>
      </View>
    </View>
  );
};

interface TaskDetailProps {
  detail: string;
  value: string | number;
  emphasize?: boolean;
}

const TaskDetail: React.FC<TaskDetailProps> = memo(
  ({detail, value, emphasize = false}) => (
    <View style={styles.detailRow}>
      <Text weight="600" size="sm" color="darkGray">
        {detail}:{' '}
      </Text>
      <Text
        weight={emphasize ? '600' : '400'}
        size="sm"
        style={styles.detailValue}>
        {value}
      </Text>
    </View>
  ),
);

export default DriverTaskCard;

const styles = ScaledSheet.create({
  taskCardContainer: {
    backgroundColor: 'white',
    padding: '12@s',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    marginBottom: '8@vs',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  detailValue: {
    flex: 1,
    marginLeft: '4@s',
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  addressTextContainer: {
    flex: 1,
    marginLeft: '4@s',
  },

  addressText: {
    color: '#374151',
  },

  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});