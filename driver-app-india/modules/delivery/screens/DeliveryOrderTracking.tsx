// dependencies
import React, {useEffect} from 'react';
import {ScrollView, View} from 'react-native';
import {vs, ScaledSheet} from 'react-native-size-matters';
import {StackScreenProps} from '@react-navigation/stack';
import {DateTime} from 'luxon';

// store
import {deliveryStore, orderStore} from '@/globalStore';

// services
import {OrderService} from '@/services';

// components
import {
  CardElevated,
  Divider,
  HeaderAvoidingContainer,
  Text,
} from '@/components';
import {DetailsComponent} from '@/modules/delivery/components';
import {
  DownLoadInvoiceOrState,
  OrderStatusSteps,
} from '@/modules/order/delivery/components';

// types and styles
import {FBBackground, FBBorders} from '@/types/styles';
import {DeliveryStackParamList} from '@/navigator/containers/Delivery';
import {formatAmountInternational} from '@/utils/general';
export type Props = StackScreenProps<
  DeliveryStackParamList,
  'delivery-order-tracking'
>;

const DeliveryOrderTracking: React.FC<Props> = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetailsId();
  const orderStateFlow = orderStore.use.currentOrderStateFlow();
  const stopLoader = orderStore.use.stopLoader();
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();

  useEffect(() => {
    resetDeliveryStore();
    if (singleOrderDetails?.customer_order_items[0].id) {
      OrderService.fetchDeliveryOrderStateFlow({
        customerOrderItemId: singleOrderDetails?.customer_order_items[0].id,
      }).finally(() => {
        stopLoader('fetchInvoices');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HeaderAvoidingContainer paddingHorizontal={6}>
      <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 20}}>
        <View>
          <DetailsComponent title="" cardStyle={{minHeight: vs(200)}}>
            <OrderStatusSteps
              orderStateFlow={orderStateFlow}
              orderDetails={singleOrderDetails}
            />
          </DetailsComponent>

          {/* share order details */}
          <Divider height={20} />
          <OrderDetailsComp />

          {/* Items summary */}
          <Divider height={20} />
          <OrderSummary />
        </View>
      </ScrollView>
    </HeaderAvoidingContainer>
  );
};

const OrderDetailsComp: React.FC = () => {
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
        {singleOrderDetails?.customer_purchase_order_number ? (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text size="sm">Purchase order code: </Text>
            <Text size="sm">
              {singleOrderDetails?.customer_purchase_order_number}
            </Text>
          </View>
        ) : null}
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text size="sm">Ordered Date:</Text>
          <Text size="sm">
            {`${DateTime.fromISO(
              singleOrderDetails?.customer_order_items[0].created_at,
            )
              .setZone('Asia/Kolkata')
              .toFormat('dd-MMM-yyyy')}`}
          </Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text size="sm">Estimated Delivery Date:</Text>
          <Text size="sm">
            {`${DateTime.fromISO(
              singleOrderDetails?.customer_order_items[0]
                .estimate_delivery_date,
            )
              .setZone('Asia/Kolkata')
              .toFormat('dd-MMM-yyyy')}`}
          </Text>
        </View>
      </View>
    </CardElevated>
  );
};

const OrderSummary: React.FC = () => {
  const singleOrderDetailsId = orderStore.use.singleOrderDetailsId();

  return (
    <View style={styles.container2}>
      <View>
        <Text weight="bold" size="lg">
          Summary
        </Text>
      </View>
      <Divider />
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">Ordered Quantity</Text>
        <Text size="sm">
          {singleOrderDetailsId?.customer_order_items[0]?.qty
            ? singleOrderDetailsId?.customer_order_items[0]?.qty
            : ''}
          <Text size="sm"> ltr</Text>
        </Text>
      </View>
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">Net Total</Text>
        <Text size="sm">
          {formatAmountInternational(
            singleOrderDetailsId?.customer_order_items[0]?.actual_amount,
          )}
        </Text>
      </View>
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">Delivery Charges</Text>
        <Text size="sm">
          {singleOrderDetailsId?.tax
            ? formatAmountInternational(
                singleOrderDetailsId?.delivery_fee - singleOrderDetailsId?.tax,
              )
            : 0}
        </Text>
      </View>
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">GST</Text>
        <Text size="sm">{singleOrderDetailsId?.tax || 0}</Text>
      </View>
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">Total Delivery Fees (Inc. GST)</Text>
        <Text size="sm">{singleOrderDetailsId?.delivery_fee || 0}</Text>
      </View>
      {singleOrderDetailsId?.voucher_discount ? (
        <View style={[styles.row, styles.borderBottom]}>
          <Text size="sm">Discount</Text>
          <Text size="sm">
            -{' '}
            {formatAmountInternational(singleOrderDetailsId?.voucher_discount)}
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text size="sm" weight="bold">
          Total Amount
        </Text>
        <Text color="primary" weight="bold" size="sm">
          {singleOrderDetailsId?.customer_order_items[0]?.state ===
            'DELIVERED' ||
          singleOrderDetailsId?.customer_order_items[0]?.state === 'CONFIRMED'
            ? formatAmountInternational(singleOrderDetailsId?.amount)
            : formatAmountInternational(singleOrderDetailsId?.amount_paid)}
        </Text>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },

  container2: {
    height: 'auto',
    padding: 20,
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    borderRadius: 16,
    backgroundColor: FBBackground.seaShell,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  borderBottom: {
    paddingBottom: 6,
    borderBottomColor: FBBorders.primary,
    borderBottomWidth: 1,
  },
});

export default DeliveryOrderTracking;
