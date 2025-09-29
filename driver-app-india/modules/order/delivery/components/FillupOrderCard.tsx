import React, {useState} from 'react';
import {View, TouchableOpacity} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text, Divider} from '@/components';
import {FBColors} from '@/types/styles';
import {User, MapPin, Package, Check, Info, Clock} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {OrderStackParamList} from '@/navigator/containers/Order';
import orderStore from '../../store';

// Enhanced components
import FillupOrderDetailsModal from '../../components/FillupOrderDetailsModal';
import FillupOrderCancellationModal from '../../components/FillupOrderCancellationModal';

type NavigationProp = StackNavigationProp<OrderStackParamList>;

interface Props {
  order: any; // type from your driverOrders API
  onRefreshOrders?: () => Promise<void>; // callback to refresh orders
}

const FillupOrderCard: React.FC<Props> = ({order, onRefreshOrders}) => {
  const navigation = useNavigation<NavigationProp>();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const isSelected = currentFillupOrder?.id === order?.id;

  // Enhanced state management (Vue-inspired)
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isCancellationModalOpen, setCancellationModalOpen] = useState(false);
  const setCancellationModalOpenStore = orderStore.use.setCancellationModalOpen();
  const setOrderDetailsModalOpenStore = orderStore.use.setOrderDetailsModalOpen();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getOrderStatusColor = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'PENDING':
        return '#FFA500';
      case 'CONFIRMED':
        return '#2196F3';
      case 'IN_TRANSIT':
        return '#FF9800';
      case 'ARRIVED':
        return '#9C27B0';
      case 'DISPENSING':
        return '#FF5722';
      case 'DELIVERED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#6B7280';
    }
  };

  const canCancelOrder = (state: string) => {
    return ['PENDING', 'CONFIRMED'].includes(state?.toUpperCase());
  };

  const handleOrderSelect = () => {
    if (isSelected) {
      orderStore.setState(state => ({
        ...state,
        currentFillupOrder: null
      }));
    } else {
      orderStore.setState(state => ({
        ...state,
        currentFillupOrder: order
      }));
    }
  };

  // Vue-inspired enhanced actions
  const handleShowDetails = (e: any) => {
    e.stopPropagation();
    orderStore.setState(state => ({
      ...state,
      currentFillupOrder: order
    }));
    setDetailsModalOpen(true);
    setOrderDetailsModalOpenStore(true);
  };

  const handleNavigateToAssets = () => {
    setDetailsModalOpen(false);
    setOrderDetailsModalOpenStore(false);
    navigation.navigate('FillupWorkflow', {fillupId: order.id});
  };

  const handleCancelOrder = () => {
    setDetailsModalOpen(false);
    setCancellationModalOpen(true);
    setCancellationModalOpenStore(true);
  };

  const handleConfirmCancel = async (reasonId: string, comment: string) => {
    try {
      // Mock cancellation - in real implementation, call API
      console.log('Cancelling order with reason:', reasonId, 'comment:', comment);

      // Update order state locally
      orderStore.setState(state => ({
        ...state,
        currentFillupOrder: state.currentFillupOrder
          ? { ...state.currentFillupOrder, state: 'CANCELLED' }
          : null,
      }));

      setCancellationModalOpen(false);
      setCancellationModalOpenStore(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const orderState = order?.state || 'PENDING';
  const statusColor = getOrderStatusColor(orderState);
  const isCancellable = canCancelOrder(orderState);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={handleOrderSelect}
        activeOpacity={0.7}>
        {/* First Row: Order ID and Tank Type */}
        <View style={styles.firstRow}>
          <View style={styles.leftSection}>
            <Text weight="600" size="sm">
              Order ID:{' '}
            </Text>
            <Text weight="600" size="sm">
              #{order.id.substring(0, 8)}
            </Text>
          </View>
          <View style={styles.rightSection}>
            <Text weight="600" size="sm">
              Type: {order.fillup_requests[0]?.fuel_request_type || 'FUEL_TANK'}
            </Text>
          </View>
        </View>

        <Divider height={6} />

        {/* Status */}
        <View style={styles.flexRow}>
          <Text weight="600" size="sm">
            Status:{' '}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor, borderColor: statusColor }]}>
            <Text color="white" size="xs" weight="600">
              {orderState}
            </Text>
          </View>
        </View>

        <Divider height={6} />

        {/* Driver */}
        <View style={styles.flexRow}>
          <Text weight="600" size="sm">
            Driver:{' '}
          </Text>
          <Text weight="400" size="sm" style={{flex: 1}}>
            {order.fillup_requests[0]?.driver_vehicle?.user?.first_name || 'Driver'}
          </Text>
        </View>

        <Divider height={6} />

        {/* Quantity */}
        <View style={styles.flexRow}>
          <Text weight="600" size="sm">
            Quantity:{' '}
          </Text>
          <Text weight="600" size="sm" style={{flex: 1}}>
            {(order.fillup_requests[0]?.quantity_approved ||
              order.fillup_requests[0]?.quantity ||
              0) + 'L'}
          </Text>
        </View>

        <Divider height={6} />

        {/* Product Type */}
        <View style={styles.flexRow}>
          <Text weight="600" size="sm">
            Fuel Type:{' '}
          </Text>
          <Text weight="400" size="sm" style={{flex: 1}}>
            {order.fillup_requests[0]?.vehicle_tank_type_product_variation
              ?.product_variation?.product?.name || 'Diesel'}
          </Text>
        </View>

        <Divider height={6} />

        {/* Vehicle Information */}
        <View style={styles.flexRow}>
          <Text weight="600" size="sm">
            Vehicle:{' '}
          </Text>
          <Text weight="400" size="sm" style={{flex: 1}}>
            {order.fillup_requests[0]?.driver_vehicle?.vehicle?.name || 'Vehicle'} - {order.fillup_requests[0]?.driver_vehicle?.vehicle?.registration_number || 'N/A'}
          </Text>
        </View>

        {/* Bottom Row: Delivery Badge and Actions */}
        <View style={styles.bottomRow}>
          <View style={styles.deliveryChip}>
            <Text size="xs" weight="600" style={{color: '#4b5563'}}>
              FILL_UP
            </Text>
          </View>

          {isCancellable && (
            <TouchableOpacity
              style={styles.cancelOrderButton}
              onPress={() => setCancellationModalOpen(true)}
              activeOpacity={0.7}>
              <Text size="xs" color="error" style={styles.buttonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
    </TouchableOpacity>

    {/* Enhanced Modals (Vue-inspired) */}
    <FillupOrderDetailsModal
      isVisible={isDetailsModalOpen}
      onClose={() => setDetailsModalOpen(false)}
      onNavigateToAssets={handleNavigateToAssets}
      onCancelOrder={handleCancelOrder}
    />

    <FillupOrderCancellationModal
      isVisible={isCancellationModalOpen}
      onClose={() => setCancellationModalOpen(false)}
      onConfirmCancel={handleConfirmCancel}
    />
  </>
  );
};

const styles = ScaledSheet.create({
  card: {
    backgroundColor: 'white',
    padding: '10@s',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: '#28A745',
    marginBottom: '0@vs',
    marginHorizontal: '0@s',
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#28A745',
    borderWidth: 2,
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
  deliveryChip: {
    backgroundColor: '#E8F5E8',
    borderRadius: '6@s',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '6@s',
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#1E40AF',
  },
  cancelOrderButton: {
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '6@s',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  buttonText: {
    marginLeft: '2@s',
  },
});

export default FillupOrderCard;
