// dependencies
import {Divider, Text} from '@/components';
import {FBBackground, FBBorders} from '@/types/styles';
import React from 'react';
import {View} from 'react-native';
import {ms, ScaledSheet} from 'react-native-size-matters';

// store
import orderStore from '../../store';

// services
import {formatAmountInternational} from '@/utils/general';
import {
  Customer_Order_Item_State_Enum,
  Customer_Order_State_Enum,
} from '@/generated/graphql';

const ItemsTotal: React.FC = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetails();
  const singleOrderDetailsId = orderStore.use.singleOrderDetailsId();

  const calculateDiscount = () => {
    let discount: number = 0;

    if (singleOrderDetails?.state === Customer_Order_State_Enum.Delivered) {
      discount = parseFloat(
        `${singleOrderDetailsId?.invoices[0]?.discount_amount}`,
      );
    } else {
      discount = parseFloat(`${singleOrderDetailsId?.voucher_discount}`);
    }

    return formatAmountInternational(parseFloat(discount.toFixed(2)));
  };

  const calculateTotal = () => {
    let total: number = 0;
    if (singleOrderDetailsId?.state === Customer_Order_State_Enum.Delivered) {
      total = parseFloat(`${singleOrderDetailsId?.invoices[0]?.amount}`);
    } else {
      total = parseFloat(`${singleOrderDetailsId?.amount_paid}`);
    }

    return formatAmountInternational(parseFloat(total.toFixed(2)));
  };

  return (
    <View style={styles.container}>
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
      {singleOrderDetailsId?.invoices?.[0]?.invoiced_items_aggregate ? (
        <View style={[styles.row, styles.borderBottom]}>
          <Text size="sm">Delivered Quantity</Text>
          <Text size="sm">
            {singleOrderDetailsId?.invoices?.[0]?.invoiced_items_aggregate
              ?.aggregate?.sum?.actual_qty
              ? singleOrderDetailsId?.invoices?.[0]?.invoiced_items_aggregate
                  ?.aggregate?.sum?.actual_qty
              : ''}
            <Text size="sm"> ltr</Text>
          </Text>
        </View>
      ) : null}
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">Net Total</Text>
        <Text size="sm">
          {singleOrderDetailsId?.customer_order_items[0]?.state ===
          Customer_Order_Item_State_Enum.Delivered
            ? formatAmountInternational(
                singleOrderDetailsId.invoices[0]?.invoiced_items[0]
                  ?.actual_amount,
              )
            : formatAmountInternational(
                singleOrderDetailsId?.customer_order_items[0]?.actual_amount,
              )}
          {/* {formatAmountInternational(
            singleOrderDetailsId?.customer_order_items[0]?.actual_amount,
          )} */}
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
        <Text size="sm">
          {singleOrderDetailsId?.tax
            ? formatAmountInternational(singleOrderDetails?.tax)
            : 0}
        </Text>
      </View>
      <View style={[styles.row, styles.borderBottom]}>
        <Text size="sm">Total Delivery Fees(Inc. GST)</Text>
        <Text size="sm">
          {singleOrderDetailsId?.delivery_fee
            ? formatAmountInternational(singleOrderDetails?.delivery_fee)
            : 0}
        </Text>
      </View>

      {/* discount */}
      {singleOrderDetailsId?.voucher_discount ? (
        <View style={[styles.row, styles.borderBottom]}>
          <Text size="sm">Discount</Text>
          <Text size="sm">
            - {}
            {calculateDiscount()}
          </Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <Text size="sm" weight="bold">
          Total Amount
        </Text>
        <Text color="primary" weight="bold" size="sm">
          {calculateTotal()}
        </Text>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    height: 'auto',
    padding: ms(20),
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

export default ItemsTotal;
