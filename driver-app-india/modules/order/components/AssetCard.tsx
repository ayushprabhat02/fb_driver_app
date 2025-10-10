import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  Alert,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {Text, QuantityBottomSheet} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';
import {orderStore} from '@/globalStore';
import orderService from '../services';
import {removeAssetWithUploadedVideo as removeAssetFromPersistentStorage} from '@/utils/streamStorage';
import {getCurrentLocation} from '@/utils/location';

interface AssetCardProps {
  assetName: string;
  assetCode: string;
  requestedQuantity: number;
  filledQuantity: number;
  unit?: string;
  onDispense: () => void;
  disabled?: boolean;
  // Additional props for tower driver functionality
  asset?: any; // The full asset object for tower driver features
  onStartDispense?: (asset: any) => void;
  // New prop to check if any other asset has fill remaining status
  hasOtherFillRemaining?: boolean;
}

const AssetCard: React.FC<AssetCardProps> = ({
  assetName,
  assetCode,
  requestedQuantity,
  filledQuantity,
  unit = 'Ltr',
  onDispense,
  disabled = false,
  asset,
  onStartDispense,
  hasOtherFillRemaining = false,
}) => {
  const navigation = useNavigation();
  const [showQuantityBottomSheet, setShowQuantityBottomSheet] = useState(false);

  // Get assets with uploaded videos
  const assetsWithUploadedVideos = orderStore.use.assetsWithUploadedVideos();
  const removeAssetWithUploadedVideo =
    orderStore.use.removeAssetWithUploadedVideo();
  // Get assets with interrupted recording
  const assetsWithInterruptedRecording =
    orderStore.use.assetsWithInterruptedRecording();
  const removeAssetWithInterruptedRecording =
    orderStore.use.removeAssetWithInterruptedRecording();

  // Get order completion status
  const fuelDispensedTillNow = orderStore.use.fuelDispensedTillNow();
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();
  const isOrderCompletelyDispensed =
    fuelDispensedTillNow >= quantityToBeDispensed && quantityToBeDispensed > 0;

  // Helper function to get asset ID
  const getAssetId = () => {
    return (
      asset?.customer_asset?.id || asset?.id || asset?.customer_asset_id || ''
    );
  };

  // Check if asset needs "Fill Remaining" (has video but no quantity)
  const isAssetPartiallyFilled = () => {
    const assetId = getAssetId();
    return assetsWithUploadedVideos.includes(assetId);
  };

  // Helper function to check if asset has interrupted recording
  const hasInterruptedRecording = () => {
    const assetId = getAssetId();
    return assetsWithInterruptedRecording.includes(assetId);
  };

  const handleStartDispense = () => {
    if (onStartDispense && asset) {
      // Set current asset for dispense in store
      orderStore.setState(state => ({
        ...state,
        currentAssetForDispense: asset,
      }));

      // Call the onStartDispense callback
      onStartDispense(asset);
    } else {
      // Fallback to regular dispense function
      onDispense();
    }
  };

  const handleQuantityUpdate = async (quantity: number) => {
    if (!asset) {
      Alert.alert('Error', 'Asset data is missing');
      return;
    }

    const selectedOrder = orderStore.getState().currentDriverOrder;
    if (!selectedOrder?.customer_order?.id) {
      Alert.alert('Error', 'Order data is missing');
      return;
    }

    const assetId =
      asset.customer_asset?.id || asset.id || asset.customer_asset_id;
    if (!assetId) {
      Alert.alert('Error', 'Asset ID is missing');
      return;
    }

    try {
      // Show loading toast (like Vue project)
      Toast.show({
        type: 'success',
        text1: 'Updating...',
        text2: 'Updating asset value, please wait a moment...',
      });

      // Determine if this is "Fill Remaining" scenario (first-time quantity entry after live streaming)
      // or "Edit Quantity" scenario (editing existing quantity)
      const isFillRemaining =
        filledQuantity === 0 && assetsWithUploadedVideos.includes(assetId);
      const isEditQuantity = filledQuantity > 0; // User is editing existing quantity

      console.log('📊 Quantity update scenario:', {
        assetId,
        isFillRemaining,
        isEditQuantity,
        filledQuantity,
        newQuantity: quantity,
        hasUploadedVideo: assetsWithUploadedVideos.includes(assetId),
        isBuddycanFlow: selectedOrder?.is_enable_buddycan_flow,
      });

      // SCENARIO 1: Fill Remaining - First time quantity entry after live streaming
      // Following Vue.js BuddyCanDelivered.vue logic (lines 166-178)
      if (isFillRemaining) {
        console.log(
          '🎯 Scenario 1: Fill Remaining - Calling TOTALIZER_AFTER_READING API',
        );

        // Get current location for task action
        const coordinates = await getCurrentLocation();

        // Call upsertStepTaskAction with TOTALIZER_AFTER_READING (same as LiveStreamScreen)
        const taskActionResponse = await orderService.upsertStepTaskAction({
          object: {
            key: 'TOTALIZER_AFTER_READING',
            url: '', // No image URL for livestream flow
            value: '0.0',
            quantity_dispensed: quantity,
            task_id: selectedOrder?.id,
            customer_asset_id: assetId,
            location: {
              type: 'Point',
              coordinates: [coordinates.longitude, coordinates.latitude],
            },
          },
        });

        // Check if taskAction was successful
        if (typeof taskActionResponse === 'string') {
          throw new Error(taskActionResponse);
        }

        // Update asset quantity - ONLY for Fill Remaining scenario
        await orderService.updateAssetQty({
          customerAssetId: assetId,
          customerOrderId: selectedOrder.customer_order.id,
          qty: quantity,
        });
      }
      // SCENARIO 2: Edit Quantity - Following Vue.js AssetCard.vue logic (lines 237-280)
      else if (isEditQuantity && selectedOrder?.is_enable_buddycan_flow) {
        console.log(
          '🎯 Scenario 2: Edit Quantity - Calling updateAssetQty and updating totalizer readings',
        );

        // First, update asset quantity
        await orderService.updateAssetQty({
          customerAssetId: assetId,
          customerOrderId: selectedOrder.customer_order.id,
          qty: quantity,
        });

        // Call TOTALIZER_AFTER_READING API when editing quantity
        console.log('📝 Calling TOTALIZER_AFTER_READING API for edit quantity...');
        const coordinates = await getCurrentLocation();
        await orderService.upsertStepTaskAction({
          object: {
            key: 'TOTALIZER_AFTER_READING',
            url: '', // No image URL needed
            value: '0.0',
            quantity_dispensed: quantity,
            task_id: selectedOrder?.id,
            customer_asset_id: assetId,
            location: {
              type: 'Point',
              coordinates: [coordinates.longitude, coordinates.latitude],
            },
          },
        });
        console.log('✅ TOTALIZER_AFTER_READING API called successfully for edit quantity');

        try {
          // Fetch task values to get current totalizer readings
          const task = await orderService.checkPartiallyFilledAssets(
            selectedOrder.id,
          );

          if (task?.task_value) {
            // Find current asset index in task values
            const currentAssetIndex = task.task_value.findIndex(
              (t: any) => t.customer_asset_id === assetId,
            );

            console.log('📋 Task value details:', {
              totalTaskValues: task.task_value.length,
              currentAssetIndex,
              foundAsset: currentAssetIndex !== -1,
            });

            if (currentAssetIndex !== -1) {
              // Calculate updated totalizer reading
              let previousTotalizerAfterValue =
                task.task_value[currentAssetIndex].value;

              console.log('🔢 Starting totalizer calculation:', {
                initialValue: previousTotalizerAfterValue,
                currentAssetId: assetId,
                newQuantity: quantity,
              });

              // Loop through current and subsequent assets to update totalizer readings
              for (let i = currentAssetIndex; i < task.task_value.length; i++) {
                const taskAsset = task.task_value[i];

                if (taskAsset.key === 'TOTALIZER_AFTER_READING') {
                  const assetQuantity =
                    taskAsset.customer_asset_id === assetId
                      ? quantity
                      : taskAsset.quantity_dispensed || 0;

                  previousTotalizerAfterValue = (
                    parseFloat(previousTotalizerAfterValue) + assetQuantity
                  ).toString();

                  console.log(
                    `  Asset ${taskAsset.customer_asset_id}: +${assetQuantity} = ${previousTotalizerAfterValue}`,
                  );
                }
              }

              // Update vehicle totalizer reading (following Vue.js line 275-280)
              // Try to get vehicle ID from multiple sources
              const driverVehicleDetails =
                orderStore.getState().driverVehicleDetails;
              const currentOrder = orderStore.getState().currentDriverOrder;

              // Priority: 1) driverVehicleDetails.id, 2) currentOrder.driver_vehicle_id
              const vehicleId =
                driverVehicleDetails?.id || currentOrder?.driver_vehicle_id;

              console.log('🚗 Vehicle ID resolution:', {
                fromDriverVehicleDetails: driverVehicleDetails?.id,
                fromCurrentOrder: currentOrder?.driver_vehicle_id,
                selectedVehicleId: vehicleId,
                finalTotalizerValue: previousTotalizerAfterValue,
              });

              if (vehicleId) {
                await orderService.updateTotalizerReading({
                  totalizer_reading: parseFloat(previousTotalizerAfterValue),
                  vehicle_id: vehicleId,
                });
                console.log(
                  '✅ Vehicle totalizer reading updated successfully:',
                  {
                    vehicleId,
                    totalizerReading: previousTotalizerAfterValue,
                  },
                );
              } else {
                console.error(
                  '❌ No vehicle ID found! Cannot update totalizer reading.',
                  {
                    driverVehicleDetails,
                    currentOrder: {
                      id: currentOrder?.id,
                      driver_vehicle_id: currentOrder?.driver_vehicle_id,
                    },
                  },
                );
              }
            } else {
              console.warn(
                '⚠️ Current asset not found in task values, skipping totalizer update',
              );
            }
          } else {
            console.warn('⚠️ No task values found, skipping totalizer update');
          }
        } catch (totalizerError) {
          console.error(
            '⚠️ Failed to update totalizer readings:',
            totalizerError,
          );
          // Don't block the quantity update if totalizer update fails
        }
      }
      // SCENARIO 3: Regular quantity update (non-buddycan flow)
      else {
        console.log(
          '🎯 Scenario 3: Regular quantity update (non-buddycan flow)',
        );

        // Update asset quantity
        await orderService.updateAssetQty({
          customerAssetId: assetId,
          customerOrderId: selectedOrder.customer_order.id,
          qty: quantity,
        });

        // If this is an edit (not initial fill), call TOTALIZER_AFTER_READING API
        if (isEditQuantity) {
          console.log('📝 Calling TOTALIZER_AFTER_READING API for edit quantity (non-buddycan flow)...');
          const coordinates = await getCurrentLocation();
          await orderService.upsertStepTaskAction({
            object: {
              key: 'TOTALIZER_AFTER_READING',
              url: '', // No image URL needed
              value: '0.0',
              quantity_dispensed: quantity,
              task_id: selectedOrder?.id,
              customer_asset_id: assetId,
              location: {
                type: 'Point',
                coordinates: [coordinates.longitude, coordinates.latitude],
              },
            },
          });
          console.log('✅ TOTALIZER_AFTER_READING API called successfully for edit (non-buddycan)');
        }
      }

      // Update local store state to reflect the change immediately
      const currentState = orderStore.getState();
      console.log('🔍 Before quantity update:', {
        assetId,
        oldQuantity: filledQuantity,
        newQuantity: quantity,
        currentAssets: currentState.orderAssets?.map((a: any) => ({
          id: a.customer_asset?.id || a.id || a.customer_asset_id,
          quantity_dispensed: a.quantity_dispensed || 0,
        })),
        currentTotal: currentState.fuelDispensedTillNow,
      });

      const updatedAssets = currentState.orderAssets?.map((orderAsset: any) => {
        const orderAssetId =
          orderAsset.customer_asset?.id ||
          orderAsset.id ||
          orderAsset.customer_asset_id;
        if (orderAssetId === assetId) {
          return {
            ...orderAsset,
            quantity_dispensed: quantity,
          };
        }
        return orderAsset;
      });

      // Calculate new total fuel dispensed
      const newFuelDispensedTillNow =
        updatedAssets?.reduce((total: number, asset: any) => {
          return total + (asset.quantity_dispensed || 0);
        }, 0) || 0;

      console.log('🔍 After quantity update calculation:', {
        assetId,
        updatedAssets: updatedAssets?.map((a: any) => ({
          id: a.customer_asset?.id || a.id || a.customer_asset_id,
          quantity_dispensed: a.quantity_dispensed || 0,
        })),
        newTotal: newFuelDispensedTillNow,
      });

      // Update the store with the new asset data and total fuel dispensed
      orderStore.setState(state => ({
        ...state,
        orderAssets: updatedAssets,
        fuelDispensedTillNow: newFuelDispensedTillNow,
      }));

      // Remove from tracking arrays when quantity is entered
      removeAssetWithUploadedVideo(assetId);
      removeAssetWithInterruptedRecording(assetId);
      await removeAssetFromPersistentStorage(selectedOrder.id, assetId);

      // Mark order as dispensing when quantity is entered (first-time quantity entry)
      if (quantity > 0 && filledQuantity === 0) {
        try {
          await orderService.markOrderDispensing({id: selectedOrder.id});
          console.log('✅ Order marked as DISPENSING after quantity entry');
        } catch (orderStateError) {
          console.error(
            '❌ Failed to mark order as dispensing:',
            orderStateError,
          );
          // Don't block the quantity update if order state update fails
        }
      }

      setShowQuantityBottomSheet(false);

      // Success feedback (like Vue project)
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Asset quantity updated successfully',
      });
    } catch (error) {
      console.error('Error updating asset quantity:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update quantity. Please try again.',
      });
    }
  };

  const getButtonText = () => {
    const assetId = getAssetId();
    const hasUploadedVideo = assetsWithUploadedVideos.includes(assetId);
    const isInPartiallyFilled = false; // Simplified: no longer using partiallyFilledAssetsArray
    const hasInterruptedRecording =
      assetsWithInterruptedRecording.includes(assetId);

    // Priority 0: If order is completely dispensed, show Order Complete
    if (isOrderCompletelyDispensed) {
      return 'Order Complete';
    }

    // Priority 1: If has interrupted recording session, show Resume Recording
    if (hasInterruptedRecording) {
      return 'Resume Recording';
    }

    // Priority 2: If dispensing is complete (filled quantity >= requested quantity), show Complete
    if (filledQuantity >= requestedQuantity && filledQuantity > 0) {
      return 'Complete';
    }

    // Priority 3: If streaming done but no quantity OR partially filled with quantity, show Fill Remaining
    if (hasUploadedVideo || isInPartiallyFilled) {
      return 'Fill Remaining';
    }

    // Priority 4: If no streaming done and no quantity, show Start Dispense
    if (filledQuantity === 0 && !hasUploadedVideo) {
      return 'Start Dispense';
    }

    // Priority 5: If some quantity but no streaming recorded and not marked as partially filled, show Complete
    if (filledQuantity > 0 && !hasUploadedVideo && !isInPartiallyFilled) {
      return 'Complete';
    }

    // Default fallback
    return 'Start Dispense';
  };

  // Check if this asset should be disabled due to other asset having fill remaining
  const isDisabledDueToOtherFillRemaining = () => {
    const assetId = getAssetId();
    const hasUploadedVideo = assetsWithUploadedVideos.includes(assetId);
    const isInPartiallyFilled = false; // Simplified: no longer using partiallyFilledAssetsArray
    const currentAssetHasFillRemaining =
      hasUploadedVideo || isInPartiallyFilled;

    // If this asset has fill remaining, it should not be disabled
    if (currentAssetHasFillRemaining) {
      return false;
    }

    // If any other asset has fill remaining and this one doesn't, disable it
    return hasOtherFillRemaining;
  };

  const handleFilledQuantityPress = () => {
    // Don't allow editing if other assets have fill remaining
    if (isDisabledDueToOtherFillRemaining()) {
      return;
    }
    setShowQuantityBottomSheet(true);
  };

  return (
    <View style={styles.container as ViewStyle}>
      <View style={styles.assetInfo as ViewStyle}>
        <View style={styles.assetIcon as ViewStyle}>
          <Text size="lg" weight="600" color="white">
            ⛽
          </Text>
        </View>

        <View style={styles.assetDetails as ViewStyle}>
          <Text size="base" weight="600" color="neutral">
            {assetName}
          </Text>
          <Text
            size="sm"
            color="lightGray"
            style={styles.assetCode as TextStyle}>
            {assetCode}
          </Text>
        </View>
      </View>

      <View style={styles.quantityInfo as ViewStyle}>
        <View style={styles.quantityRow as ViewStyle}>
          <Text size="sm" color="lightGray">
            Filled Qty:{' '}
            <Text
              size="sm"
              weight="600"
              color={filledQuantity > 0 ? 'primary' : 'neutral'}>
              {filledQuantity} {unit}
            </Text>
          </Text>
          {/* Show edit hint only when editing is allowed */}
          {filledQuantity > 0 && !isDisabledDueToOtherFillRemaining() && (
            <TouchableOpacity
              onPress={handleFilledQuantityPress}
              style={styles.editButton as ViewStyle}>
              <Text
                size="xs"
                color="lightGray"
                style={styles.editHint as TextStyle}>
                (edit)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.dispenseButton as ViewStyle,
          getButtonText() === 'Fill Remaining' &&
            (styles.fillRemainingButton as ViewStyle),
          getButtonText() === 'Resume Recording' &&
            (styles.resumeRecordingButton as ViewStyle),
          (disabled ||
            getButtonText() === 'Complete' ||
            getButtonText() === 'Order Complete' ||
            isDisabledDueToOtherFillRemaining()) &&
            (styles.disabledButton as ViewStyle),
        ]}
        onPress={
          hasInterruptedRecording()
            ? handleStartDispense
            : isAssetPartiallyFilled()
            ? handleFilledQuantityPress
            : handleStartDispense
        }
        disabled={
          disabled ||
          getButtonText() === 'Complete' ||
          getButtonText() === 'Order Complete' ||
          isDisabledDueToOtherFillRemaining()
        }
        activeOpacity={0.7}>
        <Text
          size="sm"
          weight="600"
          color={
            disabled ||
            getButtonText() === 'Complete' ||
            getButtonText() === 'Order Complete' ||
            isDisabledDueToOtherFillRemaining()
              ? 'disabledInputText'
              : 'white'
          }>
          {isDisabledDueToOtherFillRemaining()
            ? 'Fill Other Asset First'
            : getButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Quantity Bottom Sheet */}
      <QuantityBottomSheet
        visible={showQuantityBottomSheet}
        onClose={() => setShowQuantityBottomSheet(false)}
        onProceed={handleQuantityUpdate}
        orderQuantity={requestedQuantity}
        existingQuantity={filledQuantity}
        isFillingRemaining={isAssetPartiallyFilled() && filledQuantity === 0}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: FBBackground.white,
    borderRadius: '8@s',
    padding: '12@s',
    marginBottom: '8@vs',
    borderWidth: 1,
    borderColor: FBBorders.primary,
    shadowColor: FBColors.lightGray,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  assetIcon: {
    width: '32@s',
    height: '32@s',
    borderRadius: '6@s',
    backgroundColor: FBColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '8@s',
  },
  assetDetails: {
    flex: 1,
  },
  assetCode: {
    marginTop: '2@vs',
  },
  quantityInfo: {
    marginBottom: '12@vs',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2@vs',
  },
  editButton: {
    paddingVertical: '2@vs',
    paddingHorizontal: '4@s',
  },
  dispenseButton: {
    backgroundColor: FBColors.primary,
    borderRadius: '6@s',
    paddingVertical: '8@vs',
    paddingHorizontal: '12@s',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FBColors.primary,
  },
  disabledButton: {
    backgroundColor: FBBackground.disabled,
    borderColor: FBBorders.disabledInputText,
  },
  fillRemainingButton: {
    backgroundColor: '#FF8C00', // Orange background for Fill Remaining
    borderColor: '#FF8C00',
  },
  resumeRecordingButton: {
    backgroundColor: '#2196F3', // Blue background for Resume Recording
    borderColor: '#2196F3',
  },
  editHint: {
    fontStyle: 'italic',
  },
  vehicleLogo: {
    width: '20@s',
    height: '20@s',
  },
});

