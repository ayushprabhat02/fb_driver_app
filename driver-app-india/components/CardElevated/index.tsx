/**
 * Need to rename this to "Card"
 * Pass variants: "elevated", "flat", "outlined" etc as props
 * control shadow styles according to variant
 */

import React from 'react';
import {View, Platform, ViewStyle} from 'react-native';
import {ms, vs, s, ScaledSheet} from 'react-native-size-matters';
import {FBColors} from '@/types/styles';
interface Props {
  children?: React.ReactNode;
  cardStyle?: ViewStyle | any; //@todo: add type
}

const CardElevated: React.FC<Props> = ({children, cardStyle}) => {
  return (
    <View style={[styles.productSummaryContainer, cardStyle]}>{children}</View>
  );
};

const styles = ScaledSheet.create({
  productSummaryContainer: {
    backgroundColor: FBColors.white,
    height: 'auto',
    borderRadius: '10@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '12@s',
    borderColor: 'lightgray',
    borderWidth: '1@s',
    // Consider using platform-specific shadows:
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: s(1), height: vs(2)},
        shadowOpacity: ms(0.2),
        shadowRadius: ms(4),
      },
      android: {
        elevation: 0,
      },
    }),
  },
});

export default CardElevated;
