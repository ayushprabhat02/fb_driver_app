import {OrderService} from '@/services';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {FocusAwareStatusBar, HeaderAvoidingContainer, Text, Divider} from '@/components';
import {AssetCard} from '../components';
import FillupOrderStateFlow from '../components/FillupOrderStateFlow';
import FillupOrderCancellationModal from '../components/FillupOrderCancellationModal';

// styles
import {orderStore} from '@/globalStore';
import {FBBackground, FBColors} from '@/types/styles';

type RootStackParamList = {
  order: {
    screen: string;
  };
};

// Helper function to get asset data from currentDriverOrder
const getAssetsFromOrder = (orderData: any): Asset[] => {
  if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
    return [];
  }

  const order = orderData[0];
  if (!order.fillup_requests || !Array.isArray(order.fillup_requests)) {
    return [];
  }

  return order.fillup_requests.map(
    (request: any): Asset => ({
      id: request.id,
      name:
        request.vehicle_tank_type_product_variation?.product_variation?.product
          ?.name || 'Unknown Product',
      code:
        request.vehicle_tank_type_product_variation?.vehicle_tank_type
          ?.tank_type?.name || 'Unknown Tank',
      requestedQuantity: request.quantity || 0,
      filledQuantity: 0, // This would come from actual fill data
      unit: request.unit || 'liter',
      state: request.state,
      fuelRequestType: request.fuel_request_type,
    }),
  );
};

// Asset interface for component usage
interface Asset {
  id: string;
  name: string;
  code: string;
  requestedQuantity: number;
  filledQuantity: number;
  unit: string;
  state: string;
  fuelRequestType: string;
}