export default AssetCard;

// import React, {useState, useMemo, useCallback} from 'react';
// import {
//   View,
//   TouchableOpacity,
//   ViewStyle,
//   TextStyle,
//   Alert,
// } from 'react-native';
// import {ScaledSheet} from 'react-native-size-matters';
// import {useNavigation} from '@react-navigation/native';
// import Toast from 'react-native-toast-message';

// // Components & Services
// import {Text, QuantityBottomSheet} from '@/components';
// import orderService from '../services';

// // Global Store & Utilities
// import {checkinStore, orderStore} from '@/globalStore';
// import {removeAssetWithUploadedVideo as removeAssetFromPersistentStorage} from '@/utils/streamStorage';
// import {getCurrentLocation} from '@/utils/location';

// // Styles
// import {FBColors, FBBackground, FBBorders} from '@/types/styles';

// // Prop Types
// interface AssetCardProps {
//   assetName: string;
//   assetCode: string;
//   requestedQuantity: number;
//   filledQuantity: number;
//   unit?: string;
//   onDispense: () => void;
//   disabled?: boolean;
//   asset?: any;
//   onStartDispense?: (asset: any) => void;
//   hasOtherFillRemaining?: boolean;
// }

// const AssetCard: React.FC<AssetCardProps> = ({
//   assetName,
//   assetCode,
//   requestedQuantity,
//   filledQuantity,
//   unit = 'Ltr',
//   onDispense,
//   disabled = false,
//   asset,
//   onStartDispense,
//   hasOtherFillRemaining = false,
// }) => {
//   const [showQuantityBottomSheet, setShowQuantityBottomSheet] = useState(false);

