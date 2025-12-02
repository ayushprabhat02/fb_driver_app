import React, {memo} from 'react';
import {View, TouchableOpacity, Pressable, Alert} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text, Divider} from '@/components';
import {FBBorders} from '@/types/styles';
import {DateTime} from 'luxon';
import {X} from 'phosphor-react-native';
import orderStore from '../../store';
import {homeStore, authStore} from '@/globalStore';
import fillupStore from '@/modules/fillupRequest/store';
import {canSelectOrder, getOrderValidationState, showOrderSelectionAlert} from '@/utils/orderValidation';
import orderService from '../../services';

interface Props {
  order: any; // type from your driverOrders API
  onRefreshOrders?: () => Promise<void>; // callback to refresh orders
}

const NormalOrderCard: React.FC<Props> = ({order, onRefreshOrders}) => {
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const isSelected = currentDriverOrder?.id === order?.id;

  // Get validation state from stores
  const driverOrders = homeStore.use.driverOrders();
  const fillupHistory = fillupStore.use.fillupHistory();
  const isLoadingOrder = homeStore.use.loaders().driverCurrentOrder;
  const userRole = authStore.use.userRole();

  const validationState = getOrderValidationState(driverOrders || [], fillupHistory || []);
  const canSelect = canSelectOrder(order, validationState, isLoadingOrder, driverOrders || [], userRole);

  const getOrderStateColor = (state: string) => {
    switch (state) {
      case 'DISPENSING':
        return {
          backgroundColor: '#fee2e2',
          textColor: '#991b1b',
          borderColor: '#fecaca',
        };
      case 'ASSIGNED':
        return {
          backgroundColor: '#dbeafe',
          textColor: '#1e40af',
          borderColor: '#bfdbfe',
        };
      case 'IN_TRANSIT':
        return {
          backgroundColor: '#fef3c7',
          textColor: '#92400e',
          borderColor: '#fde68a',
        };
      case 'ARRIVED':
        return {
          backgroundColor: '#dcfce7',
          textColor: '#166534',
          borderColor: '#bbf7d0',
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
        };
    }
  };

  const handleOrderSelect = async () => {
    if (isSelected) {
      orderStore.setState(state => ({
        ...state,
        currentDriverOrder: null,
      }));
    } else {
      // Check if order can be selected
      if (!canSelect) {
        showOrderSelectionAlert(order, validationState, userRole, driverOrders || []);
        return;
      }

      orderStore.setState(state => ({
        ...state,
        currentDriverOrder: order,
      }));

      // Update rank for task (matching Vue.js implementation)
      // Move selected order to rank 1 and push all others down
      try {
        const rankingList = [];

        // Add selected order at rank 1
        rankingList.push({taskId: order.id, rank_id: 1});

        // Add all other orders at subsequent ranks
        let currentRank = 2;
        (driverOrders || []).forEach((otherOrder: any) => {
          if (otherOrder.id !== order.id) {
            rankingList.push({taskId: otherOrder.id, rank_id: currentRank});
            currentRank++;
          }
        });

        if (rankingList.length > 0) {
          await orderService.updateRankForTask({
            updateRankForTaskList: rankingList,
          });
          console.log('✅ Task ranking updated successfully');
        }
      } catch (error) {
        // Silent error - ranking is not critical
        console.error('Error updating task rank:', error);
      }
    }
  };

  const getCustomerName = () => {
    const firstName =
      order.customer_order?.organization_user?.user?.first_name || '';
    const lastName =
      order.customer_order?.organization_user?.user?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Customer';
  };

  const getQuantity = () => {
    return (order.customer_order?.customer_order_items[0]?.qty || 0) + 'L';
  };

  const getOrderDate = () => {
    if (!order.customer_order?.order_date) return '';
    return DateTime.fromISO(order.customer_order.order_date).toFormat(
      'dd-MMM-yyyy hh:mm a',
    );
  };

  const handleCancelOrder = (event: any) => {
    // Stop event propagation to prevent card selection
    event.stopPropagation();

    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order ${order.customer_order?.order_code}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Cancelling order:', order.customer_order?.order_code);

              // Start loader for cancelling order
              homeStore.setState(state => ({
                ...state,
                loaders: {
                  ...state.loaders,
                  driverCurrentOrder: true,
                },
              }));

              // Call the markOrderCancel API to update order state to CANCELLATION_REQUESTED
              await orderService.markOrderCancel({ id: order.id });

              console.log('Order cancelled successfully');

              // Clear current selected order if it was this order
              if (isSelected) {
                orderStore.setState(state => ({
                  ...state,
                  currentDriverOrder: null,
                }));
              }

              // Refresh the orders list using the callback from parent component
              if (onRefreshOrders) {
                await onRefreshOrders();
              }

              Alert.alert(
                'Order Cancelled',
                `Order ${order.customer_order?.order_code} has been successfully cancelled.`,
                [{ text: 'OK' }]
              );

            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert(
                'Cancellation Failed',
                `Failed to cancel order ${order.customer_order?.order_code}. Please try again.`,
                [{ text: 'OK' }]
              );
            } finally {
              // Stop loader
              homeStore.setState(state => ({
                ...state,
                loaders: {
                  ...state.loaders,
                  driverCurrentOrder: false,
                },
              }));
            }
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.orderListCardContainer,
        isSelected && styles.selectedCard,
        !canSelect && styles.disabledCard
      ]}
      onPress={handleOrderSelect}
      activeOpacity={canSelect ? 0.7 : 1}>
      {/* First Row: Order Code and Site */}
      <View style={styles.firstRow}>
        <View style={styles.leftSection}>
          <Text weight="600" size="sm">
            Order Code:{' '}
          </Text>
          <Text weight="600" size="sm">
            {order.customer_order?.order_code || ''}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <Text weight="600" size="sm">
            Site:{' '}
          </Text>
          <Text weight="600" size="sm">
            {order.customer_order?.organizationAddressByShippingAddressId
              ?.name ||
              order.customer_order?.name ||
              order.customer_order?.organization_user?.organization?.name ||
              'N/A'}
          </Text>
        </View>
      </View>

      <Divider height={6} />
      <View style={styles.flexRow}>
        <Text weight="600" size="sm">
          Status:{' '}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getOrderStateColor(order?.state || '')
                .backgroundColor,
              borderColor: getOrderStateColor(order?.state || '').borderColor,
            },
          ]}>
          <Text
            weight="600"
            size="xs"
            style={{color: getOrderStateColor(order?.state || '').textColor}}>
            {order?.state || 'ASSIGNED'}
          </Text>
        </View>
      </View>

      {/* Customer Name */}
      <Divider height={6} />
      <OrderDetail detail="Customer" value={getCustomerName()} />

      {/* Organization */}
      <Divider height={6} />
      <OrderDetail
        detail="Organization"
        value={
          order.customer_order?.organization_user?.organization?.name ||
          'Organization'
        }
      />

      {/* Quantity */}
      <Divider height={6} />
      <OrderDetail detail="Quantity" value={getQuantity()} emphasize />

      {/* Order Date */}
      <Divider height={6} />
      <OrderDetail detail="Order Date" value={getOrderDate()} />

      {/* Bottom Row: Delivery Badge and Cancel Button */}
      <View style={styles.bottomRow}>
        <View style={styles.deliveryBadge}>
          <Text size="xs" weight="600" style={{color: '#4b5563'}}>
            DELIVERY
          </Text>
        </View>

        {/* Cancel Button - only show for ASSIGNED state */}
        {order?.state === 'ASSIGNED' && (
          <Pressable
            style={[
              styles.cancelButton,
              isLoadingOrder && styles.disabledCancelButton
            ]}
            onPress={handleCancelOrder}
            disabled={isLoadingOrder}
            android_ripple={{color: '#fee2e2', borderless: false}}>
            <X size={12} color={isLoadingOrder ? "#9ca3af" : "#dc2626"} weight="bold" />
            <Text
              size="xs"
              weight="600"
              style={{
                color: isLoadingOrder ? "#9ca3af" : "#dc2626",
                marginLeft: 4
              }}>
              {isLoadingOrder ? 'Cancelling...' : 'Cancel'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* OTP if available */}
      {order.customer_order?.otp && (
        <Text
          size="sm"
          weight="600"
          color="redGradient"
          style={{paddingTop: 7, position: 'absolute', right: 10, bottom: 4}}>
          OTP: {order.customer_order.otp}
        </Text>
      )}
    </TouchableOpacity>
  );
};

interface OrderDetailProps {
  detail: string;
  value: string | number;
  emphasize?: boolean;
}

const OrderDetail: React.FC<OrderDetailProps> = memo(
  ({detail, value, emphasize = false}) => (
    <View style={styles.flexRow}>
      <Text weight="600" size="sm">
        {detail}:{' '}
      </Text>
      <Text
        weight={emphasize ? '600' : '400'}
        size="sm"
        lines={2}
        style={{flex: 1}}>
        {value}
      </Text>
    </View>
  ),
);

const styles = ScaledSheet.create({
  orderListCardContainer: {
    backgroundColor: 'white',
    padding: '10@s',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    marginBottom: '0@vs',
    marginHorizontal: '0@s',
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#E8F0FF',
    borderColor: '#1E40AF',
    borderWidth: 2,
  },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  firstRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBadge: {
    borderRadius: '6@s',
    borderWidth: 1,
    paddingHorizontal: '8@s',
    paddingVertical: '2@vs',
    marginLeft: '8@s',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8@vs',
  },
  deliveryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: '6@s',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: '6@s',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  disabledCancelButton: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    opacity: 0.6,
  },
});

export default NormalOrderCard;
