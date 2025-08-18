// dependencies
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {Divider, Text} from '@/components';

// types
import {Colors, FBColors} from '@/types/styles';

interface AmountBoxProps {
  icon: React.ReactNode;
  label: string;
  amount: string | number;
  amountColor: Colors | undefined;
  backgroundColor: FBColors;
}

const AmountBox: React.FC<AmountBoxProps> = ({
  icon,
  label,
  amount,
  amountColor,
  backgroundColor,
}) => {
  return (
    <View style={styles.amountBox}>
      <View style={[styles.iconContainer, {backgroundColor: backgroundColor}]}>
        {icon}
      </View>
      <View style={styles.amountContainer}>
        <Text
          size="xs"
          style={{flexShrink: 0}}
          numberOfLines={1}
          ellipsizeMode="tail">
          {label}
        </Text>
        <Divider height={5} />
        <Text
          color={amountColor}
          size="base"
          style={{flexShrink: 0}}
          numberOfLines={1}
          ellipsizeMode="tail">
          {amount}
        </Text>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  amountBox: {
    backgroundColor: FBColors.white,
    borderRadius: '8@ms',
    padding: '8@vs',
    width: '48%',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    flexDirection: 'row',
    columnGap: 8,
  },
  iconContainer: {
    width: '26@ms',
    height: '40@ms',
    borderRadius: '15@ms',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10@vs',
  },
  amountContainer: {
    marginLeft: '4@ms',
  },
});

export default AmountBox;
