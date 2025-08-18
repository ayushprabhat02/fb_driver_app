// dependencies
import {StackScreenProps} from '@react-navigation/stack';
import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';

// components
import {Divider, FullScreenLoader, HeaderAvoidingContainer} from '@/components';
import {DetailsComponent} from '@/modules/delivery/components';
import {
  BillingAddress,
  DeliveryAddress,
  ItemsTotal,
  OrderInstruction,
  OrderStatusSteps,
  ShareOrderIdCard,
  SupportCancelButton,
} from '../components';
import CancellationModal from '../components/CancellationModal';

// services
import OrderService from '../../services';
import orderStore from '../../store';

// types
import {Customer_Order_State_Enum, Reason_Type_Enum} from '@/generated/graphql';
import {deliveryStore} from '@/globalStore';
import {OrderStackParamList} from '@/navigator/containers/Order';

export type Props = StackScreenProps<OrderStackParamList, 'order-details'>;

const OrderDetails: React.FC<Props> = () => {
  const singleOrderDetailsId = orderStore.use.singleOrderDetailsId();
  const singleOrderDetails = orderStore.use.singleOrderDetails();
  const orderStateFlow = orderStore.use.currentOrderStateFlow();
  const cancellationReason = orderStore.use.cancellationReason();
  const singleOrderState = orderStore.use.currentOrderStatus();

  const [cancellationComment, setCancellationComment] = useState('');
  const [cancellationModalVisible, setCancellationModalVisible] =
    useState(false);

  const loaders = orderStore.use.loaders();

  const CANCELLABLE_STATES = [
    Customer_Order_State_Enum.Paid,
    Customer_Order_State_Enum.PayLater,
    Customer_Order_State_Enum.Confirmed,
  ];

  const canOrderCancel = () => {
    // if (singleOrderDetailsId) {
    //   return !CANCELLABLE_STATES.includes(singleOrderDetailsId.state);
    // }
    if (singleOrderDetailsId?.customer_order_items[0]?.state === 'CONFIRMED') {
      return false;
    } else return true;
  };

  console.log(canOrderCancel());

  useEffect(() => {
    deliveryStore.setState(state => ({
      ...state,
      currentOrdersInView: [],
    }));

    // added this if condition to check if the order details are undefined
    if (!singleOrderDetails) {
      return;
    }

    OrderService.fetchCustomerOrderStatus({
      customer_order_item_id: singleOrderDetails?.customer_order_items?.[0]?.id,
    });

    OrderService.fetchDeliveryOrderStateFlow({
      customerOrderItemId: singleOrderDetails?.customer_order_items?.[0]?.id,
    });

    OrderService.fetchCancellationReasonsByReasonType({
      reasonType: Reason_Type_Enum.CustomerOrder,
    });
  }, [singleOrderDetails]);

  // to clear the comment when the modal is closed
  useEffect(() => {
    if (!cancellationModalVisible) {
      setCancellationComment('');
    }
  }, [cancellationModalVisible]);

  const handleCancelOrder = async () => {
    // added this if condition to check if the order details are undefined
    if (!singleOrderDetails) {
      return;
    }

    if (CANCELLABLE_STATES.includes(singleOrderDetails.state)) {
      await OrderService.cancelOrderByUser({
        orderId: singleOrderDetails.id,
        cancellation_reason_id: cancellationReason?.id,
      });

      await OrderService.fetchCustomerOrderById({
        OrderId: singleOrderDetails?.id,
      });

      Toast.show({
        type: 'success',
        text1: 'Order Cancelled',
        text2: 'It will take some time to reflect in your account',
        visibilityTime: 4000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Order cannot be cancelled',
      });
    }
    setCancellationModalVisible(false);
    orderStore.setState(state => ({
      ...state,
      cancellationReason: undefined,
    }));
  };

  if (loaders.singleOrderDetails) {
    return (
      <FullScreenLoader showLoader={true} loaderText="Fetching order details" />
    );
  }

  return (
    <HeaderAvoidingContainer paddingHorizontal={0}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 20}}
        showsVerticalScrollIndicator={false}>
        <View style={{paddingHorizontal: 16, marginTop: -12}}>
          {orderStateFlow.length ? (
            <DetailsComponent title={''} cardStyle={{minHeight: 200}}>
              <OrderStatusSteps
                orderStateFlow={singleOrderState}
                orderDetails={singleOrderDetails}
              />
            </DetailsComponent>
          ) : null}
          <Divider height={20} />
          <ShareOrderIdCard />
          <Divider height={20} />
          <ItemsTotal />
          <Divider height={20} />
          <DeliveryAddress />
          <Divider height={20} />
          <BillingAddress />
          <Divider height={20} />
          <OrderInstruction />
          <Divider height={20} />
          <SupportCancelButton
            setCancellationModalVisible={setCancellationModalVisible}
            canOrderCancel={canOrderCancel()}
          />
        </View>
      </ScrollView>
      <Modal
        isVisible={cancellationModalVisible}
        onBackdropPress={() => setCancellationModalVisible(false)}
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={1000}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown">
        <CancellationModal
          comment={cancellationComment}
          onChangeComment={setCancellationComment}
          onCancel={() => setCancellationModalVisible(false)}
          onSubmit={handleCancelOrder}
          loading={loaders.singleOrderDetails}
        />
      </Modal>
    </HeaderAvoidingContainer>
  );
};

export default OrderDetails;
