import React, {useRef} from 'react';
import {View, TouchableOpacity, TextInput, Alert} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';

// components
import {Button, Divider, FullScreenLoader, SimpleBottomSheet, Text} from '@/components';

// store
import orderStore from '../../store';

// types
import {FBColors, FBColorPalette} from '@/types/styles';

type CancellationReason = {
  id: string;
  reason: string;
  type: string;
};

type FillupOrderCancellationModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onConfirmCancel: (reasonId: string, comment: string) => Promise<void>;
};

const FillupOrderCancellationModal: React.FC<FillupOrderCancellationModalProps> = ({
  isVisible,
  onClose,
  onConfirmCancel,
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // store state
  const fillupCancellationReasons = orderStore.use.fillupCancellationReasons();
  const selectedCancellationReason = orderStore.use.selectedCancellationReason();
  const cancellationComment = orderStore.use.cancellationComment();
  const setSelectedCancellationReason = orderStore.use.setSelectedCancellationReason();
  const setCancellationComment = orderStore.use.setCancellationComment();
  const loaders = orderStore.use.loaders();
  const currentFillupOrder = orderStore.use.currentFillupOrder();

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleClose = () => {
    setSelectedCancellationReason('');
    setCancellationComment('');
    onClose();
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancellationReason) {
      Alert.alert('Error', 'Please select a reason for cancellation');
      return;
    }

    const selectedReason = fillupCancellationReasons.find(
      reason => reason.id === selectedCancellationReason
    );

    if (selectedReason?.reason.toLowerCase().includes('comment') && !cancellationComment.trim()) {
      Alert.alert('Error', 'Please provide a comment for cancellation');
      return;
    }

    try {
      await onConfirmCancel(selectedCancellationReason, cancellationComment.trim());
      handleClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  // Mock cancellation reasons if not loaded
  const cancellationReasons = fillupCancellationReasons.length > 0
    ? fillupCancellationReasons
    : [
        { id: '1', reason: 'Vehicle breakdown', type: 'technical' },
        { id: '2', reason: 'Emergency situation', type: 'emergency' },
        { id: '3', reason: 'Route change', type: 'operational' },
        { id: '4', reason: 'Other (please comment)', type: 'other' },
      ];

  return (
    <>
      <SimpleBottomSheet
        ref={bottomSheetRef}
        snapPoints={['70%']}
        closeSheet={handleClose}>
        <BottomSheetView style={styles.modalContent}>
          <View style={styles.header}>
            <Text size="lg" weight="bold" color="neutral">
              Cancel Fillup Order
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text size="lg" color="steelBlue">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Divider height={10} />

          <Text size="sm" color="steelBlue" style={styles.orderInfo}>
            Order ID: #{currentFillupOrder?.id?.substring(0, 8) || 'N/A'}
          </Text>

          <Divider height={20} />

          <Text size="base" weight="medium" color="neutral" style={styles.sectionTitle}>
            Please select reason for cancellation
          </Text>

          <Divider height={10} />

          <View style={styles.reasonSelector}>
            {cancellationReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedCancellationReason === reason.id && styles.selectedReasonOption,
                ]}
                onPress={() => setSelectedCancellationReason(reason.id)}>
                <View style={styles.radioButton}>
                  {selectedCancellationReason === reason.id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <Text
                  size="sm"
                  color={selectedCancellationReason === reason.id ? 'primary' : 'neutral'}
                  style={styles.reasonText}>
                  {reason.reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider height={15} />

          <View style={styles.commentSection}>
            <Text size="sm" weight="medium" color="steelBlue" style={styles.commentLabel}>
              Additional Comments (Optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              value={cancellationComment}
              onChangeText={setCancellationComment}
              placeholder="Please provide additional details..."
              placeholderTextColor={FBColorPalette.steelBlue}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Divider height={20} />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.keepOrderButton} onPress={handleClose}>
              <Text size="base" weight="bold" color="white">
                Keep Order
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cancelOrderButton,
                !selectedCancellationReason && styles.disabledButton,
              ]}
              onPress={handleConfirmCancel}
              disabled={!selectedCancellationReason || loaders.cancelFillupOrder}>
              <Text size="base" weight="bold" color="white">
                Cancel Order
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </SimpleBottomSheet>

      <FullScreenLoader
        showLoader={loaders.cancelFillupOrder}
        loaderText="Cancelling order..."
      />
    </>
  );
};

const styles = ScaledSheet.create({
  modalContent: {
    padding: '20@s',
    paddingBottom: '30@vs',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: '4@s',
  },
  orderInfo: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    marginBottom: '8@vs',
  },
  reasonSelector: {
    gap: '12@vs',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
    paddingHorizontal: '16@s',
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  selectedReasonOption: {
    borderColor: FBColors.primary,
    backgroundColor: '#F0F8FF',
  },
  radioButton: {
    width: '20@s',
    height: '20@s',
    borderRadius: '10@s',
    borderWidth: 2,
    borderColor: '#C0C0C0',
    marginRight: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: '10@s',
    height: '10@s',
    borderRadius: '5@s',
    backgroundColor: FBColors.primary,
  },
  reasonText: {
    flex: 1,
  },
  commentSection: {
    marginTop: '10@vs',
  },
  commentLabel: {
    marginBottom: '8@vs',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: '8@s',
    padding: '12@s',
    fontSize: '14@s',
    color: FBColorPalette.neutral,
    backgroundColor: '#FAFAFA',
    maxHeight: '80@vs',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: '12@s',
  },
  keepOrderButton: {
    flex: 1,
    backgroundColor: FBColors.steelBlue,
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  cancelOrderButton: {
    flex: 1,
    backgroundColor: FBColors.error,
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C0C0C0',
  },
});

export default FillupOrderCancellationModal;