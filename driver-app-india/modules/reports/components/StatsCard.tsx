// dependencies
import React, {useCallback} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {DateTime} from 'luxon';

// components
import {Text, Divider, TextButton} from '@/components';

// types
import {
  Customer_Order_Item,
  Customer_Order_Item_Stateflow,
  CustomerOrderReportQuery,
} from '@/generated/graphql';
import {FBBorders} from '@/types/styles';
import {
  getDeliveredDate,
  getDeliveredQuantity,
  getOrderStatus,
} from '@/utils/general';
import {orderStore} from '@/globalStore';
import {OrderService} from '@/services';
import {useNavigation} from '@react-navigation/native';

// services
import ReportService from '../services';

interface StatsCardProps {
  data: CustomerOrderReportQuery['customer_order_item'];
}

const StatsCard: React.FC<StatsCardProps> = ({data}) => {
  const navigation = useNavigation();
  const showOrderDetails = useCallback(async () => {
    const orderId = data[0]?.customer_order?.id;
    const response = await ReportService.fetchReportById({id: orderId});
    orderStore.setState(state => ({
      ...state,
      singleOrderDetails: response,
    }));
    OrderService.fetchCustomerOrderById({OrderId: orderId});
    OrderService.fetchSalesInvoicePdfQuery({
      object: {customer_order_id: orderId, isPickup: false},
    });
    navigation.navigate('order', {screen: 'order-details', orderId: orderId});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = ({
    item,
  }: {
    item: CustomerOrderReportQuery['customer_order_item'][0];
  }) => {
    return (
      <View style={styles.statsCard}>
        <Text>
          Order Code:{' '}
          <Text size="sm" weight="bold" color="primary">
            {item.customer_order.order_code}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Order Date:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {DateTime.fromISO(item?.customer_order?.order_date)
              ?.setZone('Asia/Kolkata')
              ?.toFormat('dd-MMM-yyyy')}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Delivery Date:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {getDeliveredDate(
              item?.customer_order_item_stateflows as Customer_Order_Item_Stateflow[],
            )}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Product:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {
              item?.product_variation.variation?.product_variations[0]?.product
                ?.name
            }
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Quantity:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {item.actual_qty}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Delivered Quantity:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {getDeliveredQuantity(item as Customer_Order_Item)}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Amount:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {item.actual_amount}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          User:{' '}
          <Text size="sm" weight="bold" color="mediumGray">
            {item?.customer_order.organization_user?.user?.first_name}{' '}
            {item?.customer_order.organization_user?.user?.last_name}
          </Text>
        </Text>
        <Divider height={6} />
        <Text>
          Status:{' '}
          <Text size="sm" weight="bold">
            {getOrderStatus(item?.customer_order?.state)}
          </Text>
        </Text>
        <Divider height={20} />
        <TextButton textSize="sm" onPress={showOrderDetails}>
          View Order Details
        </TextButton>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  statsCard: {
    borderWidth: 0.5,
    borderColor: FBBorders.secondary,
    borderRadius: 5,
    padding: 20,
    marginBottom: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
});

export default StatsCard;
