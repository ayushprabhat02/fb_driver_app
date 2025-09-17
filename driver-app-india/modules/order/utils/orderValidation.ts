/**
 * @file orderValidation.ts
 * @description Order selection validation utilities matching Vue.js Dashboard implementation
 */

import { userStore, orderStore } from '@/globalStore';
import orderService from '@/modules/order/services';

/**
 * Check if any order is in dispensing state
 */
export const hasDispensingOrder = (allDriverOrders: any[]) => {
    return allDriverOrders.some((order: any) => order.state === 'DISPENSING');
};

/**
 * Check if there are any fillup orders
 */
export const hasFillupOrder = (allDriverOrders: any[]) => {
    return allDriverOrders.some((order: any) => order.category === 'FILL_UP');
};

/**
 * Get state color for order status (matching Vue.js implementation)
 */
export const getStateColor = (state: string) => {
    switch (state) {
        case 'DISPENSING':
            return 'bg-red-100 text-red-800 border border-red-200';
        case 'ASSIGNED':
            return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'IN_TRANSIT':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'ARRIVED':
            return 'bg-green-100 text-green-800 border border-green-200';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
};

/**
 * Format date string for display
 */
export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
};

/**
 * Order selection validation logic for Tower Drivers (more permissive)
 * Tower drivers can select any order but still respect loading states and dispensing rules
 */
export const canSelectOrderTowerDriver = (
    order: any,
    allDriverOrders: any[],
    navigationLoading: boolean = false,
    continueOrderLoading: boolean = false,
    refreshLoading: boolean = false,
    startTripLoading: boolean = false,
) => {
    // Rule 0: Disable selection if any button is in loading state
    if (navigationLoading || startTripLoading || continueOrderLoading || refreshLoading) {
        return false;
    }

    // Rule 1: Dispensing orders can always be selected
    if (order.state === 'DISPENSING') {
        return true;
    }

    // Rule 2: If another order is dispensing, this order cannot be selected
    const dispensingOrderExists = hasDispensingOrder(allDriverOrders);
    if (dispensingOrderExists && order.state !== 'DISPENSING') {
        return false;
    }

    // Rule 3: Tower drivers can select any order in active states
    // (No fillup history restrictions, no order priority restrictions)
    if (['ASSIGNED', 'IN_TRANSIT', 'ARRIVED', 'DISPENSING'].includes(order.state)) {
        return true;
    }

    return false;
};

/**
 * Order selection validation logic (matching Vue.js Dashboard implementation)
 * @param order The order to validate
 * @param allDriverOrders All available driver orders
 * @param hasIncompleteFillupHistory Whether there's incomplete fillup history
 * @param navigationLoading Whether navigation is loading
 * @param continueOrderLoading Whether continue order is loading
 * @param refreshLoading Whether refresh is loading
 * @param startTripLoading Whether start trip is loading
 */
export const canSelectOrder = (
    order: any,
    allDriverOrders: any[],
    hasIncompleteFillupHistory: boolean,
    navigationLoading: boolean = false,
    continueOrderLoading: boolean = false,
    refreshLoading: boolean = false,
    startTripLoading: boolean = false,
) => {
    const loggedInUser = userStore.getState().loggedInUser;

    // Rule 0: Disable selection if any button is in loading state
    if (navigationLoading || startTripLoading || continueOrderLoading || refreshLoading) {
        return false;
    }

    // Rule 0.5: If user is not a tower_driver, only allow selection of the first order
    const userFmsCheck = loggedInUser?.[0]?.organization_users?.[0]?.fms_check || [];
    if (!userFmsCheck.includes('tower_driver')) {
        // Find the first order (highest priority) in the orders list
        const firstOrder = allDriverOrders[0];
        if (!firstOrder || order.id !== firstOrder.id) {
            return false;
        }
    }

    // Rule 1: If fillup history incomplete, only allow fillup orders
    if (hasIncompleteFillupHistory && order.category !== 'FILL_UP') {
        return false;
    }

    // Rule 2: If fillup orders exist, prioritize them over delivery orders
    const fillupOrderExists = hasFillupOrder(allDriverOrders);
    if (fillupOrderExists && order.category !== 'FILL_UP') {
        return false;
    }

    // Rule 3: Dispensing orders can always be selected
    if (order.state === 'DISPENSING') {
        return true;
    }

    // Rule 4: If another order is dispensing, this order cannot be selected
    const dispensingOrderExists = hasDispensingOrder(allDriverOrders);
    if (dispensingOrderExists && order.state !== 'DISPENSING') {
        return false;
    }

    // Rule 5: Fillup orders have priority when they exist
    if (fillupOrderExists && order.category === 'FILL_UP') {
        return true;
    }

    // Rule 6: Allow orders in active states (IN_TRANSIT, ARRIVED, DISPENSING don't block each other)
    if (['ASSIGNED', 'IN_TRANSIT', 'ARRIVED', 'DISPENSING'].includes(order.state)) {
        return true;
    }

    return false;
};

/**
 * Update order quantity based on order type (matching Vue.js implementation)
 */
