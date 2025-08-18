// // dependencies
// import {useNavigation} from '@react-navigation/native';
// import {DateTime} from 'luxon';
// import React, {memo, useCallback} from 'react';
// import {View} from 'react-native';
// import {ScaledSheet} from 'react-native-size-matters';

// // components
// import {Divider, Text, TextButton} from '@/components';

// // utils
// import {getOrderStatus} from '@/utils/general';

// // store
// import orderStore from '../../store';

// // types
// import {FetchDeliveryOrderByStateQuery} from '@/generated/graphql';
// import {OrderService} from '@/services';
// import {FBBorders} from '@/types/styles';

// interface Props {
//   order: FetchDeliveryOrderByStateQuery['customer_order'][0];
// }

// const OrderListCard: React.FC<Props> = ({order}) => {
//   const navigation = useNavigation();

//   const startLoader = orderStore.use.startLoader();
//   const stopLoader = orderStore.use.stopLoader();

//   const showOrderDetails = useCallback(() => {
//     // startLoader('fetchInvoices');
//     // startLoader('singleOrderDetails');

//     orderStore.setState(state => ({
//       ...state,
//       singleOrderDetails: order,
//     }));
//     OrderService.fetchCustomerOrderById({OrderId: order.id}).finally(() => {
//       // stopLoader('singleOrderDetails');
//     });

//     OrderService.fetchSalesInvoicePdfQuery({
//       object: {customer_order_id: order.id, isPickup: false},
//     }).finally(() => {
//       // stopLoader('fetchInvoices');
//     });
//     // navigation.navigate('order', {screen: 'order-details', orderId: order.id});
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <View style={styles.orderListCardContainer}>
//       {/* order code */}

//       <OrderDetail detail="Customer Name" value={'Chetan Panwar'} emphasize />

//       <Divider height={6} />
//       <OrderDetail
//         detail="Organization Name"
//         value={'Test Indus Tower'}
//         emphasize
//       />

//       <Divider height={6} />
//       <OrderDetail detail="Mobile" value={'+918221028888'} />

//       <Divider height={6} />
//       <View style={{width: '100%', flexDirection: 'row'}}>
//         <Text size="sm" weight="600">
//           Address:{' '}
//         </Text>
//         <View style={{flexDirection: 'row', flexWrap: 'wrap', maxWidth: '80%'}}>
//           <Text size="sm" lines={1}>
//             TELIAMURA BAZAR, N H NO 8, Shantinagar, Teliamura, Tripura 799205,
//             India, Test business, India, 799205
//           </Text>
//         </View>
//       </View>

//       <Divider height={6} />
//       <View style={{width: '100%', flexDirection: 'row'}}>
//         <Text size="sm" weight="600">
//           Delivery Date:{' '}
//         </Text>
//         <View style={{flexDirection: 'row', flexWrap: 'wrap', maxWidth: '80%'}}>
//           <Text size="sm" lines={1}>
//             15-Jun-2025, 3:00 PM - 6:00 PM
//           </Text>
//         </View>
//       </View>

//       {/* view order btn */}
//       <Divider height={20} />
//       <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
//         <TextButton textSize="sm" onPress={showOrderDetails}>
//           View Order Details
//         </TextButton>
//         {/* {order.otp && (
//           <Text size="sm" weight="bold">
//             OTP: {order?.otp}
//           </Text>
//         )} */}
//       </View>
//     </View>
//   );
// };

// interface OrderDetailProps {
//   detail: string;
//   value: string | number;
//   emphasize?: boolean;
// }

// const OrderDetail: React.FC<OrderDetailProps> = memo(
//   ({detail, value, emphasize = false}) => (
//     <View style={styles.flexRow}>
//       <Text weight="600" size="sm">
//         {detail} :{' '}
//       </Text>
//       <Text
//         weight={emphasize ? '600' : '400'}
//         size="sm"
//         lines={1}
//         style={{width: '50%'}}>
//         {value}
//       </Text>
//     </View>
//   ),
// );

// export default OrderListCard;

// const styles = ScaledSheet.create({
//   orderListCardContainer: {
//     backgroundColor: 'white',
//     padding: '10@s',
//     borderRadius: '10@s',
//     borderWidth: 1,
//     borderColor: FBBorders.secondary,
//   },

//   flexRow: {
//     width: '100%',
//     flexDirection: 'row',
//   },
// });

import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Text from '@/components/Text'; // Your custom Text component

