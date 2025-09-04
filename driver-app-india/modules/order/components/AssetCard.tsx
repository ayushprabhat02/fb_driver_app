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
}) => {
  const navigation = useNavigation();
  const [showQuantityBottomSheet, setShowQuantityBottomSheet] = useState(false);
  
  const remainingQuantity = requestedQuantity - filledQuantity;
  const isCompleted = remainingQuantity <= 0;
  
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
      const currentDriverOrder = orderStore.getState().currentDriverOrder;
      const currentCustomerOrder = orderStore.getState().currentCustomerOrder;
      const selectedOrder = currentDriverOrder || currentCustomerOrder;

      if (!selectedOrder?.customer_order?.id) {
        Alert.alert('Error', 'Order data is missing');
        return;
      }

      const assetId = asset.customer_asset?.id || asset.id || asset.customer_asset_id;
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
          return { ...a, quantity_dispensed: quantity };
        }
        return a;
      });

      orderStore.setState(state => ({
        ...state,
        orderAssets: updatedAssets,
      }));

      setShowQuantityBottomSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    }
  };
  
  const getButtonText = () => {
    // If dispensing is complete (filled quantity >= requested quantity), show Complete
    if (filledQuantity >= requestedQuantity) {
      return 'Complete';
    }
    // If partially filled, show Complete
    if (filledQuantity > 0) {
      return 'Complete';
    }
    // Otherwise show Start Dispense
    return 'Start Dispense';
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
            Requested Qty:
          </Text>
          <Text
            size="sm"
            weight="600"
            color="neutral"
            style={styles.quantityValue as TextStyle}>
            {requestedQuantity} {unit}
          </Text>
        </View>

        <View style={styles.quantityRow as ViewStyle}>
          <Text size="sm" color="lightGray">
            Filled Qty:
          </Text>
          <TouchableOpacity 
            onPress={handleFilledQuantityPress}
            style={styles.editableQuantity as ViewStyle}
          >
            <Text
              size="sm"
              weight="600"
              color={filledQuantity > 0 ? "primary" : "neutral"}
              style={styles.quantityValue as TextStyle}>
              {filledQuantity} {unit}
            </Text>
            <Text size="xs" color="lightGray" style={styles.editHint as TextStyle}>
              (tap to edit)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.dispenseButton as ViewStyle,
          (disabled || filledQuantity >= requestedQuantity) && (styles.disabledButton as ViewStyle), // Disable if explicitly disabled OR if dispensing is complete
        ]}
        onPress={handleStartDispense}
        disabled={disabled || filledQuantity >= requestedQuantity} // Disable if explicitly disabled OR if dispensing is complete
        activeOpacity={0.7}>
        <Text
          size="sm"
          weight="600"
          color={(disabled || filledQuantity >= requestedQuantity) ? 'disabledInputText' : 'white'}> {/* Show disabled color if disabled OR dispensing is complete */}
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Quantity Bottom Sheet */}
      <QuantityBottomSheet
        visible={showQuantityBottomSheet}
        onClose={() => setShowQuantityBottomSheet(false)}
        onProceed={handleQuantityUpdate}
        orderQuantity={requestedQuantity}
        filledQuantity={filledQuantity}
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
