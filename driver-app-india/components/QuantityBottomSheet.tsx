import React, {useEffect, useRef, useState} from 'react';
import {View, Alert} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Toast from 'react-native-toast-message';
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import {
  Input,
  Button,
  SimpleBottomSheet,
  Text,
  Divider,
  FullScreenLoader,
} from '@/components';
import {FBBackground, FBColors, FBBorders} from '@/types/styles';
import {orderStore} from '@/globalStore';

interface QuantityBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (quantity: number) => Promise<void> | void;
  orderQuantity?: number;
  existingQuantity?: number;
  isFillingRemaining?: boolean; // New prop to indicate if this is for filling remaining quantity
}

const QuantityBottomSheet: React.FC<QuantityBottomSheetProps> = ({
  visible,
  onClose,
  onProceed,
  orderQuantity = 0,
  existingQuantity = 0,
  isFillingRemaining = false,
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const pendingQuantity = orderStore.use.pendingQuantity();
  const fuelDispensedTillNow = orderStore.use.fuelDispensedTillNow();
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();
  const loaders = orderStore.use.loaders();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      setIsComplete(false);
      // For filling remaining, don't prefill with existing quantity to allow adding more
      setQuantity(
        isFillingRemaining
          ? ''
          : existingQuantity > 0
          ? existingQuantity.toString()
          : '',
      );
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, existingQuantity, isFillingRemaining]);

  const handleClose = () => {
    setQuantity('');
    setLoading(false);
    setIsComplete(false);
    onClose();
  };

  const proceedWithQuantity = async (quantityNum: number) => {
    try {
      startLoader('quantityBottomSheet');
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
    } finally {
      stopLoader('quantityBottomSheet');
    }
  };

  console.log('----quantityno----', parseFloat(quantity));
  console.log('-----pendingQuantity----', pendingQuantity);

  console.log('----isFillingRemaining----', isFillingRemaining);

  const handleProceed = async () => {
    let quantityNum = parseFloat(quantity);

    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Please enter a valid quantity greater than 0',
      });
      return;
    }

    // Validate quantity is in multiples of 20 (like Vue project)
    if (quantityNum % 20 !== 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Quantity must be in multiples of 20 liters',
      });
      return;
    }

    // Use quantityToBeDispensed as the primary validation source if available
    const totalOrderQuantity = quantityToBeDispensed > 0 ? quantityToBeDispensed : orderQuantity;
    
    // Calculate how much can still be dispensed (total order - already dispensed + current asset existing)
    const availableQuantity = totalOrderQuantity - fuelDispensedTillNow + existingQuantity;
    
    // If filling remaining, validate the additional quantity doesn't exceed available
    if (isFillingRemaining) {
      const maxAdditional = availableQuantity - existingQuantity;
      if (quantityNum > maxAdditional) {
        Toast.show({
          type: 'error',
          text1: 'Quantity Exceeds Available',
          text2: `The entered quantity exceeds the available quantity of ${maxAdditional}L`,
        });
        return;
      }
      // Add to existing quantity for final validation
      quantityNum = existingQuantity + quantityNum;
    } else {
      // For normal dispensing or editing, check against available quantity
      if (quantityNum > availableQuantity) {
        Toast.show({
          type: 'error',
          text1: 'Quantity Exceeds Available',
          text2: `The entered quantity exceeds the available quantity of ${availableQuantity}L`,
        });
        return;
      }
    }

    // Final validation: check if new total dispensed quantity exceeds the total order quantity
    // When editing, we need to subtract the existing quantity and add the new quantity
    const newTotalDispensed = fuelDispensedTillNow - existingQuantity + quantityNum;
    
    if (totalOrderQuantity > 0 && newTotalDispensed > totalOrderQuantity) {
      Toast.show({
        type: 'error',
        text1: 'Quantity Exceeds Total Order',
        text2: `Total dispensed quantity (${newTotalDispensed}L) cannot exceed the order quantity of ${totalOrderQuantity}L`,
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
            {isComplete
              ? 'Dispensing Complete'
              : isFillingRemaining &&
                // ? 'Enter Additional Quantity' :
                'Enter Quantity Dispensed'}
          </Text>

          <Divider height={16} />

          {!isComplete ? (
            <>
              {isFillingRemaining && orderQuantity > 0 ? (
                <>
                  <View style={styles.orderInfo}>
                    <Text size="sm" color="darkGray" weight="500">
                      Already Filled
                    </Text>
                    <Text size="base" color="primary" weight="700">
                      {existingQuantity}L
                    </Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text size="sm" color="darkGray" weight="500">
                      Remaining Quantity
                    </Text>
                    <Text size="base" color="error" weight="700">
                      {Math.max(0, orderQuantity - existingQuantity)}L
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {fuelDispensedTillNow > 0 && (
                    <View style={styles.orderInfo}>
                      <Text size="sm" color="darkGray" weight="500">
                        Fuel Dispensed Till Now
                      </Text>
                      <Text size="base" color="primary" weight="700">
                        {fuelDispensedTillNow}L
                      </Text>
                    </View>
                  )}
                  {quantityToBeDispensed > 0 && (
                    <View style={styles.orderInfo}>
                      <Text size="sm" color="darkGray" weight="500">
                        Quantity To Be Dispensed
                      </Text>
                      <Text size="base" color="secondary" weight="700">
                        {quantityToBeDispensed}L
                      </Text>
                    </View>
                  )}
                  {pendingQuantity > 0 && (
                    <View style={styles.orderInfo}>
                      <Text size="sm" color="darkGray" weight="500">
                        Pending Quantity
                      </Text>
                      <Text size="base" color="error" weight="700">
                        {pendingQuantity}L
                      </Text>
                    </View>
                  )}
                </>
              )}

              <View style={styles.inputContainer}>
                <Text size="sm" weight="500" color="neutral">
                  {isFillingRemaining
                    ? 'Additional Quantity (Liters)'
                    : 'Quantity Dispensed (Liters)'}
                </Text>
                <BottomSheetTextInput
                  style={styles.textInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter quantity in multiples of 20L"
                  keyboardType="numeric"
                />
                <Text
                  size="xs"
                  color="darkGray"
                  style={{marginTop: 4, fontStyle: 'italic'}}>
                  Note: Quantity must be in multiples of 20 liters
                </Text>
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

      {/* FullScreen Loader */}
      <FullScreenLoader
        showLoader={loaders.quantityBottomSheet}
        loaderText="Saving quantity..."
      />
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
    color: '#000',
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
