import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';

interface AssetCardProps {
  assetName: string;
  assetCode: string;
  requestedQuantity: number;
  filledQuantity: number;
  unit?: string;
  onDispense: () => void;
  disabled?: boolean;
}

const AssetCard: React.FC<AssetCardProps> = ({
  assetName,
  assetCode,
  requestedQuantity,
  filledQuantity,
  unit = 'Ltr',
  onDispense,
  disabled = false,
}) => {
  const remainingQuantity = requestedQuantity - filledQuantity;
  const isCompleted = remainingQuantity <= 0;

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
          <Text
            size="sm"
            weight="600"
            color="neutral"
            style={styles.quantityValue as TextStyle}>
            {filledQuantity} {unit}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.dispenseButton as ViewStyle,
          (disabled || isCompleted) && (styles.disabledButton as ViewStyle),
        ]}
        onPress={onDispense}
        disabled={disabled || isCompleted}
        activeOpacity={0.7}>
        <Text
          size="sm"
          weight="600"
          color={disabled || isCompleted ? 'disabledInputText' : 'white'}>
          {isCompleted ? 'Completed' : 'Start dispense'}
        </Text>
      </TouchableOpacity>
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
  vehicleLogo: {
    width: '20@s',
    height: '20@s',
  },
});

export default AssetCard;
