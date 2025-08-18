// dependencies
import React, {forwardRef, Ref} from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  TouchableOpacityProps,
} from 'react-native';

// types
import {FBBackground, FBColorPalette} from '@/types/styles';

interface ButtonProps {
  variant: 'outlined' | 'solid' | 'rounded';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  children: React.ReactNode;
}

const Button = forwardRef(
  (
    {
      variant = 'outlined',
      loading = false,
      disabled = false,
      onPress,
      style,
      textStyle,
      children,
    }: ButtonProps & TouchableOpacityProps,
    ref: Ref<TouchableOpacity>,
  ) => {
    const getButtonStyle = (): ViewStyle => {
      switch (variant) {
        case 'outlined':
          return {
            borderWidth: 1,
            borderColor: disabled ? 'gray' : FBColorPalette.complementary,
            backgroundColor: 'transparent',
          };

        case 'solid':
          return {
            backgroundColor: disabled ? 'gray' : FBColorPalette.primary,
          };

        case 'rounded':
          return {
            height: 40,
            width: 40,
            borderRadius: 100,
            borderColor: disabled ? 'gray' : FBColorPalette.secondary,
            backgroundColor: FBBackground.darkGreen,
          };
        default:
          return {};
      }
    };

    const getButtonTextStyle = (): TextStyle => {
      switch (variant) {
        case 'outlined':
          return {
            color: disabled ? 'gray' : FBColorPalette.complementary,
          };

        case 'solid':
          return {
            color: 'white',
            fontWeight: '600',
            fontSize: 16,
          };

        case 'rounded':
          return {
            color: disabled ? 'gray' : FBColorPalette.white,
          };
        default:
          return {};
      }
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          {
            height: 48,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          },
          getButtonStyle(),
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}>
        {loading ? (
          <ActivityIndicator color={variant === 'solid' ? 'white' : 'blue'} />
        ) : (
          <Text style={[getButtonTextStyle(), textStyle, {fontWeight: '600'}]}>
            {children}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);

export default Button;
