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
}

const FillupOrderCard: React.FC<Props> = ({order}) => {
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
      // Navigate to fill-asset screen for fillup orders
      navigation.navigate('fill-asset');
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
    navigation.navigate('fill-asset');
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
        {/* Header */}
        <View style={styles.header}>
          <Text weight="700" size="lg" color="neutral">
            #{order.id.substring(0, 8)}
          </Text>
          <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
            <Text color="white" size="xs" weight="600">
              {orderState}
            </Text>
            <Clock size={12} color="white" style={{marginLeft: 4}} />
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

      {/* Enhanced Footer with Actions */}
      <View style={styles.footer}>
        <View style={styles.deliveryChip}>
          <Text color="lightGray" size="xs" weight="600">
            FILL_UP
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={handleShowDetails}
            activeOpacity={0.7}>
            <Info size={12} color="#1E40AF" />
            <Text size="xs" color="primary" style={styles.buttonText}>
              Details
            </Text>
          </TouchableOpacity>

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
