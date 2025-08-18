import React from 'react';
import {View} from 'react-native';
import {Avatar, CardElevated, Text as CustomText} from '@/components';
import {ScaledSheet} from 'react-native-size-matters';

const OrderDetails = ({data}: any) => {
  return (
    <CardElevated cardStyle={styles.container as any}>
      <Avatar fullName={data?.fullName} />
      <View style={styles.infoRow}>
        <CustomText size="xl" weight="bold">
          {data?.fullName}
        </CustomText>
        <CustomText color="darkGray" style={styles.phoneText as any}>
          {data?.phone}
        </CustomText>
        <CustomText
          color="lightGray"
          lines={2}
          style={styles.addressText as any}>
          {data?.address}
        </CustomText>
      </View>
    </CardElevated>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  infoRow: {
    flexDirection: 'column',
    marginLeft: '10@s',
  },
  phoneText: {
    marginBottom: '10@vs',
  },
  addressText: {
    maxWidth: '250@s',
  },
});

export default OrderDetails;
