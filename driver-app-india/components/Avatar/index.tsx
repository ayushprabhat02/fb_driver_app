import React from 'react';
import {StyleSheet} from 'react-native';
import {Button as CustomButton, Text as CustomText} from '..';

interface AvatarProps {
  fullName?: string;
  children?: React.ReactNode;
  variant?: 'rounded' | 'outlined'; // Optional variant prop
  onButtonPress?: () => void;
  buttonStyle?: any; //@todo: add type
  buttonTextSize?:
    | 'xxs'
    | 'xs'
    | 'sm'
    | 'base'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl';
}

const Avatar: React.FC<AvatarProps> = ({
  fullName = '',
  onButtonPress,
  buttonStyle,
  buttonTextSize = 'base',
  variant = 'rounded',

  children,
}) => {
  const getInitials = (name: string) => {
    if (!name.length) {
      return '';
    }
    const parts = name.split(' ');
    // Handle names with more than two parts
    return parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].substring(0, 2);
  };

  const styles = StyleSheet.create({
    // Add your styles for 'button' and 'buttonText'
    button: {
      ...buttonStyle,
    },
  });

  return (
    <CustomButton
      onPress={() => {
        onButtonPress && onButtonPress();
      }}
      variant={variant}
      style={styles.button} // You'll need to add styles
    >
      <CustomText
        weight={'400'}
        size={buttonTextSize}
        color={'white'}
        style={{textTransform: 'uppercase'}}>
        {getInitials(fullName) || children}
      </CustomText>
    </CustomButton>
  );
};

export default Avatar;
