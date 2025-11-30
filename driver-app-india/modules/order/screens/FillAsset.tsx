import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';

// components
import {
  FocusAwareStatusBar,
  HeaderAvoidingContainer,
  Text,
  Divider,
  Button,
} from '@/components';
import {VehicleInfoCard, FillupOrderCancellationModal} from '../components';

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
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Refs to prevent race conditions during completion
  const isCompletingOrderRef = React.useRef(false);
  const isNavigatingRef = React.useRef(false);

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
  const setCancellationModalOpenStore =
    orderStore.use.setCancellationModalOpen();

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
          // Only show error if we're not completing AND not navigating
          if (!isCompletingOrderRef.current && !isNavigatingRef.current) {
            console.log(
              '❌ No order assigned in FillAsset, redirecting to home',
            );
            // Alert.alert('Error', 'No order assigned 3');
            // @ts-ignore
            navigation.replace('home');
          }
          return;
        }

        // Fetch completely filled asset (following Vue.js pattern)
        if (currentFillupOrder.fillup_requests?.[0]) {
          const vehicleId =
            currentFillupOrder.fillup_requests[0]
              ?.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle
              ?.id || driverVehicleDetails?.id;

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
      capacity:
        fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type
          ?.vehicle?.fuel_tank_capacity,
      color: null,
      description:
        fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type
          ?.vehicle?.description,
      id: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type
        ?.vehicle?.id,
      name: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type
        ?.vehicle?.name,
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
        // Check if order is already in DISPENSING state - skip start totalizer and go to end totalizer
        if (currentFillupOrder.state === 'DISPENSING') {
          console.log(
            '⚡ Order already in DISPENSING state, skipping start totalizer and going to end totalizer',
          );

          // Fetch existing TOTALIZER_BEFORE_READING from task_value
          try {
            const task = await orderService.checkPartiallyFilledAssets(
              currentFillupOrder.id,
            );
            const beforeReadingTask = task?.task_value?.find(
              (t: any) =>
                t.key === 'TOTALIZER_BEFORE_READING' &&
                t.vehicle_id === currentAsset.id,
            );
            const totalizerBefore = beforeReadingTask
              ? parseFloat(beforeReadingTask.value || '0')
              : 0;

            console.log(
              '📊 Found existing TOTALIZER_BEFORE_READING:',
              totalizerBefore,
            );

            // Save to store for use in end totalizer page
            orderStore.setState(state => ({
              ...state,
              totalizerBeforeReading: totalizerBefore,
            }));
          } catch (error) {
            console.warn(
              '⚠️ Could not fetch TOTALIZER_BEFORE_READING, using 0:',
              error,
            );
            orderStore.setState(state => ({
              ...state,
              totalizerBeforeReading: 0,
            }));
          }

          // Navigate directly to end totalizer reading page
          // @ts-ignore
          navigation.navigate('order', {
            screen: 'totalizer-after-manual',
          });
        } else {
          // Normal flow - Navigate to upload image asset (totalizer before manual equivalent)
          console.log('📝 Normal flow - navigating to start totalizer reading');
          // @ts-ignore
          navigation.navigate('order', {
            screen: 'upload-image-asset',
          });
        }
      }
    } else {
      Alert.alert(
        'Error',
        'This order is for automation. Please raise cancel request',
      );
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
        },
      });

      // Add transaction logs (following Vue.js pattern)
      const filteredTankProductVarId = driverVehicleDetails?.vehicle_tank_types
        ?.filter((tank: any) => tank.tank_type.slug === 'browser-tank')
        ?.map(
          (tank: any) =>
            tank.vehicle_tank_type_product_variations[0]?.product_variation?.id,
        )?.[0];

      if (filteredTankProductVarId) {
        const quantity = assetFilled ? assetFilled.quantity_dispensed : 0;
        const fillupRequestId = currentFillupOrder?.fillup_requests[0]?.id;
        const vehicleId = driverVehicleDetails?.id;
        const requestVehicleId =
          currentFillupOrder?.fillup_requests[0]?.driver_vehicle?.vehicle?.id;

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
        if (
          currentFillupOrder?.driver_vehicle_id !==
          currentFillupOrder?.fillup_requests[0]?.driver_vehicle_id
        ) {
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

    // Set flags immediately to prevent error alerts during cleanup
    isCompletingOrderRef.current = true;
    isNavigatingRef.current = true;

    try {
      console.log('🚀 Starting fillup completion flow (from FillAsset)...');

      // Step 1: Create challan and transaction logs
      console.log('📝 Creating challan and transaction logs...');
      await createChallanAndTransactionLogs();

      // Step 2: Mark order completed
      console.log('✅ Marking order as completed...');
      await orderService.markOrderCompleted({id: currentFillupOrder?.id});

      // Step 3: Add stock entry to ERP (skip for ROTATIONAL_FLOW)
      if (
        currentFillupOrder?.fillup_requests[0]?.fuel_request_type !==
        'ROTATIONAL_FLOW'
      ) {
        console.log('📦 Adding stock entry to ERP...');
        await orderService.addStockEntryForFillupOnErp({
          state: 'DELIVERED',
          task_id: currentFillupOrder?.id,
        });
      } else {
        console.log('⏭️ Skipping stock entry for ROTATIONAL_FLOW');
      }

      // Step 4: Update fillup request state
      console.log('🔄 Updating fillup request state to COMPLETE...');
      await fillupService.updateFillupRequestState({
        id: currentFillupOrder?.fillup_requests[0]?.id,
        state: Fillup_Request_Status_Enum.Complete,
      });

      console.log('✨ All APIs completed successfully');

      // Clear ALL order states immediately before navigation (following Vue.js pattern)
      console.log('🧹 Clearing order store...');
      orderStore.setState(state => ({
        ...state,
        currentDriverOrder: null,
        currentFillupOrder: null,
        orderAssets: [],
        dispenseCompletedAssets: [],
        partiallyFilledAssetsArray: [],
        assetsWithUploadedVideos: [],
        challanImageData: null,
        technicianImageData: null,
        imapImageData: null,
        challanUploadedUrl: null,
        technicianUploadedUrl: null,
        imapUploadedUrl: null,
        totalizerImageData: null,
        quantityImageData: null,
        totalizerUploadedUrl: null,
        totalizerBeforeReading: 0,
        currentAssetForDispense: null,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Challan uploaded and fillup order completed',
      });

      // Reset navigation stack completely to prevent going back to fill asset page
      console.log('🏠 Resetting navigation to home...');
      navigation.reset({
        index: 0,
        routes: [{name: 'home' as never}],
      });
    } catch (error) {
      console.error('❌ Error completing fillup order:', error);
      // Reset flags on error so alerts can show
      isCompletingOrderRef.current = false;
      isNavigatingRef.current = false;
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
      await orderService.markOrderCancel({id: currentFillupOrder?.id});

      // Update order state locally
      orderStore.setState(state => ({
        ...state,
        currentFillupOrder: state.currentFillupOrder
          ? {...state.currentFillupOrder, state: 'CANCELLED' as any}
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
      case 'APPROVED':
        return {
          backgroundColor: '#dbeafe',
          textColor: '#1e40af',
          borderColor: '#bfdbfe',
        };
      case 'PENDING':
        return {
          backgroundColor: '#fef3c7',
          textColor: '#92400e',
          borderColor: '#fde68a',
        };
      case 'CONFIRMED':
        return {
          backgroundColor: '#dbeafe',
          textColor: '#1e40af',
          borderColor: '#bfdbfe',
        };
      case 'DELIVERED':
        return {
          backgroundColor: '#dcfce7',
          textColor: '#166534',
          borderColor: '#bbf7d0',
        };
      case 'CANCELLED':
        return {
          backgroundColor: '#fee2e2',
          textColor: '#991b1b',
          borderColor: '#fecaca',
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
        };
    }
  };

  const canCancelOrder = (state: string) => {
    return ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'ARRIVED'].includes(
      state?.toUpperCase(),
    );
  };

  // Get fillup request data
  const fillupRequest = currentFillupOrder?.fillup_requests?.[0];
  const vehicleName =
    fillupRequest?.vehicle_tank_type_product_variation?.vehicle_tank_type
      ?.vehicle?.name || 'Unknown Vehicle';
  const tankTypeName =
    fillupRequest?.vehicle_tank_type_product_variation?.vehicle_tank_type
      ?.tank_type?.name || 'Unknown Tank';
  const requestedQuantity = fillupRequest?.quantity || 0;

  const orderState = currentFillupOrder?.state || 'PENDING';
  const statusColor = getOrderStatusColor(orderState);
  const isCancellable = canCancelOrder(orderState);

  return (
    <HeaderAvoidingContainer>
      <FocusAwareStatusBar
        backgroundColor={FBBackground.white}
        barStyle="dark-content"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <Text size="xl" weight="700" style={styles.pageTitle}>
          Vehicle to be Filled
        </Text>

        <Divider height={16} />
        {/* Loading state */}
        {loadingAssets ? (
          <View style={styles.loadingContainer}>
            <Text size="base" color="secondary">
              Loading...
            </Text>
          </View>
        ) : !currentFillupOrder ? (
          <View style={styles.emptyState}>
            <Text size="lg" weight="600" color="secondary">
              No Fillup Order Found
            </Text>
          </View>
        ) : (
          <>
            {/* Vehicle Info Card */}
            <VehicleInfoCard
              vehicleName={vehicleName}
              tankTypeName={tankTypeName}
              requestedQuantity={requestedQuantity}
              orderState={orderState}
              statusColor={statusColor}
            />

            {assetFilled && (
              <>
                <Divider height={12} />
                <View style={styles.filledBanner}>
                  <Text size="sm" weight="600" color="success">
                    ✓ Asset Filled
                  </Text>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!loadingAssets && currentFillupOrder && (
        <View style={styles.actionContainer}>
          {!assetFilled ? (
            <>
              <Button
                variant="solid"
                onPress={startDispense}
                style={styles.primaryButton}>
                Start Dispense
              </Button>
              <Divider height={12} />
              <Button
                variant="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}>
                Cancel Request
              </Button>
            </>
          ) : (
            <Button
              variant="solid"
              onPress={startDispense}
              disabled={isButtonDisabled}
              loading={isButtonDisabled}
              style={styles.primaryButton}>
              Proceed
            </Button>
          )}
        </View>
      )}

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
    backgroundColor: FBBackground.white,
  },
  scrollContent: {
    paddingHorizontal: '20@s',
    // paddingTop: '20@vs',
    paddingBottom: '20@vs',
  },
  pageTitle: {
    color: FBColors.neutral,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '60@vs',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '60@vs',
  },
  filledBanner: {
    backgroundColor: '#E8F5E9',
    padding: '12@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  actionContainer: {
    padding: '20@s',
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

export default FillAsset;
