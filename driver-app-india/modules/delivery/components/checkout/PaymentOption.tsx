// dependencies
import React from 'react';
import {View, Pressable} from 'react-native';
import {s, ScaledSheet} from 'react-native-size-matters';

//components
import {Text} from '@/components';

// styles
import {FBBorders, FBColors} from '@/types/styles';

type PaymentOptionsRadioButton = {
  title: string;
  description: string;
  onPress: () => void;
  isSelected: boolean;
};
const PaymentOption: React.FC<PaymentOptionsRadioButton> = ({
  title,
  // description,
  onPress,
  isSelected,
}) => {
  return (
    <View style={styles.paymentOption}>
      <Pressable
        style={{flexDirection: 'row', alignItems: 'center'}}
        onPress={onPress}>
        <View
          style={[
            styles.radioButton,
            isSelected ? styles.radioButtonSelected : {},
          ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
        <View style={{flexDirection: 'column', marginLeft: s(10)}}>
          <Text weight="bold" size="base">
            {title}
          </Text>
          {/* <Text size="xs" style={{marginTop: vs(3)}}>
            {description}
          </Text> */}
        </View>
      </Pressable>
    </View>
  );
};

const styles = ScaledSheet.create({
  paymentOption: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginVertical: '10@vs',
    paddingBottom: '16@vs',
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.primary,
  },
  radioButton: {
    height: '20@ms',
    width: '20@ms',
    borderRadius: '10@ms',
    borderWidth: '2@s',
    borderColor: 'gray',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '5@s',
  },
  radioButtonSelected: {
    borderColor: FBColors.primary, // Or your selected color
  },
  radioButtonInner: {
    height: '12@ms',
    width: '12@ms',
    borderRadius: '6@ms',
    backgroundColor: FBColors.primary, // Or your selected color
  },
});

export default PaymentOption;
