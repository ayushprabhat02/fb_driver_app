import React from 'react';
import {View, Image} from 'react-native';
import {Text as CustomText} from '@/components';
import {ScaledSheet} from 'react-native-size-matters';

const ForYouDecoration: React.FC = () => {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/delivery/vine-left.png')} />
      <CustomText
        size="base"
        letterSpacing="widest"
        color="mediumGray"
        style={{marginHorizontal: 4}}>
        FOR YOU
      </CustomText>
      <Image source={require('@/assets/delivery/vine-right.png')} />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
});

export default ForYouDecoration;
