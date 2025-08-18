// dependencies
import {View} from 'react-native';
import React from 'react';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

// components
import {Text} from '@/components';

// store
import deliveryStore from '../../store';

// styles and colors
import {FBColors} from '@/types/styles';
import {orderStore} from '@/globalStore';

const OTPRequiredCheckbox: React.FC = () => {
  const isOtpRequired = deliveryStore.use.isOtpRequired();
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  const checkboxHandler = (isChecked: boolean) => {
    deliveryStore.setState(state => ({
      ...state,
      isOtpRequired: isChecked,
    }));
  };

  const textComponent = () => (
    <Text size="sm" style={{marginLeft: 10, color: FBColors.neutral}}>
      Choose OTP verification for this order
    </Text>
  );

  return (
    <View>
      <BouncyCheckbox
        disabled={!isUpComingOrderVerify ? false : true}
        isChecked={isOtpRequired}
        onPress={checkboxHandler}
        size={18}
        textComponent={textComponent()}
        textStyle={{fontSize: 12, fontWeight: '400', color: FBColors.neutral}}
        fillColor={FBColors.complementary}
        unfillColor={FBColors.white}
        iconStyle={{borderRadius: 0}}
        innerIconStyle={{borderRadius: 0}}
      />
    </View>
  );
};

export default OTPRequiredCheckbox;
