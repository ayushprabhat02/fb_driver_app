// dependencies
import {
  Text as RNText,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React from 'react';

// // types
import {FBBackground, FBColorPalette} from '@/types/styles';

interface Props {
  variant: 'outlined' | 'solid' | 'text' | 'rounded';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

interface IconButtonChildren {
  children: React.ReactNode;
}

interface IconButtonText extends IconButtonChildren {
  disabled?: boolean;
  variant?: 'outlined' | 'solid' | 'text' | 'rounded';
  textStyle?: TextStyle | any;
}

type IconButton = React.FC<Props> & {
  Text: React.FC<IconButtonText>;
  Icon: React.FC<IconButtonChildren>;
};

const IconButton: IconButton = ({
  variant = 'outlined',
  loading = false,
  disabled = false,
  onPress,
  style,
  children,
}) => {
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: disabled ? 'gray' : FBColorPalette.primary,
          backgroundColor: 'transparent',
        };
      case 'solid':
        return {
          backgroundColor: disabled ? 'gray' : FBColorPalette.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
        };
      case 'rounded':
        return {
          height: 40,
          width: 40,
          borderRadius: 20,
          borderColor: disabled ? 'gray' : FBColorPalette.secondary,
          backgroundColor: FBBackground.darkGreen,
        };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          height: 36,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: 14,
          columnGap: 8,
        },
        getButtonStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? 'white' : 'blue'} />
      ) : (
        <>
          {React.Children.map(children, child => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return React.cloneElement(child as any, {
              variant: variant,
              disabled: disabled,
            });
          })}
        </>
      )}
    </TouchableOpacity>
  );
};

IconButton.Text = ({children, variant, disabled, textStyle}) => {
  const getButtonTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outlined':
        return {
          color: disabled ? 'gray' : FBColorPalette.primary,
          ...textStyle,
        };
      case 'solid':
        return {
          color: 'white',
          ...textStyle,
        };
      case 'text':
        return {
          color: disabled ? 'gray' : FBColorPalette.primary,
          ...textStyle,
        };
      case 'rounded':
        return {
          color: disabled ? 'gray' : FBColorPalette.white,
          ...textStyle,
        };
      default:
        return {};
    }
  };

  return (
    <RNText style={[getButtonTextStyle(), styles.defaultText, textStyle]}>
      {children}
    </RNText>
  );
};

IconButton.Icon = ({children}) => {
  return <>{children}</>;
};

const styles = StyleSheet.create({
  defaultText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default IconButton;
