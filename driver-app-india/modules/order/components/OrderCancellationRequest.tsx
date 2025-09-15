import React, {useState, useEffect, useCallback} from 'react';
import {
  Alert,
  View,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import {ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {X, CheckCircle} from 'phosphor-react-native';

// components
import {Button, Divider, FullScreenLoader, Text} from '@/components';
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';

// services
import orderService from '../services';
import {orderStore} from '@/globalStore';

interface OrderCancellationRequestProps {
  /** Whether to show the modal */
  isVisible: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback when cancellation is successful */
  onSuccess?: () => void;
}

/**
 * 🚫 ORDER CANCELLATION REQUEST COMPONENT
 *
 * A self-contained component that handles all cancellation functionality
 * specifically for the ChooseAsset page.
 */
const OrderCancellationRequest: React.FC<OrderCancellationRequestProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  // 🚫 CANCELLATION STATE MANAGEMENT
  const [cancellationComment, setCancellationComment] = useState('');
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [showCancelReasons, setShowCancelReasons] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Get data directly from the store
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const cancellationReason = orderStore.use.cancellationReason();
  const cancellationReasons = orderStore.use.cancellationReasonsByReasonType();

  // Get data from store for cancellation reason logic
  const orderAssets = orderStore.use.orderAssets();
  const partiallyFilledAssetsArray = orderStore.use.partiallyFilledAssetsArray();
  const assetsWithUploadedVideos = orderStore.use.assetsWithUploadedVideos();

  // Static cancellation reasons matching Vue.js implementation
  const getCancellationReasons = useCallback((): Array<{id: string; reason: string}> => {
    const baseCancelReasons = [
      {id: 'customer_facility', reason: 'Customer Facility related'},
      {id: 'customer_reschedule', reason: 'Customer requested to reschedule'},
      {id: 'no_customer_response', reason: 'No response from the Customer'},
      {id: 'wrong_location', reason: 'Order Placed at Wrong Location'},
      {
        id: 'customer_unavailable',
        reason: 'Customer/POC not available at the Site',
      },
      {id: 'cheque_not_ready', reason: 'Cheque Not Ready'},
      {id: 'vehicle_accident', reason: 'Vehicle Met with Accident'},
      {id: 'rto_officer', reason: 'RTO Officer held Vehicle'},
      {id: 'vehicle_breakdown', reason: 'Vehicle Breakdown'},
      {id: 'driver_unwell', reason: 'Driver/Operator Not feeling Well'},
      {id: 'quantity_discrepancy', reason: 'Discrepancy in Quantity'},
      {id: 'quantity_concerns', reason: 'Quantity Concerns'},
      {id: 'test_results', reason: 'Inaccurate Test Results'},
      {id: 'other_issues', reason: 'Other Issues'},
    ];

    // Add context-specific reasons based on Vue.js logic
    const contextReasons: Array<{id: string; reason: string}> = [];

    // Add "Dispenser not connected" if we're dealing with dispensing issues
    const hasDispenseStarted = orderAssets?.some(
      (asset: any) =>
        asset.quantity_dispensed > 0 ||
        partiallyFilledAssetsArray.includes(asset?.customer_asset?.id) ||
        assetsWithUploadedVideos.includes(asset?.customer_asset?.id),
    );

    if (hasDispenseStarted) {
      contextReasons.push({
        id: 'dispenser_not_connected',
        reason: 'Dispenser not connected',
      });
    }

    // Add "Issue with Asset Identification" if assets have RFID/tag_id
    const hasAssetWithRFID = orderAssets?.some(
      (asset: any) =>
        asset?.customer_asset?.tag_id ||
        asset?.customer_asset?.registration_number,
    );

    if (hasAssetWithRFID) {
      contextReasons.push({
        id: 'asset_identification_issue',
        reason: 'Issue with Asset Identification',
      });
    }

    return [...contextReasons, ...baseCancelReasons];
  }, [orderAssets, partiallyFilledAssetsArray, assetsWithUploadedVideos]);

  // Get context-aware button text
  const getButtonText = useCallback(() => {
    const hasDispenseStarted = orderAssets?.some(
      (asset: any) =>
        asset.quantity_dispensed > 0 ||
        partiallyFilledAssetsArray.includes(asset?.customer_asset?.id) ||
        assetsWithUploadedVideos.includes(asset?.customer_asset?.id),
    );

    return hasDispenseStarted ? 'Report Issue' : 'Cancel Request';
  }, [orderAssets, partiallyFilledAssetsArray, assetsWithUploadedVideos]);

  // Set up cancellation reasons in the store
  const setupCancellationReasons = useCallback(async () => {
    try {
      const reasons = getCancellationReasons();

      console.log(
        `🎯 Using ${reasons.length} static cancellation reasons (Vue.js approach)`,
      );

      // Store reasons in the store
      const formattedReasons = reasons.map(reason => ({
        __typename: 'reasons' as const,
        id: reason.id,
        rank_id: null,
        reason: reason.reason,
        is_active: true,
      }));

      orderStore.setState(state => ({
        ...state,
        cancellationReasonsByReasonType: formattedReasons,
      }));

      return true; // Success
    } catch (error) {
      console.error('Error setting up cancellation reasons:', error);
      Alert.alert(
        'Error',
        'Failed to load cancellation reasons. Please try again.',
      );
      return false; // Failure
    }
  }, [getCancellationReasons]);

  // Set up cancellation reasons when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setupCancellationReasons();
    }
  }, [isVisible, setupCancellationReasons]);

  // Vue.js style validation matching CancelReason.vue
  const validateCancellationInput = (
    reason: any,
    comment: string,
  ): string | null => {
    if (!reason) {
      return 'Please select a cancellation reason';
    }

    // Check if this is "Other Issues" (matching Vue.js logic)
    if (reason.reason === 'Other Issues' || reason.id === 'other_issues') {
      if (!comment || comment.trim().length < 20) {
        return 'Please provide a detailed reason for cancellation (minimum 20 characters)';
      }
    }

    return null; // No validation errors
  };

  // Close cancellation modal
  const handleCancelModalClose = () => {
    setCancellationComment('');
    // Reset selected reason in store
    orderStore.setState(state => ({
      ...state,
      cancellationReason: undefined,
    }));

    // Notify parent component
    onClose();
  };

  const chooseReason = (
    item: any,
  ) => {
    orderStore.setState(state => ({
      ...state,
      cancellationReason: item,
    }));

    setTimeout(() => {
      setShowCancelReasons(false);
    }, 300);
  };

  // Vue.js inspired cancellation submission
  const handleCancelOrderSubmit = async () => {
    const selectedReason = cancellationReason;
    const selectedOrder = currentFillupOrder || currentDriverOrder;

    // Enhanced validation matching Vue.js
    const validationError = validateCancellationInput(
      selectedReason,
      cancellationComment,
    );
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    if (!selectedOrder?.id) {
      Alert.alert('Error', 'Order information is missing. Please try again.');
      return;
    }

    // Check if selectedReason is defined
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a cancellation reason.');
      return;
    }

    try {
      setCancellationLoading(true);

      console.log(`🚫 Cancelling order with reason: ${selectedReason?.reason}`);
      console.log(`📝 Additional comments: ${cancellationComment || 'None'}`);

      // Vue.js style two-step cancellation process
      // Step 1: Mark order for cancellation (matching Vue.js markOrderCancelRequest)
      const taskId = selectedOrder.id; // Use task ID for the cancellation
      await orderService.markOrderCancel({
        id: orderStore.getState().currentDriverOrder?.id,
      });

      // Step 2: Add cancellation reason (matching Vue.js addTaskCancelReason)
      const reasonText = cancellationComment.trim() || selectedReason.reason || '';
      await orderService.addTaskCancellationReason({
        id: orderStore.getState().currentDriverOrder?.id ,
        reason: reasonText,
      });

      console.log(`✅ Two-step cancellation completed for task: ${taskId}`);

      // Success message
      Alert.alert(
        '✅ Cancellation Successful',
        'Your order has been cancelled successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleCancelModalClose();
              // Notify parent component of successful cancellation
              onSuccess?.();
            },
          },
        ],
      );
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      Alert.alert('Cancellation Failed', 'Failed to cancel order. Please try again.');
    } finally {
      setCancellationLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellationReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    setLoadingCancel(true);
    try {
      await handleCancelOrderSubmit(); // Wait for the submission to complete
    } catch (error) {
      console.error('Cancellation error:', error);
    } finally {
      setLoadingCancel(false); // Hide loader once the operation is complete
    }
  };

  return (
    <>
      <Modal
        isVisible={isVisible}
        onBackdropPress={handleCancelModalClose}
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={1000}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{margin: 0, justifyContent: 'center', alignItems: 'center'}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.modalContent}>
              <Text weight="bold">Please select a reason</Text>
              <Divider height={10} />
              <Pressable
                disabled={showCancelReasons ? true : false}
                onPress={() => {
                  setShowCancelReasons(true);
                }}
                style={[
                  styles.textInput,
                  {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                ]}>
                <Text
                  style={{flex: 1}}
                  lines={1}
                  color={showCancelReasons ? 'disabledInputText' : 'neutral'}>
                  {cancellationReason?.reason}
                </Text>
                <Icon name="arrow-drop-down" size={24} color={FBColors.steelBlue} />
              </Pressable>

              <Divider height={10} />
              <Text weight="bold">Cancellation Comment</Text>
              <Divider height={10} />
              <TextInput
                style={[styles.textArea, {fontSize: 12}]}
                textAlignVertical="top"
                placeholderTextColor={FBColors.steelBlue}
                multiline
                numberOfLines={3}
                placeholder="Additional Comments for cancellation"
                value={cancellationComment}
                onChangeText={setCancellationComment}
              />
              <Divider height={20} />
              <View style={styles.buttonContainer}>
                <Button
                  variant="outlined"
                  onPress={handleCancelModalClose}
                  style={{width: '45%', borderColor: FBBorders.error, height: 40}}>
                  <Text color="error">Close</Text>
                </Button>
                <Button
                  variant="solid"
                  loading={cancellationLoading}
                  onPress={handleCancelOrder}
                  style={{
                    width: '45%',
                    backgroundColor: FBBorders.error,
                    height: 40,
                  }}>
                  Cancel Order
                </Button>
              </View>
            </View>
            <FullScreenLoader
              showLoader={loadingCancel}
              loaderText="Cancelling Order..."
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cancellation Reason List Modal */}
      <Modal
        onBackdropPress={() => {
          setShowCancelReasons(false);
        }}
        isVisible={showCancelReasons}
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={1000}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown">
        <View>
          <View
            style={{
              backgroundColor: 'white',
              paddingHorizontal: 12,
              paddingTop: 16,
              paddingBottom: 24,
              borderRadius: 8,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 10,
              }}>
              <Text color="slate" weight="600">
                Select Reason
              </Text>
              <Pressable onPress={() => setShowCancelReasons(false)}>
                <X size={24} color={FBColors.mediumGray} />
              </Pressable>
            </View>

            <ScrollView>
              {cancellationReasons.map((item: any) => {
                return (
                  <Pressable
                    onPress={() => chooseReason(item)}
                    key={item.id}
                    style={{
                      height: 50,
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottomColor: FBBorders.secondary,
                    }}>
                    <Text size="sm" color="steelBlue" weight="400">
                      {item.reason}
                    </Text>
                    {cancellationReason?.id === item.id && (
                      <CheckCircle size={24} color={FBColors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = ScaledSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: FBBackground.white,
    padding: '20@s',
    borderRadius: '10@s',
    alignSelf: 'center',
    shadowColor: FBColorPalette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  textArea: {
    borderColor: FBBorders.input,
    borderWidth: 1,
    padding: '10@s',
    borderRadius: '5@s',
    height: '60@s',
    color: FBColorPalette.black,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  textInput: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    height: 36,
    backgroundColor: FBBackground.input,
    borderRadius: 6,
    paddingVertical: 0,
    paddingLeft: 10,
    color: FBColors.steelBlue,
  },
});

export default OrderCancellationRequest;