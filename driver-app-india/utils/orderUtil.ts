import { orderStore } from "@/globalStore";

export const updateOrderQuantity = (order: any) => {
	const quantity = order?.category === "FILL_UP" 
		? order?.fillup_requests[0]?.quantity_approved || 0
		: order?.customer_order?.customer_order_items[0]?.qty || 0;
	orderStore.setState(state => ({
		...state,
		quantityDispensed: quantity,
	}))
    console.log('--quantity updated',quantity)
};
