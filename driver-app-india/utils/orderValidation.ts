import {Alert} from 'react-native';

export interface OrderValidationState {
  hasDispensingOrder: boolean;
  hasIncompleteFillupHistory: boolean;
  hasFillupOrder: boolean;
}

export const getOrderValidationState = (
  driverOrders: any[],
  fillupHistory: any[],
): OrderValidationState => {
  const hasDispensingOrder = driverOrders?.some(
    (order: any) => order.state === 'DISPENSING',
  );

  const hasIncompleteFillupHistory = fillupHistory?.some(
    (item: any) => item.state !== 'COMPLETE' && item.state !== 'REJECTED',
  );

  const hasFillupOrder = driverOrders?.some(
    (order: any) => order.category === 'FILL_UP',
  );

  return {
    hasDispensingOrder,
    hasIncompleteFillupHistory,
    hasFillupOrder,
  };
};

export const canSelectOrder = (
  order: any,
  validationState: OrderValidationState,
  isLoading: boolean = false,
  driverOrders: any[] = [],
  userRole: string | null = null,
): boolean => {
  // Rule 0: Disable selection if any loading state
  if (isLoading) {
    return false;
  }

  // Rule 0.5: If user is not a tower_driver, only allow selection of the first order
  // (matching Vue.js implementation for normal drivers)
  if (userRole && userRole !== 'tower_driver') {
    const firstOrder = driverOrders[0];
    if (!firstOrder || order.id !== firstOrder.id) {
      return false;
    }
  }

  // Rule 1: If fillup history incomplete, only allow fillup orders
  if (
    validationState.hasIncompleteFillupHistory &&
    order.category !== 'FILL_UP'
  ) {
    return false;
  }

  // Rule 2: If fillup orders exist, prioritize them over delivery orders
  if (validationState.hasFillupOrder && order.category !== 'FILL_UP') {
    return false;
  }

  // Rule 3: Dispensing orders can always be selected
  if (order.state === 'DISPENSING') {
    return true;
  }

  // Rule 4: If another order is dispensing, this order cannot be selected
  if (validationState.hasDispensingOrder && order.state !== 'DISPENSING') {
    return false;
  }

  // Rule 5: Fillup orders have priority when they exist
  if (validationState.hasFillupOrder && order.category === 'FILL_UP') {
    return true;
  }

  // Rule 6: Allow orders in active states
  if (
    ['ASSIGNED', 'IN_TRANSIT', 'ARRIVED', 'DISPENSING'].includes(order.state)
  ) {
    return true;
  }

  return false;
};

export const showOrderSelectionAlert = (
  order: any,
  validationState: OrderValidationState,
  userRole: string | null = null,
  driverOrders: any[] = [],
): void => {
  let title = 'Cannot Select Order';
  let message = '';

  // Check for normal driver restriction first
  if (userRole && userRole !== 'tower_driver') {
    const firstOrder = driverOrders[0];
    if (firstOrder && order.id !== firstOrder.id) {
      title = 'Complete First Order First';
      message =
        'You must complete the first order in the list before selecting other orders.';
      Alert.alert(title, message, [
        {
          text: 'OK',
          style: 'default',
        },
      ]);
      return;
    }
  }

  if (validationState.hasDispensingOrder && order.state !== 'DISPENSING') {
    title = 'Complete Dispensing Order First';
    message =
      'You must complete the order in dispensing state before selecting a new order.';
  } else if (
    validationState.hasIncompleteFillupHistory &&
    order.category !== 'FILL_UP'
  ) {
    title = 'Complete Fillup History First';
    message =
      'You must complete all incomplete fillup orders before selecting delivery orders.';
  } else if (validationState.hasFillupOrder && order.category !== 'FILL_UP') {
    title = 'Fillup Orders Have Priority';
    message = 'Complete fillup orders before selecting delivery orders.';
  } else {
    message = 'This order cannot be selected at the moment.';
  }

  Alert.alert(title, message, [
    {
      text: 'OK',
      style: 'default',
    },
  ]);
};