//   // --- Store State ---
//   const {
//     assetsWithUploadedVideos,
//     removeAssetWithUploadedVideo,
//     assetsWithInterruptedRecording,
//     removeAssetWithInterruptedRecording,
//     fuelDispensedTillNow,
//     quantityToBeDispensed,
//     currentDriverOrder,
//     driverVehicleDetails,
//     orderAssets,
//   } = orderStore();

//   // --- Memoized Derived State ---
//   // These values are recalculated only when their dependencies change.

//   const assetId = useMemo(
//     () =>
//       asset?.customer_asset?.id || asset?.id || asset?.customer_asset_id || '',
//     [asset],
//   );

//   const hasUploadedVideo = useMemo(
//     () => assetsWithUploadedVideos.includes(assetId),
//     [assetsWithUploadedVideos, assetId],
//   );

//   const hasInterrupted = useMemo(
//     () => assetsWithInterruptedRecording.includes(assetId),
//     [assetsWithInterruptedRecording, assetId],
//   );

//   const isPartiallyFilled = useMemo(
//     () => hasUploadedVideo && filledQuantity === 0,
//     [hasUploadedVideo, filledQuantity],
//   );

//   const isOrderComplete = useMemo(
//     () =>
//       fuelDispensedTillNow >= quantityToBeDispensed &&
//       quantityToBeDispensed > 0,
//     [fuelDispensedTillNow, quantityToBeDispensed],
//   );

