import React from 'react';
import {View, Image} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {CardElevated, Text as CustomText} from '@/components';

interface BusinessHomeCardProps {}

const BusinessHomeCard: React.FC<BusinessHomeCardProps> = ({}) => {
  const businessImage = require('@/assets/home/business.png');

  return (
    <CardElevated cardStyle={styles.card as any}>
      <View style={styles.content}>
        <View style={{flexDirection: 'column', width: '35%'}}>
          <CustomText weight="bold" size="xl">
            Business
          </CustomText>
          <CustomText style={{marginTop: 4}} color="lightGray" lines={3}>
            Manage your assets, users and expenses
          </CustomText>
        </View>
        <Image source={businessImage} style={styles.image} />
      </View>
    </CardElevated>
  );
};

const styles = ScaledSheet.create({
  card: {
    flexDirection: 'column',
    height: '160@ms',
    borderRadius: '20@ms',
    width: '95%',
    alignSelf: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    position: 'relative',
    bottom: '10@vs',
    left: '10@vs',
  },
  buttonContainer: {
    paddingHorizontal: '20@s',
    position: 'relative',
    bottom: '10@vs',
  },
});

export default BusinessHomeCard;
