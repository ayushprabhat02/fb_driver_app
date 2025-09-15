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
import {Text, QuantityBottomSheet} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';
import {orderStore} from '@/globalStore';
import orderService from '../services';

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

  // Get partially filled assets from store
  const partiallyFilledAssetsArray =
    orderStore.use.partiallyFilledAssetsArray();
  const addPartiallyFilledAsset = orderStore.use.addPartiallyFilledAsset();
  const removePartiallyFilledAsset =
    orderStore.use.removePartiallyFilledAsset();
  // Get assets with uploaded videos
  const assetsWithUploadedVideos = orderStore.use.assetsWithUploadedVideos();
  const removeAssetWithUploadedVideo =
    orderStore.use.removeAssetWithUploadedVideo();

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

    try {
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

      // Update asset quantity through API
      await orderService.updateAssetQty({
        customerAssetId: assetId,
        customerOrderId: selectedOrder.customer_order.id,
        qty: quantity,
      });

      // Update the asset in the store
      const updatedAssets = orderStore.getState().orderAssets?.map((a: any) => {
        if ((a.customer_asset?.id || a.id) === assetId) {
          return {...a, quantity_dispensed: quantity};
        }
        return a;
      });

      orderStore.setState(state => ({
        ...state,
        orderAssets: updatedAssets,
      }));

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
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
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
    <View style={styles.container as ViewStyle}>
      <View style={styles.assetInfo as ViewStyle}>
        <View style={styles.assetIcon as ViewStyle}>
          <Image
            source={require('@/assets/home/truck-fuelbuddy.png')}
            style={styles.vehicleLogo as ImageStyle}
            resizeMode="contain"
          />
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
            Filled Qty:
          </Text>
          <TouchableOpacity
            onPress={handleFilledQuantityPress}
            style={styles.editableQuantity as ViewStyle}
            disabled={filledQuantity === 0} // Disable press when quantity is zero
          >
            <Text
              size="sm"
              weight="600"
              color={filledQuantity > 0 ? 'primary' : 'neutral'}
              style={styles.quantityValue as TextStyle}>
              {filledQuantity} {unit}
            </Text>
            {/* Show "(tap to edit)" only when filled quantity is greater than 0 */}
            {filledQuantity > 0 && (
              <Text
                size="xs"
                color="lightGray"
                style={styles.editHint as TextStyle}>
                (tap to edit)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.dispenseButton as ViewStyle,
          getButtonText() === 'Fill Remaining' &&
            (styles.fillRemainingButton as ViewStyle),
          (disabled ||
            getButtonText() === 'Complete' ||
            isDisabledDueToOtherFillRemaining()) &&
            (styles.disabledButton as ViewStyle),
        ]}
        onPress={
          isAssetPartiallyFilled()
            ? handleFilledQuantityPress
            : handleStartDispense
        }
        disabled={
          disabled ||
          getButtonText() === 'Complete' ||
          isDisabledDueToOtherFillRemaining()
        }
        activeOpacity={0.7}>
        <Text
          size="sm"
          weight="600"
          color={
            disabled ||
            getButtonText() === 'Complete' ||
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
  quantityValue: {
    marginLeft: '8@s',
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
    fontStyle: 'italic',
  },
  vehicleLogo: {
    width: '20@s',
    height: '20@s',
  },
});

export default AssetCard;