//   const isAssetDispensingComplete = useMemo(
//     () => filledQuantity >= requestedQuantity && filledQuantity > 0,
//     [filledQuantity, requestedQuantity],
//   );

//   const isDisabledByOtherAsset = useMemo(
//     () => hasOtherFillRemaining && !hasUploadedVideo,
//     [hasOtherFillRemaining, hasUploadedVideo],
//   );

//   const canEditQuantity = useMemo(
//     () => filledQuantity > 0 && !isDisabledByOtherAsset,
//     [filledQuantity, isDisabledByOtherAsset],
//   );

//   // --- Event Handlers ---

//   const handleStartDispense = useCallback(() => {
//     if (onStartDispense && asset) {
//       orderStore.setState({currentAssetForDispense: asset});
//       onStartDispense(asset);
//     } else {
//       onDispense();
//     }
//   }, [onStartDispense, asset, onDispense]);

//   const handleFilledQuantityPress = useCallback(() => {
//     if (canEditQuantity) {
//       setShowQuantityBottomSheet(true);
//     }
//   }, [canEditQuantity]);

//   // --- Main Action Button Logic ---
//   // Encapsulates all button states (text, style, action, disabled status) in one place.
//   const buttonState = useMemo(() => {
//     const baseStyle = styles.dispenseButton;
//     const disabledStyle = styles.disabledButton;

