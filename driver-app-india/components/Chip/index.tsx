// dependencies
import {Pressable} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import React from 'react';

// components
import Text from '../Text';

// types
import {FBColorPalette, Colors, FontSize} from '@/types/styles';

type Shape = 'rounded' | 'square' | 'pill';

interface Props {
  label: string;
  onPress: () => void;
  active: boolean;
  shape: Shape;
  style?: any; //@todo: add type
  textStyle?: any; //@todo: add type
  activeBGColor?: string;
  activeTextColor?: Colors;
  fontSize?: FontSize;
}

const Chip: React.FC<Props> = ({
  label,
  onPress,
  active,
  shape,
  style,
  textStyle,
  activeBGColor = FBColorPalette.primary,
  activeTextColor = 'white',
  fontSize = 'base',
}) => {
  const getChipRadius = () => {
    switch (shape) {
      case 'pill':
        return {borderRadius: 100};

      case 'rounded':
        return {borderRadius: 10};

      case 'square':
        return {borderRadius: 6};

      default:
        return {borderRadius: 6};
    }
  };

  const styles = ScaledSheet.create({
    chipContainer: {
      paddingHorizontal: '12@s',
      paddingVertical: '4@vs',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    },

    activeChipContainer: {
      backgroundColor: active ? activeBGColor : 'transparent',
    },
  });

  return (
    <Pressable
      style={[
        styles.chipContainer,
        styles.activeChipContainer,
        getChipRadius(),
      ]}
      onPress={onPress}>
      <Text
        color={active ? activeTextColor : 'lightGray'}
        weight="600"
        size={fontSize}
        style={textStyle}>
        {label}
      </Text>
    </Pressable>
  );
};

export default Chip;