export const updateOrderQuantity = (order: any, orderStore: any) => {
    const quantity = order?.category === 'FILL_UP'
        ? order?.fillup_requests[0]?.quantity_approved || 0
        : order?.customer_order?.customer_order_items[0]?.qty || 0;

    orderStore.getState().setQuantityToBeDispensed(quantity);
};

/**
 * Get payment information from customer order (matching Vue.js implementation)
 */
export const getPaymentInfo = (custOrder: any) => {
    const payment = custOrder?.organizationAddressByShippingAddressId
        ?.organization_address_payment_methods?.[0]?.customer_payment_method
        ?.value;
    const { is_credit_available } = custOrder?.organization_user?.organization || {};

    return {
        isCodOrder: payment === 'COD' && is_credit_available,
        isPodOrder: payment === 'POD' && is_credit_available,
    };
};

/**
 * Check if driver is a tower driver
 */
export const isTowerDriver = () => {
    const loggedInUser = userStore.getState().loggedInUser;
    const userFmsCheck = loggedInUser?.[0]?.organization_users?.[0]?.fms_check || [];
    return userFmsCheck.includes('tower_driver');
};

/**
 * Calculate total quantity dispensed from assets
 */
export const calculateTotalQuantityDispensed = (assets: any[]) => {
    return assets.reduce((total: number, asset: any) => {
        if (asset.quantity_dispensed !== null && asset.quantity_dispensed !== undefined && asset.quantity_dispensed > 0) {
            return total + asset.quantity_dispensed;
        }
        return total;
    }, 0);
};

/**
 * Get completed dispensed assets
 */
export const getCompletedDispensedAssets = (assets: any[]) => {
    return assets.filter((asset: any) => asset.quantity_dispensed && asset.quantity_dispensed > 0);
};

/**
 * Mark order as arrived - calls order service to update order state to ARRIVED
 * Matches Vue.js markOrderArrived functionality
 */
export const markOrderArrived = async (orderId: string) => {
    try {
        console.log('🎯 Marking order as arrived:', orderId);
        // This should call your GraphQL mutation to update order state
        // For now, using the order store's markOrderArrived method
        const success = await orderStore.getState().markOrderArrived(orderId);
        if (success) {
            console.log('✅ Order marked as arrived successfully');
        }
        return success;
    } catch (error) {
        console.error('❌ Error marking order as arrived:', error);
        throw error;
    }
};

/**
 * Fetch current driver order state - refreshes order data from server
 * Matches Vue.js fetchCurrentDriverOrderState functionality
 */
export const fetchCurrentDriverOrderState = async () => {
    try {
        console.log('🔄 Fetching current driver order state');
        // Fetch fresh order data from server
        const currentOrder = orderStore.getState().currentDriverOrder;
        if (!currentOrder?.id) {
            console.warn('⚠️ No current order found');
            return null;
        }
        
        // Refresh the order data through the service
        await orderService.fetchOrderById(currentOrder.id);
        
        console.log('✅ Driver order state refreshed');
        return orderStore.getState().currentDriverOrder;
    } catch (error) {
        console.error('❌ Error fetching driver order state:', error);
        throw error;
    }
};

/**
 * Handle missed intermediate page actions when jumping directly to ChooseAsset
 * This function auto-handles health checks and order state transitions
 * Matches Vue.js handleMissedIntermediateActions functionality
 */
export const handleMissedIntermediateActions = async () => {
    try {
        const currentOrder = orderStore.getState().currentDriverOrder;
        console.log('🔍 handleMissedIntermediateActions called with order:', {
            id: currentOrder?.id,
            orderCode: currentOrder?.customer_order?.order_code,
            state: currentOrder?.state
        });
        
        // Safety check: Don't proceed if we don't have a valid order
        if (!currentOrder?.id) {
            console.warn('⚠️ No current order found in handleMissedIntermediateActions');
            return;
        }
        
        // Tower drivers automatically handle health checks and order progression
        // Health safety checks should ONLY run for ASSIGNED orders
        if (currentOrder?.state === 'ASSIGNED') {
            console.log('📋 Processing ASSIGNED order for health checks:', currentOrder.id);
            
            // Auto-submit health and safety checks for ASSIGNED orders
            // This would typically call health check APIs, for now we'll mark as arrived
            console.log('🎯 About to call markOrderArrived for ASSIGNED order:', currentOrder.id);
            await markOrderArrived(currentOrder.id);
        }
        
        // For IN_TRANSIT orders, only mark as arrived (no safety checks)
        if (currentOrder?.state === 'IN_TRANSIT') {
            console.log('🎯 About to call markOrderArrived for IN_TRANSIT order:', currentOrder.id);
            await markOrderArrived(currentOrder.id);
        }
        
        // For ARRIVED and DISPENSING orders, do nothing - they're already processed
        if (currentOrder?.state === 'ARRIVED' || currentOrder?.state === 'DISPENSING') {
            console.log('✅ Order', currentOrder.id, 'already in', currentOrder.state, 'state, skipping');
        }
        
        console.log('✅ handleMissedIntermediateActions completed for order:', currentOrder.id);
    } catch (err) {
        console.error('Error handling missed intermediate actions:', err);
        // Don't throw error, let the page continue loading
    }
};