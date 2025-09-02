import React from 'react';
import {View, TouchableOpacity, ViewStyle, TextStyle} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {FBColors, FBBackground, FBBorders} from '@/types/styles';

interface AssetActionButtonsProps {
  onProceed: () => void;
  onCancel: () => void;
  proceedDisabled?: boolean;
  cancelDisabled?: boolean;
  proceedText?: string;
  cancelText?: string;
}

const AssetActionButtons: React.FC<AssetActionButtonsProps> = ({
  onProceed,
  onCancel,
  proceedDisabled = false,
  cancelDisabled = false,
  proceedText = 'Proceed',
  cancelText = 'Cancel Request',
}) => {
  return (
    <View style={styles.container as ViewStyle}>
      <View style={styles.buttonRow as ViewStyle}>
        <TouchableOpacity
          style={[
            styles.cancelButton as ViewStyle,
            cancelDisabled && (styles.disabledButton as ViewStyle),
          ]}
          onPress={onCancel}
          disabled={cancelDisabled}
          activeOpacity={0.7}>
          <Text
            size="base"
            weight="600"
            color={cancelDisabled ? 'disabledInputText' : 'error'}>
            {cancelText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.proceedButton as ViewStyle,
            proceedDisabled && (styles.disabledButton as ViewStyle),
          ]}
          onPress={onProceed}
          disabled={proceedDisabled}
          activeOpacity={0.7}>
          <Text
            size="base"
            weight="600"
            color={proceedDisabled ? 'disabledInputText' : 'white'}>
            {proceedText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    gap: '10@s',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: '10@s',
  },
  proceedButton: {
    flex: 1,
    backgroundColor: FBColors.steelBlue,
    borderRadius: '6@s',
    paddingVertical: '10@vs',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FBColors.steelBlue,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: FBBackground.white,
    borderRadius: '6@s',
    paddingVertical: '10@vs',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FBColors.error,
  },
  disabledButton: {
    backgroundColor: FBBackground.disabled,
    borderColor: FBBorders.disabledInputText,
  },
});

export default AssetActionButtons;