//     if (isDisabledByOtherAsset) {
//       return {
//         text: 'Fill Other Asset First',
//         style: disabledStyle,
//         onPress: () => {},
//         disabled: true,
//       };
//     }
//     if (isOrderComplete) {
//       return {
//         text: 'Order Complete',
//         style: disabledStyle,
//         onPress: () => {},
//         disabled: true,
//       };
//     }
//     if (hasInterrupted) {
//       return {
//         text: 'Resume Recording',
//         style: styles.resumeRecordingButton,
//         onPress: handleStartDispense,
//         disabled: false,
//       };
//     }
//     if (isAssetDispensingComplete) {
//       return {
//         text: 'Complete',
//         style: disabledStyle,
//         onPress: () => {},
//         disabled: true,
//       };
//     }
//     if (hasUploadedVideo) {
//       return {
//         text: 'Fill Remaining',
//         style: styles.fillRemainingButton,
//         onPress: () => setShowQuantityBottomSheet(true),
//         disabled: false,
//       };
//     }

//     // Default case
//     return {
//       text: 'Start Dispense',
//       style: baseStyle,
//       onPress: handleStartDispense,
//       disabled: disabled || false,
//     };
//   }, [
//     isOrderComplete,
//     hasInterrupted,
//     isAssetDispensingComplete,
//     hasUploadedVideo,
//     isDisabledByOtherAsset,
//     handleStartDispense,
//     disabled,
//   ]);

