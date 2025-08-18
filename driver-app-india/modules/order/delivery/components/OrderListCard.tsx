// dependencies
import {useNavigation} from '@react-navigation/native';
import {DateTime} from 'luxon';
import React, {memo, useCallback} from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {Divider, Text, TextButton} from '@/components';

// utils
import {getOrderStatus} from '@/utils/general';

// store
import orderStore from '../../store';

// types
import {FetchDeliveryOrderByStateQuery} from '@/generated/graphql';
import {OrderService} from '@/services';
import {FBBorders} from '@/types/styles';

interface Props {
  order: FetchDeliveryOrderByStateQuery['customer_order'][0];
}

const OrderListCard: React.FC<Props> = ({order}) => {
  const navigation = useNavigation();

  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();

  const showOrderDetails = useCallback(() => {
    startLoader('fetchInvoices');
    startLoader('singleOrderDetails');

    orderStore.setState(state => ({
      ...state,
      singleOrderDetails: order,
    }));
    OrderService.fetchCustomerOrderById({OrderId: order.id}).finally(() => {
      stopLoader('singleOrderDetails');
    });

    OrderService.fetchSalesInvoicePdfQuery({
      object: {customer_order_id: order.id, isPickup: false},
    }).finally(() => {
      stopLoader('fetchInvoices');
    });
    navigation.navigate('order', {screen: 'order-details', orderId: order.id});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.orderListCardContainer}>
      {/* order code */}

      <OrderDetail detail="Order Code" value={order.order_code} emphasize />

      <Divider height={6} />
      <OrderDetail
        detail="Status"
        value={getOrderStatus(order?.state) as string}
        emphasize
      />

      {order.customer_purchase_order_number && (
        <>
          {/* order date */}
          <Divider height={6} />
          <OrderDetail
            detail="Purchase order code"
            value={order.customer_purchase_order_number as string}
            emphasize
          />
        </>
      )}

      {/* order date */}
      <Divider height={6} />
      <OrderDetail
        detail="Order Date"
        value={`${DateTime.fromISO(order.order_date).toFormat(
          'dd-MMM-yyyy',
        )} ${DateTime.fromISO(order.order_date)
          .setZone('Asia/Kolkata')
          .toFormat('hh:mm a')}`}
      />

      {/* estimated delivery date */}
      <Divider height={6} />
      <OrderDetail
        detail="Estimated Delivery Date"
        value={`${DateTime.fromISO(
          order?.customer_order_items[0].estimate_delivery_date,
        ).toFormat('dd-MMM-yyyy')}, ${DateTime.fromISO(
          order.customer_order_items[0]
            ?.product_variation_partner_localities_slot?.start_time,
        ).toFormat('hh:mm a')} - ${DateTime.fromISO(
          order.customer_order_items[0]
            ?.product_variation_partner_localities_slot?.end_time,
        ).toFormat('hh:mm a')}`}
      />

      {/* address */}
      <Divider height={6} />
      <View style={{width: '100%', flexDirection: 'row'}}>
        <Text size="sm" weight="600">
          Address:{' '}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', maxWidth: '80%'}}>
          <Text size="sm" lines={1}>
            {order?.organizationAddressByShippingAddressId?.house_number
              ? `${order?.organizationAddressByShippingAddressId?.house_number},`
              : null}
            {order?.organizationAddressByShippingAddressId?.address_line1
              ? `${order?.organizationAddressByShippingAddressId?.address_line1},`
              : null}
            {order?.organizationAddressByShippingAddressId?.address_line2
              ? `${order?.organizationAddressByShippingAddressId?.address_line2},`
              : null}
            {order?.organizationAddressByShippingAddressId?.pincode
              ? `${order?.organizationAddressByShippingAddressId?.pincode},`
              : null}
            {order?.organizationAddressByShippingAddressId?.country?.name
              ? `${order?.organizationAddressByShippingAddressId?.country?.name}`
              : null}
          </Text>
        </View>
      </View>

      {/* view order btn */}
      <Divider height={20} />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <TextButton textSize="sm" onPress={showOrderDetails}>
          View Order Details
        </TextButton>
        {order.otp && (
          <Text size="sm" weight="bold">
            OTP: {order?.otp}
          </Text>
        )}
      </View>
    </View>
  );
};

interface OrderDetailProps {
  detail: string;
  value: string | number;
  emphasize?: boolean;
}

const OrderDetail: React.FC<OrderDetailProps> = memo(
  ({detail, value, emphasize = false}) => (
    <View style={styles.flexRow}>
      <Text weight="600" size="sm">
        {detail} :{' '}
      </Text>
      <Text
        weight={emphasize ? '600' : '400'}
        size="sm"
        lines={1}
        style={{width: '50%'}}>
        {value}
      </Text>
    </View>
  ),
);

export default OrderListCard;

const styles = ScaledSheet.create({
  orderListCardContainer: {
    backgroundColor: 'white',
    padding: '10@s',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: FBBorders.secondary,
  },

  flexRow: {
    width: '100%',
    flexDirection: 'row',
  },
});