const FillAsset: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const assets = getAssetsFromOrder(currentFillupOrder);

  // Enhanced state management (Vue-inspired)
  const [isCancellationModalOpen, setCancellationModalOpen] = useState(false);
  const fillupOrderStateFlow = orderStore.use.fillupOrderStateFlow();
  const setCancellationModalOpenStore = orderStore.use.setCancellationModalOpen();

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Fillup Assets',
      headerShown: true,
    });
  }, [navigation]);



  // Calculate totals
  const totalQuantity = assets.reduce(
    (sum: number, asset: Asset) => sum + asset.requestedQuantity,
    0,
  );
  const filledQuantity = assets.reduce(
    (sum: number, asset: Asset) => sum + asset.filledQuantity,
    0,
  );
  const pendingQuantity = totalQuantity - filledQuantity;

  const handleDispense = (assetId: string) => {
    // Store the selected asset for fillup
    const selectedAsset = assets.find(asset => asset.id === assetId);
    if (selectedAsset) {
      orderStore.setState(state => ({
        ...state,
        currentAssetForDispense: selectedAsset,
      }));
    }
    
    // Navigate to upload image asset page for fillup flow
    // @ts-ignore
    navigation.navigate('order', {
      screen: 'upload-image-asset',
    });
  };

  const handleProceed = () => {
    Alert.alert('Proceed', 'Proceeding with the order...');
  };

  // Enhanced cancellation with Vue-inspired flow
  const handleCancel = () => {
    setCancellationModalOpen(true);
    setCancellationModalOpenStore(true);
  };

  const handleConfirmCancel = async (reasonId: string, comment: string) => {
    try {
      // Mock cancellation - in real implementation, call API
      console.log('Cancelling fillup order with reason:', reasonId, 'comment:', comment);

      // Update order state locally
      orderStore.setState(state => ({
        ...state,
        currentFillupOrder: state.currentFillupOrder
          ? { ...state.currentFillupOrder, state: 'CANCELLED' }
          : null,
      }));

      setCancellationModalOpen(false);
      setCancellationModalOpenStore(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
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
    return ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'ARRIVED'].includes(state?.toUpperCase());
  };

  // const fetchOrderForDriverIncompleteCurrent = async () => {
  //   // Convert selected delivery date to start and end of day timestamps
  //   const year = selectedDate.getFullYear();
  //   const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  //   const day = String(selectedDate.getDate()).padStart(2, '0');
  //   const startDateString = `${year}-${month}-${day}T00:00:00`;
  //   const endDateString = `${year}-${month}-${day}T23:59:59`;
  //   await OrderService.fetchOrderForDriverIncomplete({
  //     limit: 1,
  //     offset: 0,
  //     state: [
  //       Task_State_Enum.Dispensing,
  //       Task_State_Enum.InTransit,
  //       Task_State_Enum.Arrived,
  //     ],
  //     driver_vehicle_id: driverVehicleId,
  //     start_date: startDateString,
  //     end_date: endDateString,
  //   });
  // };

  // useEffect(() => {
  //   fetchOrderForDriverIncompleteCurrent();
  // }, []);

  const orderState = currentFillupOrder?.state || 'PENDING';
  const statusColor = getOrderStatusColor(orderState);
  const isCancellable = canCancelOrder(orderState);

  return (
    <HeaderAvoidingContainer>
      <FocusAwareStatusBar
        backgroundColor={FBBackground.primary}
        barStyle="dark-content"
      />

      <View style={styles.container as ViewStyle}>
        <ScrollView
          style={styles.scrollView as ViewStyle}
          showsVerticalScrollIndicator={false}>

          {/* Enhanced Order Header */}
          {currentFillupOrder && (
            <View style={styles.orderHeader as ViewStyle}>
              <View style={styles.orderInfo as ViewStyle}>
                <Text size="lg" weight="bold" color="neutral">
                  Order #{currentFillupOrder.id?.substring(0, 8)}
                </Text>
                <View style={[styles.statusBadge as ViewStyle, { backgroundColor: statusColor }]}>
                  <Text size="sm" weight="bold" color="white">
                    {orderState}
                  </Text>
                </View>
              </View>

              <Text size="sm" color="steelBlue" style={styles.orderSubtitle as TextStyle}>
                {totalQuantity} L • {assets.length} Asset{assets.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Order State Flow */}
          {currentFillupOrder && (
            <FillupOrderStateFlow
              orderStateFlow={fillupOrderStateFlow}
              currentState={orderState}
            />
          )}

          <Divider height={10} />
          {/* <AssetSummaryCard
            orderId="650761"
            totalQuantity={totalQuantity}
            filledQuantity={filledQuantity}
            pendingQuantity={pendingQuantity}
          /> */}

          {/* <AssetSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          /> */}

          {assets.length === 0 ? (
            <View style={styles.emptyState as ViewStyle}>
              <Text
                size="lg"
                weight="600"
                color="neutral"
                style={styles.emptyStateTitle as TextStyle}>
                No Assets Found
              </Text>
              <Text
                size="base"
                color="lightGray"
                style={styles.emptyStateMessage as TextStyle}>
                {currentFillupOrder
                  ? 'No fillup requests available for this order.'
                  : 'Loading order data...'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton as ViewStyle}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}>
                <Text size="base" weight="600" color="white">
                  Go Back
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            assets.map((asset: Asset) => (
              <AssetCard
                key={asset.id}
                assetName={asset.name}
                assetCode={asset.code}
                requestedQuantity={asset.requestedQuantity}
                filledQuantity={asset.filledQuantity}
                unit={asset.unit}
                onDispense={() => handleDispense(asset.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Enhanced Action Buttons */}
        <View style={styles.actionContainer as ViewStyle}>
          {isCancellable && (
            <TouchableOpacity
              style={styles.cancelButton as ViewStyle}
              onPress={handleCancel}
              activeOpacity={0.7}>
              <Text size="base" weight="600" color="white">
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced Modals (Vue-inspired) */}
      <FillupOrderCancellationModal
        isVisible={isCancellationModalOpen}
        onClose={() => setCancellationModalOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: '16@s',
    paddingTop: '16@vs',
  },
  orderHeader: {
    backgroundColor: '#F8F9FA',
    padding: '16@s',
    borderRadius: '8@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  statusBadge: {
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '16@s',
  },
  orderSubtitle: {
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '40@vs',
    paddingHorizontal: '20@s',
  },
  emptyStateTitle: {
    marginBottom: '8@vs',
    textAlign: 'center',
  },
  emptyStateMessage: {
    marginBottom: '24@vs',
    textAlign: 'center',
    lineHeight: '20@vs',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: '12@vs',
    paddingHorizontal: '24@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
});

export default FillAsset;