//   // --- Data Update Logic (Refactored from original handleQuantityUpdate) ---

//   /** Helper to update totalizer readings for subsequent assets after an edit. */
//   const updateTotalizerForEdit = async (newQuantity: number, task: any) => {
//     if (!task?.task_value) {
//       console.warn('⚠️ No task values found, skipping totalizer update');
//       return;
//     }

//     const assetIndex = task.task_value.findIndex(
//       (t: any) => t.customer_asset_id === assetId,
//     );
//     if (assetIndex === -1) {
//       console.warn(
//         '⚠️ Current asset not found in task values, skipping totalizer update',
//       );
//       return;
//     }

//     let totalizerAfterValue = parseFloat(task.task_value[assetIndex].value);

//     // Recalculate totalizer values from the edited asset onwards
//     for (let i = assetIndex; i < task.task_value.length; i++) {
//       const taskAsset = task.task_value[i];
//       if (taskAsset.key === 'TOTALIZER_AFTER_READING') {
//         const qty =
//           taskAsset.customer_asset_id === assetId
//             ? newQuantity
//             : taskAsset.quantity_dispensed || 0;
//         totalizerAfterValue += qty;
//       }
//     }

//     const vehicleId = checkinStore.getState().driverVehicleDetails?.id;
//     if (vehicleId) {
//       await orderService.updateTotalizerReading({
//         totalizer_reading: totalizerAfterValue,
//         vehicle_id: vehicleId,
//       });
//       console.log('✅ Vehicle totalizer reading updated successfully.');
//     } else {
//       console.error('❌ No vehicle ID found! Cannot update totalizer reading.');
//     }
//   };

