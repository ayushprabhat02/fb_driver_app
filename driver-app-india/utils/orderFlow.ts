/**
 * @module OrderFlow
 * @description Utilities for order flow management matching Vue.js implementation
 */

import { Alert } from 'react-native';
import orderService from '@/modules/order/services';
import { orderStore, homeStore, locationTrackingStore } from '@/globalStore';

export interface OrderFlowResult {
  success: boolean;
  navigateTo?: string;
  navigateParams?: any;
}

/**
 * @function startTrip
 * @description Main start trip function that handles order state transitions and routing
 * Matches Vue.js startTrip() implementation
 */
export const startTrip = async (order: any): Promise<OrderFlowResult> => {
  if (!order) {
    return { success: false };
  }

  try {
    // Update order quantity before starting trip
    updateOrderQuantity(order);

    // Set current order in store
    orderStore.setState(state => ({
      ...state,
      currentDriverOrder: order.category === 'DELIVERY' ? order : null,
      currentFillupOrder: order.category === 'FILL_UP' ? order : null,
    }));

    // Start location tracking when starting a trip
    try {
      console.log('Starting location tracking for order:', order.id);
      locationTrackingStore.getState().startLiveLocationTracking();
    } catch (trackingError) {
      console.error('Failed to start location tracking:', trackingError);
      // Don't block the trip start if tracking fails
    }

    // Update order state if needed (ASSIGNED → IN_TRANSIT)
    const stateUpdated = await updateOrderState(order);
    if (!stateUpdated) {
      return { success: false };
    }

    // Route based on order category
    const routeResult = routeToOrderHandler(order);
    return {
      success: true,
      navigateTo: routeResult.navigateTo,
      navigateParams: routeResult.navigateParams,
    };
  } catch (error) {
    console.error('Error in startTrip:', error);
    Alert.alert('Error', 'Failed to start trip. Please try again.');
    return { success: false };
  }
};

/**
 * @function updateOrderState
 * @description Updates order state from ASSIGNED to IN_TRANSIT and then immediately to ARRIVED for delivery orders
 * For fillup orders, directly changes to ARRIVED
 */
