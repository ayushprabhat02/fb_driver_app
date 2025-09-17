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
import {Text, QuantityBottomSheet, Button} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum, FBColorPalette} from '@/types/styles';
import {orderStore, userStore} from '@/globalStore';
import orderService from '../services';

// Icons (you may need to replace these with actual icon components)
import PassIcon from '@/assets/common/check-circle.svg'; // Replace with actual pass icon
import EditIcon from '@/assets/common/edit.svg'; // Replace with actual edit icon
import SaveIcon from '@/assets/common/save.svg'; // Replace with actual save icon

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
  // Vue.js AssetCard matching props
  isEditable?: boolean;
  startEdit?: () => void;
  endEdit?: () => void;
  hideButton?: boolean;
  onAssetUpdated?: () => void;
  generateQRCode?: (assetId: string) => void;
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
  isEditable = false,
  startEdit,
  endEdit,
  hideButton = false,
  onAssetUpdated,
  generateQRCode,
}) => {
  const navigation = useNavigation();
  const [showQuantityBottomSheet, setShowQuantityBottomSheet] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(filledQuantity);
  const [isEditingLocal, setIsEditingLocal] = useState(false);

  // Store selectors
  const partiallyFilledAssetsArray = orderStore.use.partiallyFilledAssetsArray();
  const assetsWithUploadedVideos = orderStore.use.assetsWithUploadedVideos();
  const loggedInUser = userStore.use.loggedInUser();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  
  // Store methods
  const addPartiallyFilledAsset = orderStore.use.addPartiallyFilledAsset();
  const removePartiallyFilledAsset = orderStore.use.removePartiallyFilledAsset();
  const removeAssetWithUploadedVideo = orderStore.use.removeAssetWithUploadedVideo();
  const setCurrentAssetForDispense = orderStore.use.setCurrentAssetForDispense();

  // Tower Driver Detection (exclusive app - all users are tower drivers)
  const isTowerDriverUser = true;
  const isSpecificVehicle = true; // For QR code generation

  console.log('🗼 AssetCard - Tower Driver App - Asset:', assetName, 'State:', filledQuantity > 0 ? 'Filled' : 'Empty');

  // Helper function to get asset ID
  const getAssetId = () => {
    return (
      asset?.customer_asset?.id || asset?.id || asset?.customer_asset_id || ''
    );
  };

  // Helper function to check if asset is partially filled
  const isAssetPartiallyFilled = () => {
    const assetId = getAssetId();
    return (
      partiallyFilledAssetsArray.includes(assetId) ||
      assetsWithUploadedVideos.includes(assetId)
    );
  };

  /**
   * Start dispense function matching Vue.js AssetCard startDispense logic
   * Tower drivers always go to live-streaming for dispensing
   */
  const startDispense = async () => {
    try {
      console.log('🚀 Tower Driver starting dispense for asset:', assetName);
      
      // Set current asset to be dispensed
      if (asset) {
        setCurrentAssetForDispense({
          ...asset.customer_asset || asset,
        });
      }

      // Tower driver always goes to live-streaming (matching Vue.js logic)
      if (isTowerDriverUser) {
        console.log('🗼 Tower driver routing to live-streaming');
        // @ts-ignore - Navigation type issue, but this route exists
        navigation.navigate('live-stream');
      } else {
        // Fallback for regular drivers (should not happen in tower driver app)
        if (currentDriverOrder?.is_enable_buddycan_flow) {
          // @ts-ignore
          navigation.navigate('buddy-challan');
        } else {
          Alert.alert('Error', 'This order requires automation. Please raise cancel request.');
        }
      }
    } catch (error) {
      console.error('Error in startDispense:', error);
      Alert.alert('Error', 'Failed to start dispensing. Please try again.');
    }
  };

  /**
   * Fill partially filled asset (matching Vue.js fillPartiallyFilledAsset)
   */
  const fillPartiallyFilledAsset = () => {
    console.log('🔄 Filling partially filled asset:', assetName);
    
    if (asset) {
      setCurrentAssetForDispense({
        ...asset.customer_asset || asset,
      });
    }

    // Tower driver logic for partial filling
    if (currentDriverOrder?.customer_order?.is_otp_required && !orderStore.getState().isAuthorizedForDispense) {
      // Show OTP modal (implement as needed)
      Alert.alert('OTP Required', 'OTP verification required for this order.');
    } else {
      // @ts-ignore
      navigation.navigate('totalizer-after-partial');
    }
  };

  /**
   * Update asset quantity (matching Vue.js updateAsset logic with BuddyCan validation)
   */
  const updateAsset = async () => {
    if (endEdit) endEdit();
    setIsEditingLocal(false);

    if (tempQuantity === 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Please enter updated quantity more than 0',
      });
      return;
    }

    // BuddyCan flow validation (matching Vue.js logic)
    if (currentDriverOrder?.is_enable_buddycan_flow) {
      if (tempQuantity < 20 || tempQuantity % 20 !== 0) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Quantity',
          text2: 'The quantity must be a minimum of 20 and should be in increments of 20.',
        });
        return;
      }
    }

    try {
      Toast.show({
        type: 'success',
        text1: 'Updating...',
        text2: 'Updating asset value, please wait a moment...',
      });

      const assetId = getAssetId();
      if (!assetId || !currentDriverOrder?.customer_order?.id) {
        throw new Error('Missing asset or order data');
      }

      // Update asset quantity through API
      await orderService.updateAssetQty({
        customerAssetId: assetId,
        customerOrderId: currentDriverOrder.customer_order.id,
        qty: tempQuantity,
      });

      // Remove from uploaded videos array since quantity is now entered
      removeAssetWithUploadedVideo(assetId);

      // Update partially filled assets array
      if (tempQuantity > 0 && tempQuantity < requestedQuantity) {
        addPartiallyFilledAsset(assetId);
      } else if (tempQuantity >= requestedQuantity) {
        removePartiallyFilledAsset(assetId);
      }

      // Call onAssetUpdated callback if provided
      if (onAssetUpdated) {
        onAssetUpdated();
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Asset quantity updated successfully',
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update quantity. Please try again.',
      });
      setTempQuantity(filledQuantity); // Reset to original value
    }
  };

  /**
   * Generate QR Code for asset (matching Vue.js generateQRCode)
   */
  const handleGenerateQRCode = () => {
    const assetId = getAssetId();
    if (generateQRCode && assetId) {
      console.log('📱 Generating QR code for asset:', assetName);
      generateQRCode(assetId);
    }
  };

  /**
   * Start edit mode (matching Vue.js startEdit)
   */
  const handleStartEdit = () => {
    setIsEditingLocal(true);
    setTempQuantity(filledQuantity);
    if (startEdit) startEdit();
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

    const assetId = asset.customer_asset?.id || asset.id || asset.customer_asset_id;
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

      // Update asset quantity through API
      await orderService.updateAssetQty({
        customerAssetId: assetId,
        customerOrderId: selectedOrder.customer_order.id,
        qty: quantity,
      });

      // Remove from uploaded videos array since quantity is now entered
      removeAssetWithUploadedVideo(assetId);

      // Update partially filled assets array based on the new quantity
      if (quantity > 0 && quantity < requestedQuantity) {
        // Asset is now partially filled
        addPartiallyFilledAsset(assetId);
      } else if (quantity >= requestedQuantity) {
        // Asset is now complete, remove from partially filled array
        removePartiallyFilledAsset(assetId);
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

  console.log('---assetsWithUploadedVideos-----', assetsWithUploadedVideos);

  const getButtonText = () => {
    const assetId = getAssetId();
    const hasUploadedVideo = assetsWithUploadedVideos.includes(assetId);
    const isInPartiallyFilled = partiallyFilledAssetsArray.includes(assetId);

    // Priority 1: If streaming done but no quantity OR partially filled with quantity, show Fill Remaining
    if (hasUploadedVideo || isInPartiallyFilled) {
      return 'Fill Remaining';
    }

    // Priority 2: If dispensing is complete (filled quantity >= requested quantity), show Complete
    if (filledQuantity >= requestedQuantity && filledQuantity > 0) {
      return 'Complete';
    }

    // Priority 3: If no streaming done and no quantity, show Start Dispense
    if (filledQuantity === 0 && !hasUploadedVideo) {
      return 'Start Dispense';
    }

    // Priority 4: If some quantity but no streaming recorded and not marked as partially filled, show Complete
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
    const isInPartiallyFilled = partiallyFilledAssetsArray.includes(assetId);
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
    setShowQuantityBottomSheet(true);
  };

  return (
    <View style={[
      styles.container as ViewStyle,
      filledQuantity > 0 ? styles.filledContainer : styles.emptyContainer
    ]}>
      {/* Asset Information Section */}
      <View style={styles.assetInfo as ViewStyle}>
        <View style={styles.assetIcon as ViewStyle}>
          <Image
            source={require('@/assets/home/truck-fuelbuddy.png')}
            style={styles.vehicleLogo as ImageStyle}
            resizeMode="contain"
          />
        </View>

        <View style={styles.assetDetails as ViewStyle}>
          <Text size="base" weight="600" color="neutral" style={styles.assetName as TextStyle}>
            {assetName}
          </Text>
          <Text size="sm" color="lightGray" style={styles.assetCode as TextStyle}>
            {assetCode}
          </Text>
        </View>

        {/* Asset Filled Indicator (matching Vue.js) */}
        {filledQuantity > 0 && (
          <View style={styles.assetFilledIndicator as ViewStyle}>
            <Text size="sm" color="primary" weight="600">
              Asset filled
            </Text>
            {/* PassIcon would go here if available */}
          </View>
        )}
      </View>

      {/* Quantity Information Section */}
      <View style={styles.quantityInfo as ViewStyle}>
        <View style={styles.quantityRow as ViewStyle}>
          <Text size="sm" color="lightGray">
            Requested Qty:
          </Text>
          <Text size="sm" weight="600" color="neutral">
            {requestedQuantity} {unit}
          </Text>
        </View>
        
        <View style={styles.quantityRow as ViewStyle}>
          <Text size="sm" color="lightGray">
            Filled Qty:
          </Text>
          <Text size="sm" weight="600" color={filledQuantity > 0 ? 'primary' : 'neutral'}>
            {filledQuantity} {unit}
          </Text>
        </View>

        {/* Editable Dispensed Quantity (matching Vue.js) */}
        {filledQuantity > 0 && (
          <View style={styles.dispensedQuantityRow as ViewStyle}>
            <Text size="sm" weight="600" color="primary">
              Dispensed Qty:
            </Text>
            <View style={styles.editableQuantityContainer as ViewStyle}>
              {isEditable || isEditingLocal ? (
                <>
                  <Text size="sm" weight="600" color="primary">
                    {tempQuantity} {unit}
                  </Text>
                  <TouchableOpacity
                    style={styles.iconButton as ViewStyle}
                    onPress={updateAsset}>
                    {/* SaveIcon would go here if available */}
                    <Text size="xs" color="primary">Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleFilledQuantityPress}
                    style={styles.editableQuantity as ViewStyle}>
                    <Text size="sm" weight="600" color="primary">
                      {filledQuantity} {unit}
                    </Text>
                    <Text size="xs" color="lightGray" style={styles.editHint as TextStyle}>
                      (tap to edit)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton as ViewStyle}
                    onPress={handleStartEdit}>
                    {/* EditIcon would go here if available */}
                    <Text size="xs" color="primary">Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons Section */}
      <View style={styles.actionsContainer as ViewStyle}>
        {/* Fill Remaining Button */}
        {!filledQuantity && isAssetPartiallyFilled() && (
          <TouchableOpacity
            style={[
              styles.actionButton as ViewStyle,
              hideButton ? styles.hiddenButton : styles.fillRemainingButton,
            ]}
            onPress={fillPartiallyFilledAsset}
            disabled={hideButton}>
            <Text size="sm" weight="600" color="white">
              Fill Remaining
            </Text>
          </TouchableOpacity>
        )}

        {/* Start Dispense Button */}
        {!filledQuantity && 
         !isAssetPartiallyFilled() && 
         !(partiallyFilledAssetsArray.length > 0) && (
          <TouchableOpacity
            style={[
              styles.actionButton as ViewStyle,
              hideButton ? styles.hiddenButton : styles.startDispenseButton,
            ]}
            onPress={startDispense}
            disabled={hideButton || isDisabledDueToOtherFillRemaining()}>
            <Text size="sm" weight="600" color="white">
              {isDisabledDueToOtherFillRemaining() ? 'Fill Other Asset First' : 'Start Dispense'}
            </Text>
          </TouchableOpacity>
        )}

        {/* QR Code Generation (matching Vue.js for specific vehicles) */}
        {isSpecificVehicle && (
          <TouchableOpacity
            style={[styles.actionButton as ViewStyle, styles.qrButton]}
            onPress={handleGenerateQRCode}>
            <Text size="xs" weight="600" color="white">
              Generate QR
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quantity Bottom Sheet */}
      <QuantityBottomSheet
        visible={showQuantityBottomSheet}
        onClose={() => setShowQuantityBottomSheet(false)}
        onProceed={handleQuantityUpdate}
        orderQuantity={requestedQuantity}
        existingQuantity={filledQuantity}
        isFillingRemaining={isAssetPartiallyFilled()}
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
  filledContainer: {
    backgroundColor: '#F0F9FF', // Light blue for filled assets
    borderColor: FBColorPalette.primary,
  },
  emptyContainer: {
    backgroundColor: FBBackground.white,
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
  assetName: {
    color: FBColorPalette.text,
  },
  assetCode: {
    marginTop: '2@vs',
  },
  assetFilledIndicator: {
    alignItems: 'center',
    paddingHorizontal: '8@s',
  },
  quantityInfo: {
    marginBottom: '12@vs',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  dispensedQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8@vs',
    paddingTop: '8@vs',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editableQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityValue: {
    marginLeft: '8@s',
  },
  editableQuantity: {
    alignItems: 'flex-end',
    paddingVertical: '2@vs',
    paddingHorizontal: '4@s',
    borderRadius: '4@s',
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editHint: {
    marginTop: '1@vs',
    fontStyle: 'italic' as 'italic',
  },
  iconButton: {
    marginLeft: '8@s',
    paddingHorizontal: '4@s',
    paddingVertical: '2@vs',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8@vs',
  },
  actionButton: {
    borderRadius: '6@s',
    paddingVertical: '8@vs',
    paddingHorizontal: '12@s',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: '8@s',
    flex: 1,
  },
  startDispenseButton: {
    backgroundColor: FBColors.primary,
    borderColor: FBColors.primary,
  },
  fillRemainingButton: {
    backgroundColor: '#FF8C00', // Orange background for Fill Remaining
    borderColor: '#FF8C00',
  },
  qrButton: {
    backgroundColor: '#6366F1', // Indigo for QR generation
    borderColor: '#6366F1',
    flex: 0,
    minWidth: '80@s',
  },
  hiddenButton: {
    backgroundColor: FBBackground.disabled,
    borderColor: FBBorders.disabledInputText,
    opacity: 0.6,
  },
  disabledButton: {
    backgroundColor: FBBackground.disabled,
    borderColor: FBBorders.disabledInputText,
  },
  vehicleLogo: {
    width: '20@s',
    height: '20@s',
  },
});

export default AssetCard;
