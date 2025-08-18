//dependencies
import {DateTime} from 'luxon';
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// store
import orderStore from '../../store';

//utilis
import {getDeliveredDate, getDeliveredTime} from '@/utils/general';

//imports
import {CardElevated, Divider, Text} from '@/components';
import {DownLoadInvoiceOrState} from '../components';

// graphql-documents
import {Customer_Order_Item_Stateflow} from '@/generated/graphql';

const OrderDetails: React.FC = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetailsId();

  return (
    <CardElevated cardStyle={{height: 'auto'}}>
      <View
        style={[
          styles.container,
          {
            justifyContent: 'space-between',
          },
        ]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text weight="bold" color="darkGray" size="lg">
            Order Details
          </Text>
          <DownLoadInvoiceOrState />
        </View>
        <Divider />
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text size="sm">Order Code:</Text>
          <Text size="sm">{singleOrderDetails?.order_code || ''}</Text>
        </View>
        {singleOrderDetails?.otp ? (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text size="sm">Order OTP:</Text>
            <Text size="sm">{singleOrderDetails?.otp || ''}</Text>
          </View>
        ) : null}
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text size="sm">Order Reference:</Text>
          <Text size="sm">{singleOrderDetails?.erp_code || ''}</Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text size="sm">Order Date:</Text>
          <Text size="sm">
            {`${DateTime.fromISO(
              singleOrderDetails?.customer_order_items[0].created_at,
            )
              .setZone('Asia/Kolkata')
              .toFormat('dd-MMM-yyyy')}`}
          </Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text size="sm">Exp. Delivery Date:</Text>
          <Text size="sm">
            {`${DateTime.fromISO(
              singleOrderDetails?.customer_order_items[0]
                .estimate_delivery_date,
            )
              .setZone('Asia/Kolkata')
              .toFormat('dd-MMM-yyyy')}`}
          </Text>
        </View>
        {singleOrderDetails?.state.toLowerCase() === 'delivered' ||
        singleOrderDetails?.state.toLowerCase() === 'completed' ? (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text size="sm">Delivery Date:</Text>
            <Text size="sm">
              {getDeliveredDate(
                singleOrderDetails?.customer_order_items[0]
                  ?.customer_order_item_stateflows as Customer_Order_Item_Stateflow[],
              )}
              ,{' '}
              {getDeliveredTime(
                singleOrderDetails?.customer_order_items[0]
                  ?.customer_order_item_stateflows as Customer_Order_Item_Stateflow[],
              )}
            </Text>
          </View>
        ) : null}
      </View>
    </CardElevated>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    padding: '8@s',
  },
  text: {
    flexDirection: 'column',
    marginLeft: '10@s',
    alignItems: 'flex-start',
  },

  details: {
    textAlign: 'center',
    fontSize: '12@ms',
  },
});

export default OrderDetails;
