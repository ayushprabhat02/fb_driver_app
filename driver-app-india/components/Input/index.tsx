// dependencies
import React from 'react';
import {
  TextInput,
  KeyboardTypeOptions,
  TextStyle,
  DimensionValue,
  TextInputProps,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// styles
import {commonInputStyles} from '@/styles';

// types
import {
  FBBackground,
  FBBorders,
  FBColors,
  FontSize,
  FontSizeEnum,
} from '../../types/styles';

type Background = 'primary' | 'secondary';
type Border = 'primary';
type TextColor = 'primary' | 'neutral';

interface InputProps {
  props?: TextInputProps;
  type?: KeyboardTypeOptions;
  backgroundColor?: Background;
  textColor?: TextColor;
  border?: Border;
  height?: DimensionValue;
  width?: DimensionValue;
  style?: TextStyle;
  value: string | null | undefined;
  textSize?: FontSize;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'default',
  backgroundColor = 'primary',
  textColor = 'neutral',
  border = 'primary',
  height = 48,
  width = '100%',
  textSize = 'sm',
  style,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  props,
}) => {
  const inputStyles = ScaledSheet.create({
    container: {
      ...commonInputStyles,
      borderColor: FBBorders[border],
      height: height,
      width: width,
      fontSize: FontSizeEnum[textSize],
      backgroundColor: FBBackground[backgroundColor],
      ...style,
    },
    input: {
      color: FBColors[textColor],
    },

    disabled: {
      backgroundColor: FBBackground.subtleBlack,
      color: FBColors.lightGray,
    },
  });

  return (
    <TextInput
      placeholder={placeholder}
      maxLength={129}
      style={[
        inputStyles.container as any,
        inputStyles.input,
        {letterSpacing: 1.2},
        disabled && inputStyles.disabled,
      ]}
      keyboardType={type}
      value={value as string}
      onChangeText={onChangeText}
      editable={!disabled}
      {...props}
    />
  );
};

export default Input;