const updateOrderState = async (order: any): Promise<boolean> => {
  try {
    const isAssigned = order.state === 'ASSIGNED';
    const isInTransit = order.state === 'IN_TRANSIT';

    if (isAssigned) {
      if (order.category === 'FILL_UP') {
        // For fillup orders, directly change state to ARRIVED
        const response = await orderService.markOrderArrived({ id: order.id });

        if (!response) {
          Alert.alert('Error', 'Failed to update order state. Please try again.');
          return false;
        }

        // Update store with ARRIVED state
        const allDriverOrders = homeStore.getState().driverOrders;
        if (allDriverOrders) {
          const updatedOrder = allDriverOrders.find((o: any) => o.id === order.id);
          if (updatedOrder) {
            updatedOrder.state = 'ARRIVED' as any;
            orderStore.setState(state => ({
              ...state,
              currentFillupOrder: updatedOrder,
            }));
          }
        }
      } else {
        // For delivery orders, change state to IN_TRANSIT first, then immediately to ARRIVED
        console.log('🚚 Starting delivery order state transitions: ASSIGNED → IN_TRANSIT → ARRIVED');

        // Step 1: ASSIGNED → IN_TRANSIT
        console.log('📍 Step 1: Updating order to IN_TRANSIT...');
        const transitResponse = await orderService.markOrderInTransit({ id: order.id });
        if (!transitResponse) {
          console.error('❌ Failed to update order to IN_TRANSIT');
          Alert.alert('Error', 'Failed to update order to IN_TRANSIT. Please try again.');
          return false;
        }
        console.log('✅ Order state updated to IN_TRANSIT successfully');

        // Step 2: IN_TRANSIT → ARRIVED (immediately)
        console.log('🎯 Step 2: Updating order to ARRIVED...');
        const arrivedResponse = await orderService.markOrderArrived({ id: order.id });
        if (!arrivedResponse) {
          console.error('❌ Failed to update order to ARRIVED');
          Alert.alert('Error', 'Failed to update order to ARRIVED. Please try again.');
          return false;
        }
        console.log('✅ Order state updated to ARRIVED successfully');

        // Update store with ARRIVED state (final state)
        console.log('🔄 Updating store with ARRIVED state...');
        const allDriverOrders = homeStore.getState().driverOrders;
        if (allDriverOrders) {
          const updatedOrder = allDriverOrders.find((o: any) => o.id === order.id);
          if (updatedOrder) {
            updatedOrder.state = 'ARRIVED' as any;
            orderStore.setState(state => ({
              ...state,
              currentDriverOrder: updatedOrder,
            }));
            console.log('✅ Store updated with ARRIVED state');
          } else {
            console.warn('⚠️ Order not found in driver orders list for store update');
          }
        } else {
          console.warn('⚠️ No driver orders found in store');
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating order state:', error);
    Alert.alert('Error', 'Failed to update order state. Please try again.');
    return false;
  }
};

/**
 * @function updateOrderInStore
 * @description Helper function to update order state in the store
 */
const updateOrderInStore = (order: any, newState: string) => {
  const allDriverOrders = homeStore.getState().driverOrders;
  if (allDriverOrders) {
    const updatedOrder = allDriverOrders.find((o: any) => o.id === order.id);
    if (updatedOrder) {
      updatedOrder.state = newState as any;

      if (order.category === 'DELIVERY') {
        orderStore.setState(state => ({
          ...state,
          currentDriverOrder: updatedOrder,
        }));
      } else if (order.category === 'FILL_UP') {
        orderStore.setState(state => ({
          ...state,
          currentFillupOrder: updatedOrder,
        }));
      }
    }
  }
};

/**
 * @function routeToOrderHandler
 * @description Routes based on order category (DELIVERY vs FILL_UP)
 */
const routeToOrderHandler = (
  order: any,
): { navigateTo: string; navigateParams?: any } => {
  switch (order.category) {
    case 'DELIVERY':
      return handleDelivery(order);
    case 'FILL_UP':
      return handleFillUp(order);
    default:
      // Default to delivery flow
      return handleDelivery(order);
  }
};

/**
 * @function handleDelivery
 * @description Handles delivery order routing logic
 * Routes to choose-asset page when order is in ARRIVED state
 */
const handleDelivery = (
  order: any,
): { navigateTo: string; navigateParams?: any } => {
  const { state } = order;

  // DISPENSING or ARRIVED orders go directly to asset selection
  if (state === 'DISPENSING' || state === 'ARRIVED') {
    return {
      navigateTo: 'order',
      navigateParams: { screen: 'choose-asset' },
    };
  }

  // For all other states, route to choose asset (order will be in ARRIVED state after startTrip)
  return {
    navigateTo: 'order',
    navigateParams: { screen: 'choose-asset' },
  };
};

/**
 * @function handleFillUp
 * @description Handles fillup order routing logic
 * Matches Vue.js handleFillUp() implementation
 */
const handleFillUp = (
  order: any,
): { navigateTo: string; navigateParams?: any } => {
  const { state } = order;

  // DISPENSING/ARRIVED orders go directly to fill asset
  if (state === 'DISPENSING' || state === 'ARRIVED') {
    return {
      navigateTo: 'address',
      navigateParams: { screen: 'fill-asset' },
    };
  }

  // All other states go through health checks first
  // TODO: Implement health checks screen
  // For now, go directly to fill asset
  return {
    navigateTo: 'address',
    navigateParams: { screen: 'fill-asset' },
  };
};

/**
 * @function updateOrderQuantity
 * @description Updates the quantity to be dispensed in the store
 * Matches Vue.js updateOrderQuantity utility
 */
const updateOrderQuantity = (order: any) => {
  if (!order) return;

  let quantity = 0;

  if (order.category === 'DELIVERY') {
    quantity = order?.customer_order?.customer_order_items[0]?.qty || 0;
  } else if (order.category === 'FILL_UP') {
    // For fillup orders, use quantity_approved as specified in Vue.js code
    quantity = order?.fillup_requests?.[0]?.quantity_approved || 0;
  }

  // Use setState directly to update the quantity
  orderStore.setState(state => ({
    ...state,
    quantityToBeDispensed: quantity,
  }));
};

/**
 * @function getPaymentInfo
 * @description Gets payment method information from customer order
 * Matches Vue.js getPaymentInfo utility
 */
export const getPaymentInfo = (custOrder: any) => {
  const payment =
    custOrder?.organizationAddressByShippingAddressId
      ?.organization_address_payment_methods?.[0]?.customer_payment_method
      ?.value;
  const { is_credit_available } =
    custOrder?.organization_user?.organization || {};

  return {
    isCodOrder: payment === 'COD' && is_credit_available,
    isPodOrder: payment === 'POD' && is_credit_available,
  };
};
