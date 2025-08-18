// dependencies
import React from 'react';
import {Text as RNText, TextStyle, TextProps} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// types
import {FBColors, Colors} from '../../types/styles';

enum Size {
  'xxs' = '8@s',
  'xs' = '10@s',
  'sm' = '12@s',
  'base' = '14@s',
  'lg' = '18@s',
  'xl' = '22@s',
  '2xl' = '26@s',
  '3xl' = '30@s',
  '4xl' = '34@s',
}

enum LetterSpacing {
  'widest' = 1,
  'normal' = 0,
}

enum Appearance {
  opaque = 1,
  light = 0.6,
}

interface CustomTextProps extends TextProps {
  size?: 'xxs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: TextStyle['fontWeight'];
  color?: Colors;
  letterSpacing?: 'widest' | 'normal';
  style?: TextStyle;
  lines?: number;
  ending?: 'middle' | 'head' | 'tail' | 'clip';
  appearance?: 'opaque' | 'light';
  children: React.ReactNode;
}

const Text: React.FC<CustomTextProps> = props => {
  const styles = ScaledSheet.create({
    textStyle: {
      fontSize: Size[props.size || 'base'],
      fontWeight: props.weight,
      color: FBColors[props.color || 'neutral'],
      letterSpacing: LetterSpacing[props.letterSpacing || 'normal'],
      opacity: Appearance[props.appearance || 'opaque'],
      ...props.style,
    },
  });

  return (
    <RNText
      {...props}
      numberOfLines={props.lines}
      ellipsizeMode={props.ending}
      style={styles.textStyle as TextStyle}>
      {props.children}
    </RNText>
  );
};

export default Text;
