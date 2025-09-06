import React, {useEffect, useRef, useState} from 'react';
import {View, Alert} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import {Input, Button, SimpleBottomSheet, Text, Divider} from '@/components';
import {FBBackground, FBColors, FBBorders} from '@/types/styles';
import { orderStore } from '@/globalStore';

interface QuantityBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (quantity: number) => Promise<void> | void;
  orderQuantity?: number;
  existingQuantity?: number;
}

const QuantityBottomSheet: React.FC<QuantityBottomSheetProps> = ({
  visible,
  onClose,
  onProceed,
  orderQuantity = 0,
  existingQuantity = 0,
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const pendingQuantity = orderStore.use.pendingQuantity();

  console.log("-------pendingQuantity-------",pendingQuantity)

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      setIsComplete(false);
      setQuantity(existingQuantity > 0 ? existingQuantity.toString() : '');
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, existingQuantity]);

  const handleClose = () => {
    setQuantity('');
    setLoading(false);
    setIsComplete(false);
    onClose();
  };

  const proceedWithQuantity = async (quantityNum: number) => {
    try {
      setLoading(true);
      await Promise.resolve(onProceed(quantityNum));
      setIsComplete(true);

      // Auto-close after showing completion for 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (e) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Failed to save quantity',
        text2: 'Please try again',
      });
    }
  };

  const handleProceed = async () => {
    const quantityNum = parseFloat(quantity);

    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Please enter a valid quantity greater than 0',
      });
      return;
    }

    // Check if entered quantity exceeds pending quantity
    if (quantityNum > pendingQuantity) {
      Toast.show({
        type: 'error',
        text1: 'Quantity Exceeds Pending',
        text2: `The entered quantity exceeds the pending quantity of ${pendingQuantity}L`,
      });
      return;
    }

    // Hard validation to prevent total dispensed quantity from exceeding order quantity
    if (orderQuantity > 0 && quantityNum > orderQuantity) {
      Toast.show({
        type: 'error',
        text1: 'Quantity Exceeds Order',
        text2: `You cannot dispense more than the order quantity of ${orderQuantity}L`,
      });
      return;
    }

    await proceedWithQuantity(quantityNum);
  };

  return (
    <SimpleBottomSheet
      ref={bottomSheetRef}
      // Use close() method instead of dismiss() for proper functionality
      closeSheet={() => bottomSheetRef.current?.close()}
      onDismiss={handleClose}
      snapPoints={['50%']}
      showCloseBtn>
      <BottomSheetView style={styles.bottomSheetView}>
        <View style={styles.container}>
          <Text size="lg" weight="700" color="secondary">
            {isComplete ? 'Dispensing Complete' : 'Enter Quantity Dispensed'}
          </Text>

          <Divider height={16} />

          {!isComplete ? (
            <>
              {orderQuantity > 0 ? (
                <View style={styles.orderInfo}>
                  <Text size="sm" color="darkGray" weight="500">
                    Order Quantity
                  </Text>
                  <Text size="base" color="primary" weight="700">
                    {orderQuantity}L
                  </Text>
                </View>
              ) : null}
              
              {pendingQuantity > 0 ? (
                <View style={styles.orderInfo}>
                  <Text size="sm" color="darkGray" weight="500">
                    Pending Quantity
                  </Text>
                  <Text size="base" color="primary" weight="700">
                    {pendingQuantity}L
                  </Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text size="sm" weight="500" color="neutral">
                  Quantity Dispensed (Liters)
                </Text>
                <BottomSheetTextInput
                  style={styles.textInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter quantity in liters"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.buttonRow}>
                <Button
                  onPress={handleClose}
                  variant="outlined"
                  style={styles.cancelButton}>
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  onPress={handleProceed}
                  loading={loading}
                  style={styles.proceedButton}>
                  Proceed
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.completeCard}>
                <Text size="lg" weight="700" color="primary">
                  Complete
                </Text>
                <Divider height={8} />
                <Text size="sm" color="secondary">
                  Quantity saved successfully.
                </Text>
              </View>
              <Divider height={12} />
              <Button variant="solid" onPress={handleClose} disabled={loading}>
                Done
              </Button>
            </>
          )}
        </View>
      </BottomSheetView>
    </SimpleBottomSheet>
  );
};

const styles = ScaledSheet.create({
  bottomSheetView: {
    flex: 1,
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    backgroundColor: FBBackground.white,
    overflow: 'hidden',
  },
  container: {
    padding: '20@s',
    backgroundColor: FBBackground.white,
    minHeight: '200@vs',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FBBackground.softBlue,
    padding: '12@s',
    borderRadius: '8@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: FBBorders.primary,
  },
  inputContainer: {
    marginBottom: '20@vs',
  },
  textInput: {
    marginTop: '8@vs',
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    borderRadius: '8@s',
    padding: '12@s',
    fontSize: '16@s',
    backgroundColor: FBBackground.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: '12@s',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: FBBorders.secondary,
  },

  proceedButton: {
    flex: 1,
  },
  completeCard: {
    padding: '16@s',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FBBackground.pastelGreen,
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: FBBorders.forestGreen,
  },
});

export default QuantityBottomSheet;