//   /** Helper to update the local Zustand store after a successful API call. */
//   const updateLocalOrderState = (updatedQuantity: number) => {
//     const updatedAssets = orderAssets?.map((orderAsset: any) => {
//       const orderAssetId =
//         orderAsset.customer_asset?.id ||
//         orderAsset.id ||
//         orderAsset.customer_asset_id;
//       return orderAssetId === assetId
//         ? {...orderAsset, quantity_dispensed: updatedQuantity}
//         : orderAsset;
//     });

//     const newTotalDispensed =
//       updatedAssets?.reduce(
//         (total: number, asset: any) => total + (asset.quantity_dispensed || 0),
//         0,
//       ) || 0;

//     orderStore.setState({
//       orderAssets: updatedAssets,
//       fuelDispensedTillNow: newTotalDispensed,
//     });
//   };

//   const handleQuantityUpdate = useCallback(
//     async (quantity: number) => {
//       if (!asset || !assetId || !currentDriverOrder?.customer_order?.id) {
//         return Alert.alert('Error', 'Required asset or order data is missing.');
//       }

//       Toast.show({type: 'info', text1: 'Updating...'});

//       try {
//         const isFillRemaining = filledQuantity === 0 && hasUploadedVideo;
//         const isEditQuantity = filledQuantity > 0;

//         // SCENARIO 1: Fill Remaining (First time quantity after streaming)
//         if (isFillRemaining) {
//           const coords = await getCurrentLocation();
//           await orderService.upsertStepTaskAction({
//             object: {
//               key: 'TOTALIZER_AFTER_READING',
//               url: '',
//               value: '0.0',
//               quantity_dispensed: quantity,
//               task_id: currentDriverOrder.id,
//               customer_asset_id: assetId,
//               location: {
//                 type: 'Point',
//                 coordinates: [coords.longitude, coords.latitude],
//               },
//             },
//           });
//         }

//         // ALWAYS update asset quantity, except for the complex edit case handled below.
//         if (!isEditQuantity || !currentDriverOrder?.is_enable_buddycan_flow) {
//           await orderService.updateAssetQty({
//             customerAssetId: assetId,
//             customerOrderId: currentDriverOrder.customer_order.id,
//             qty: quantity,
//           });
//         }

//         // SCENARIO 2: Edit Quantity in Buddycan Flow (Complex totalizer logic)
//         if (isEditQuantity && currentDriverOrder?.is_enable_buddycan_flow) {
//           await orderService.updateAssetQty({
//             customerAssetId: assetId,
//             customerOrderId: currentDriverOrder.customer_order.id,
//             qty: quantity,
//           });
//           try {
//             // Call TOTALIZER_AFTER_READING when editing quantity
//             const coords = await getCurrentLocation();
//             await orderService.upsertStepTaskAction({
//               object: {
//                 key: 'TOTALIZER_AFTER_READING',
//                 url: '',
//                 value: '0.0',
//                 quantity_dispensed: quantity,
//                 task_id: currentDriverOrder.id,
//                 customer_asset_id: assetId,
//                 location: {
//                   type: 'Point',
//                   coordinates: [coords.longitude, coords.latitude],
//                 },
//               },
//             });

//             const task = await orderService.checkPartiallyFilledAssets(
//               currentDriverOrder.id,
//             );
//             await updateTotalizerForEdit(quantity, task);
//           } catch (totalizerError) {
//             console.error(
//               '⚠️ Failed to update totalizer readings:',
//               totalizerError,
//             );
//           }
//         }

