// dependencies
import React from 'react';
import {Pressable, StyleSheet, TextStyle, ViewStyle} from 'react-native';

// components
import {Text} from '..';

// types
import {Colors, FontSize} from '@/types/styles';

interface TextButtonProps {
  onPress: () => void;
  textColor?: Colors;
  weight?: TextStyle['fontWeight'];
  children: React.ReactNode;
  textSize?: FontSize;
  underline?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
  textStyles?: TextStyle;
}

const TextButton: React.FC<TextButtonProps> = ({
  onPress,
  textColor = 'primary',
  weight = '600',
  children,
  disabled = false,
  textSize = 'base',
  underline = false,
  style,
  textStyles,
}) => {
  const styles = StyleSheet.create({
    button: {
      backgroundColor: 'transparent',
      ...style,
    },
    text: {
      textDecorationLine: underline ? 'underline' : 'none',
      textDecorationStyle: 'solid',
      ...textStyles,
    },
  });

  return (
    <Pressable
      style={styles.button}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}>
      <Text
        style={styles.text}
        color={textColor}
        weight={weight}
        size={textSize}>
        {children}
      </Text>
    </Pressable>
  );
};

export default TextButton;