const DriverDashboard: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {/* Order Summary Card */}
        <View style={styles.card}>
          <Text
            size="sm"
            weight="700"
            color="darkGray"
            style={styles.cardTitle}>
            Today's Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text size="xs" weight="600" style={styles.summaryLabel}>
              {/* Intentionally blank to align headers */}
            </Text>
            <Text
              size="xs"
              weight="600"
              color="darkGray"
              style={styles.summaryValue}>
              Count
            </Text>
            <Text
              size="xs"
              weight="600"
              color="darkGray"
              style={styles.summaryValue}>
              Qty
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text size="xs" weight="600" style={styles.summaryLabel}>
              Total Orders
            </Text>
            <Text size="xs" weight="700" style={styles.summaryValue}>
              55
            </Text>
            <Text size="xs" weight="700" style={styles.summaryValue}>
              2240.00 L
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text size="xs" weight="500" style={styles.summaryLabel}>
              Delivered
            </Text>
            <Text size="xs" weight="600" style={styles.summaryValue}>
              0
            </Text>
            <Text size="xs" weight="600" style={styles.summaryValue}>
              0.00 L
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text size="xs" weight="500" style={styles.summaryLabel}>
              Pending
            </Text>
            <Text size="xs" weight="600" style={styles.summaryValue}>
              55
            </Text>
            <Text size="xs" weight="600" style={styles.summaryValue}>
              2240.00 L
            </Text>
          </View>
        </View>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text size="xs" weight="600" color="darkGray">
              Truck Number :
            </Text>
            <Text size="xs" weight="600" style={styles.infoValue}>
              Test FO FB Truck - FO
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text size="xs" weight="600" color="darkGray">
              Order Code :
            </Text>
            <Text
              size="xs"
              weight="600"
              color="primary"
              style={styles.infoValue}>
              583640
            </Text>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text size="xs" weight="600" color="darkGray">
              Customer Name :
            </Text>
            <Text size="xs" weight="500" style={styles.infoValue}>
              Chetan Panwar
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text size="xs" weight="600" color="darkGray">
              Organization Name :
            </Text>
            <Text size="xs" weight="500" style={styles.infoValue}>
              Test Indus Tower
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text size="xs" weight="600" color="darkGray">
              Phone No. :
            </Text>
            <Text
              size="xs"
              weight="500"
              color="primary"
              style={styles.infoValue}>
              +918221028888
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Text size="xs" weight="600" color="darkGray">
              Customer Address :
            </Text>
            <Text
              size="xxs"
              weight="400"
              style={styles.addressText}
              numberOfLines={2}
              ellipsizeMode="tail">
              TELIAMURA BAZAR, N H NO 8, Shantinagar, Teliamura, Tripura 799205,
              India, Test business, India, 799205
            </Text>
          </View>
        </View>

        {/* Delivery Slot Card */}
        <View style={styles.card}>
          <Text
            size="xs"
            weight="600"
            color="darkGray"
            style={styles.deliverySlotLabel}>
            Delivery date & slot:
          </Text>
          <View style={styles.slotContainer}>
            <View style={styles.slotChip}>
              <Text size="xxs" weight="600" color="primary">
                15/07/25
              </Text>
            </View>
            <View style={styles.slotChip}>
              <Text size="xxs" weight="600" color="primary">
                3:00 PM - 6:00 PM
              </Text>
            </View>
          </View>
        </View>

        {/* Product & Quantity Card */}
        <View style={styles.card}>
          <View style={styles.productRow}>
            <Text size="xs" weight="600" color="darkGray">
              Product
            </Text>
            <Text size="xs" weight="600" color="darkGray">
              Quantity (L)
            </Text>
          </View>
          <View style={styles.productRow}>
            <Text size="xs" weight="500">
              Diesel
            </Text>
            <Text size="xs" weight="700" color="primary">
              20
            </Text>
          </View>
          <TouchableOpacity style={styles.assetsButton}>
            <Text
              size="xs"
              weight="600"
              color="primary"
              style={styles.assetsText}>
              View Assets
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Status Card */}
        <View style={styles.card}>
          <View style={styles.paymentRow}>
            <Text size="xs" weight="600" color="darkGray">
              Payment Status :
            </Text>
            <View style={styles.paidBadge}>
              <Text size="xxs" weight="700" color="primary">
                PAID
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Points Card */}
        <View style={styles.card}>
          <Text size="xs" weight="700" style={styles.cardTitle}>
            Safety Points
          </Text>
          <View style={styles.pointsList}>
            <Text size="xxs" weight="400" style={styles.point}>
              • Always insert nozzle properly
            </Text>
            <Text size="xxs" weight="400" style={styles.point}>
              • Choose correct lever/valve
            </Text>
            <Text size="xxs" weight="400" style={styles.point}>
              • Remove nozzle carefully before/after completion
            </Text>
            <Text size="xxs" weight="400" style={styles.point}>
              • Validate fuel type, IDs before dispensing
            </Text>
            <Text
              size="xxs"
              weight="600"
              color="primary"
              style={styles.mandatoryPoint}>
              • Record odometers after RFID/QR capture
            </Text>
            <Text size="xxs" weight="400" style={styles.point}>
              • Provide reason for order cancellation
            </Text>
            <Text size="xxs" weight="400" style={styles.point}>
              • Contact customer via phone icon if needed
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Set to pure white as requested
  },
  scrollView: {
    flex: 1,
    // paddingHorizontal: 12,
    // paddingTop: 12,
  },
  card: {
    backgroundColor: '#ffffff', // Card background is also white
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1.5, // Use a border for separation
    borderColor: '#f0f2f5', // A very subtle border color
    // A minimal shadow to lift the card off the white background
    shadowColor: '#6b7280',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardTitle: {
    marginBottom: 10,
  },

  // Summary Table
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    flex: 2,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    minHeight: 20,
  },
  infoValue: {
    marginLeft: 6,
    flex: 1,
  },

  // Address Section
  addressRow: {
    marginBottom: 6,
  },
  addressText: {
    marginTop: 4,
    lineHeight: 16,
    color: '#374151',
  },

  // Delivery Slot
  deliverySlotLabel: {
    marginBottom: 8,
  },
  slotContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  slotChip: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },

  // Product Section
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assetsButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  assetsText: {
    textDecorationLine: 'underline',
  },

  // Payment Status
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },

  // Safety Points
  pointsList: {
    gap: 3,
  },
  point: {
    lineHeight: 16,
    color: '#4b5563',
  },
  mandatoryPoint: {
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    lineHeight: 16,
  },
});

export default DriverDashboard;
