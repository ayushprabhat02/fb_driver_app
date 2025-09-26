import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
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
import Toast from 'react-native-toast-message';

// components
import {FocusAwareStatusBar, HeaderAvoidingContainer, Text, Divider} from '@/components';
import {AssetCard} from '../components';
import FillupOrderStateFlow from '../components/FillupOrderStateFlow';
import FillupOrderCancellationModal from '../components/FillupOrderCancellationModal';

// services
import orderService from '../services';
import fillupService from '../../fillupRequest/services';

// stores
import {orderStore} from '@/globalStore';

// styles
import {FBBackground, FBColors} from '@/types/styles';

// types
import {Fillup_Request_Status_Enum} from '@/generated/graphql';

// utils
import {getCurrentLocation} from '@/utils/location';

type RootStackParamList = {
  order: {
    screen: string;
  };
};

// Asset interface for component usage
interface FillupAsset {
  id: string;
  name: string;
  code: string;
  requestedQuantity: number;
  filledQuantity: number;
  unit: string;
  state: string;
  fuelRequestType: string;
  vehicleId: string;
  capacity: string;
  description: string;
}

// ... existing code ...

const FillAsset: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Store states
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const driverVehicleDetails = orderStore.use.driverVehicleDetails();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();
  
  // Local states (following Vue.js pattern)
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [assetFilled, setAssetFilled] = useState<any>(null);
  const [isCancellationModalOpen, setCancellationModalOpen] = useState(false);
  
  // Enhanced state management (Vue-inspired)
  const fillupOrderStateFlow = orderStore.use.fillupOrderStateFlow();
  const setCancellationModalOpenStore = orderStore.use.setCancellationModalOpen();

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Vehicle to be filled',
      headerShown: true,
    });
  }, [navigation]);



  // Initialize component (following Vue.js onMounted pattern)
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Reset start trip loading state
        stopLoader('start-trip' as any);
        
        // Check if order exists
        if (!currentFillupOrder) {
          Alert.alert('Error', 'No order assigned');
          // @ts-ignore
          navigation.replace('home');
          return;
        }

        // Fetch completely filled asset (following Vue.js pattern)
        if (currentFillupOrder.fillup_requests?.[0]) {
          const vehicleId = currentFillupOrder.fillup_requests[0]
            ?.vehicle_tank_type_product_variation?.vehicle_tank_type
            ?.vehicle?.id || driverVehicleDetails?.id;
            
          if (vehicleId) {
            // This would be implemented when the API is available
            // const filledAsset = await fetchCompletelyFilledAsset({
            //   task_id: currentFillupOrder.id,
            //   key: 'TOTALIZER_AFTER_READING',
            //   vehicle_id: vehicleId
            // });
            // setAssetFilled(filledAsset);
          }
        }
        
        setLoadingAssets(false);
      } catch (error) {
        console.error('Error initializing FillAsset:', error);
        setLoadingAssets(false);
      }
    };

    initializeComponent();
  }, [currentFillupOrder, driverVehicleDetails]);

  // Start dispense function (following Vue.js logic)
  const startDispense = async () => {
    if (!currentFillupOrder?.fillup_requests?.[0]) {
      Alert.alert('Error', 'No fillup request found');
      return;
    }

    const fillupRequest = currentFillupOrder.fillup_requests[0];
    
    // Create current asset object and save it in store (following Vue.js pattern)
    const currentAsset = {
      asset_type_id: null,
      capacity: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle?.fuel_tank_capacity,
      color: null,
      description: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle?.description,
      id: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle?.id,
      name: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle?.name,
      organization_user_id: null,
    };
    
    orderStore.setState(state => ({
      ...state,
      currentAssetForDispense: currentAsset,
    }));

    // Check if manual order (following Vue.js logic)
    if (currentFillupOrder.is_done_locally) {
      if (assetFilled) {
        // Asset already filled, complete the order
        await createChallanAndMarkFillupComplete();
      } else {
        // Navigate to upload image asset (totalizer before manual equivalent)
        // @ts-ignore
        navigation.navigate('order', {
          screen: 'upload-image-asset',
        });
      }
    } else {
      Alert.alert('Error', 'This order is for automation. Please raise cancel request');
    }
  };

  // Create challan and transaction logs (following Vue.js pattern)
  const createChallanAndTransactionLogs = async () => {
    try {
      const coordinates = await getCurrentLocation();
      
      // Create challan task (following Vue.js upsertStepTaskAction pattern)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'CHALLAN',
          url: '',
          value: '0.0',
          quantity_dispensed: assetFilled ? assetFilled.quantity_dispensed : 0,
          task_id: currentFillupOrder?.id,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        }
      });

      // Add transaction logs (following Vue.js pattern)
      const filteredTankProductVarId = driverVehicleDetails?.vehicle_tank_types
        ?.filter((tank: any) => tank.tank_type.slug === 'browser-tank')
        ?.map((tank: any) => tank.vehicle_tank_type_product_variations[0]?.product_variation?.id)?.[0];

      if (filteredTankProductVarId) {
        const quantity = assetFilled ? assetFilled.quantity_dispensed : 0;
        const fillupRequestId = currentFillupOrder?.fillup_requests[0]?.id;
        const vehicleId = driverVehicleDetails?.id;
        const requestVehicleId = currentFillupOrder?.fillup_requests[0]?.driver_vehicle?.vehicle?.id;

        // Add OUT transaction
        await orderService.addTransactionLogs({
          quantity,
          product_var_id: filteredTankProductVarId,
          fillup_request_id: fillupRequestId,
          customer_order_id: null,
          vehicle_id: vehicleId,
          transaction_type: 'OUT',
        });

        // Add IN transaction if different vehicles
        if (currentFillupOrder?.driver_vehicle_id !== currentFillupOrder?.fillup_requests[0]?.driver_vehicle_id) {
          await orderService.addTransactionLogs({
            quantity,
            product_var_id: filteredTankProductVarId,
            fillup_request_id: fillupRequestId,
            customer_order_id: null,
            vehicle_id: requestVehicleId,
            transaction_type: 'IN',
          });
        }
      }
    } catch (error) {
      console.error('Error creating challan and transaction logs:', error);
      throw error;
    }
  };

  // Create challan and mark fillup complete (following Vue.js pattern)
  const createChallanAndMarkFillupComplete = async () => {
    setIsButtonDisabled(true);
    startLoader('updateOrderState');
    
    try {
      // Create challan and transaction logs
      await createChallanAndTransactionLogs();
      
      // Mark order completed
      await orderService.markOrderCompleted({ id: currentFillupOrder?.id });
      
      // Add stock entry for fillup on ERP
      await orderService.addStockEntryForFillupOnErp({
        state: 'DELIVERED',
        task_id: currentFillupOrder?.id,
      });
      
      // Update fillup request state
      await fillupService.updateFillupRequestState({
        id: currentFillupOrder?.fillup_requests[0]?.id,
        state: Fillup_Request_Status_Enum.Complete,
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Challan uploaded and fillup order completed',
      });
      
      // @ts-ignore
      navigation.replace('home');
    } catch (error) {
      console.error('Error completing fillup order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error uploading challan and marking fillup order complete',
      });
    } finally {
      setIsButtonDisabled(false);
      stopLoader('updateOrderState');
    }
  };

  // Enhanced cancellation with Vue-inspired flow
  const handleCancel = () => {
    setCancellationModalOpen(true);
    setCancellationModalOpenStore(true);
  };

  const handleConfirmCancel = async (reasonId: string, comment: string) => {
    startLoader('cancelFillupOrder');
    try {
      // Add task cancellation reason
      await orderService.addTaskCancellationReason({
        id: currentFillupOrder?.id,
        reason: comment,
      });
      
      // Mark order as cancellation requested
      await orderService.markOrderCancel({ id: currentFillupOrder?.id });

      // Update order state locally
      orderStore.setState(state => ({
        ...state,
        currentFillupOrder: state.currentFillupOrder
          ? { ...state.currentFillupOrder, state: 'CANCELLED' as any }
          : null,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Cancellation request submitted',
      });

      setCancellationModalOpen(false);
      setCancellationModalOpenStore(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error cancelling order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel order. Please try again.',
      });
    } finally {
      stopLoader('cancelFillupOrder');
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

  // Get fillup request data
  const fillupRequest = currentFillupOrder?.fillup_requests?.[0];
  const vehicleName = fillupRequest?.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle?.name || 'Unknown Vehicle';
  const tankTypeName = fillupRequest?.vehicle_tank_type_product_variation?.vehicle_tank_type?.tank_type?.name || 'Unknown Tank';
  const requestedQuantity = fillupRequest?.quantity || 0;

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
                {requestedQuantity} L • Fillup Request
              </Text>
            </View>
          )}

          {/* Order State Flow */}
          {currentFillupOrder && fillupOrderStateFlow.length > 0 && (
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

          {/* Loading state */}
          {loadingAssets ? (
            <View style={styles.loadingContainer as ViewStyle}>
              <Text size="base" color="lightGray">
                Loading assets...
              </Text>
            </View>
          ) : (
            /* Vehicle Card (following Vue.js template structure) */
            <View style={styles.vehicleContainer as ViewStyle}>
              {!currentFillupOrder ? (
                <View style={styles.emptyState as ViewStyle}>
                  <Text size="lg" weight="600" color="neutral" style={styles.emptyStateTitle as TextStyle}>
                    No Asset Found
                  </Text>
                </View>
              ) : (
                <View style={[
                  styles.vehicleCard as ViewStyle,
                  assetFilled && styles.filledVehicleCard as ViewStyle
                ]}>
                  <View style={styles.vehicleInfo as ViewStyle}>
                    <View style={styles.vehicleIcon as ViewStyle}>
                      <Text size="lg" weight="600" color="white">
                        🚛
                      </Text>
                    </View>
                    
                    <View style={styles.vehicleDetails as ViewStyle}>
                      <Text size="base" weight="bold" color="neutral" numberOfLines={1}>
                        {vehicleName}
                      </Text>
                      <Text size="sm" weight="bold" color="lightGray" numberOfLines={1}>
                        {tankTypeName}
                      </Text>
                      <Text size="sm" color="lightGray">
                        Quantity: {requestedQuantity} L
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.vehicleAction as ViewStyle}>
                    {assetFilled ? (
                      <View style={styles.filledStatus as ViewStyle}>
                        <Text size="sm" color="primary">Asset Filled</Text>
                        <Text size="lg">✅</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.startDispenseButton as ViewStyle}
                        onPress={startDispense}
                        activeOpacity={0.7}>
                        <Text size="sm" weight="600" color="white">
                          Start Dispense
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Enhanced Action Buttons (following Vue.js bottom button pattern) */}
        {!loadingAssets && (
          <View style={styles.actionContainer as ViewStyle}>
            {!assetFilled ? (
              <TouchableOpacity
                style={styles.cancelButton as ViewStyle}
                onPress={handleCancel}
                activeOpacity={0.7}>
                <Text size="base" weight="600" color="white">
                  Cancel Request
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.proceedButton as ViewStyle, isButtonDisabled && styles.disabledButton as ViewStyle]}
                onPress={startDispense}
                disabled={isButtonDisabled}
                activeOpacity={0.7}>
                <Text size="base" weight="600" color="white">
                  Proceed
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '40@vs',
  },
  vehicleContainer: {
    paddingVertical: '16@vs',
  },
  vehicleCard: {
    backgroundColor: FBBackground.white,
    borderRadius: '8@s',
    padding: '16@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filledVehicleCard: {
    backgroundColor: '#F0F0F0',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    backgroundColor: FBColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleAction: {
    alignItems: 'center',
  },
  filledStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  startDispenseButton: {
    backgroundColor: FBColors.primary,
    paddingVertical: '8@vs',
    paddingHorizontal: '16@s',
    borderRadius: '6@s',
    minWidth: '100@s',
    alignItems: 'center',
  },
  actionContainer: {
    paddingHorizontal: '16@s',
    paddingBottom: '16@vs',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: '16@vs',
    paddingHorizontal: '24@s',
    borderRadius: '8@s',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
  },
  proceedButton: {
    backgroundColor: FBColors.primary,
    paddingVertical: '16@vs',
    paddingHorizontal: '24@s',
    borderRadius: '8@s',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
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