//         // --- Post-update local state changes ---
//         updateLocalOrderState(quantity);

//         removeAssetWithUploadedVideo(assetId);
//         removeAssetWithInterruptedRecording(assetId);
//         await removeAssetFromPersistentStorage(currentDriverOrder.id, assetId);

//         if (quantity > 0 && filledQuantity === 0) {
//           await orderService.markOrderDispensing({id: currentDriverOrder.id});
//         }

//         setShowQuantityBottomSheet(false);
//         Toast.show({
//           type: 'success',
//           text1: 'Success',
//           text2: 'Asset quantity updated.',
//         });
//       } catch (error) {
//         console.error('Error updating asset quantity:', error);
//         Toast.show({
//           type: 'error',
//           text1: 'Update Failed',
//           text2: 'Please try again.',
//         });
//       }
//     },
//     [
//       asset,
//       assetId,
//       currentDriverOrder,
//       filledQuantity,
//       hasUploadedVideo,
//       removeAssetWithUploadedVideo,
//       removeAssetWithInterruptedRecording,
//     ],
//   );

//   // --- Render ---
//   return (
//     <View style={styles.container as ViewStyle}>
//       <View style={styles.assetInfo as ViewStyle}>
//         <View style={styles.assetIcon as ViewStyle}>
//           <Text size="lg" weight="600" color="white">
//             ⛽
//           </Text>
//         </View>
//         <View style={styles.assetDetails as ViewStyle}>
//           <Text size="base" weight="600" color="neutral">
//             {assetName}
//           </Text>
//           <Text
//             size="sm"
//             color="lightGray"
//             style={styles.assetCode as TextStyle}>
//             {assetCode}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.quantityInfo as ViewStyle}>
//         <Text size="sm" color="lightGray">
//           Filled Qty:{' '}
//           <Text
//             size="sm"
//             weight="600"
//             color={filledQuantity > 0 ? 'primary' : 'neutral'}>
//             {filledQuantity} {unit}
//           </Text>
//         </Text>
//         {canEditQuantity && (
//           <TouchableOpacity
//             onPress={handleFilledQuantityPress}
//             style={styles.editButton as ViewStyle}>
//             <Text
//               size="xs"
//               color="lightGray"
//               style={styles.editHint as TextStyle}>
//               (edit)
//             </Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <TouchableOpacity
//         style={[styles.dispenseButton as ViewStyle, buttonState.style]}
//         onPress={buttonState.onPress}
//         disabled={buttonState.disabled}
//         activeOpacity={0.7}>
//         <Text
//           size="sm"
//           weight="600"
//           color={buttonState.disabled ? 'disabledInputText' : 'white'}>
//           {buttonState.text}
//         </Text>
//       </TouchableOpacity>

//       <QuantityBottomSheet
//         visible={showQuantityBottomSheet}
//         onClose={() => setShowQuantityBottomSheet(false)}
//         onProceed={handleQuantityUpdate}
//         orderQuantity={requestedQuantity}
//         existingQuantity={filledQuantity}
//         isFillingRemaining={isPartiallyFilled}
//       />
//     </View>
//   );
// };

// // Styles remain the same
// const styles = ScaledSheet.create({
//   container: {
//     backgroundColor: FBBackground.white,
//     borderRadius: '8@s',
//     padding: '12@s',
//     marginBottom: '8@vs',
//     borderWidth: 1,
//     borderColor: FBBorders.primary,
//     shadowColor: FBColors.lightGray,
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   assetInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: '8@vs',
//   },
//   assetIcon: {
//     width: '32@s',
//     height: '32@s',
//     borderRadius: '6@s',
//     backgroundColor: FBColors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: '8@s',
//   },
//   assetDetails: {flex: 1},
//   assetCode: {marginTop: '2@vs'},
//   quantityInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: '12@vs',
//   },
//   editButton: {
//     paddingVertical: '2@vs',
//     paddingHorizontal: '4@s',
//   },
//   dispenseButton: {
//     backgroundColor: FBColors.primary,
//     borderRadius: '6@s',
//     paddingVertical: '8@vs',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: FBColors.primary,
//   },
//   disabledButton: {
//     backgroundColor: FBBackground.disabled,
//     borderColor: FBBorders.disabledInputText,
//   },
//   fillRemainingButton: {
//     backgroundColor: '#FF8C00', // Orange
//     borderColor: '#FF8C00',
//   },
//   resumeRecordingButton: {
//     backgroundColor: '#2196F3', // Blue
//     borderColor: '#2196F3',
//   },
//   editHint: {fontStyle: 'italic'},
// });

// export default AssetCard;
