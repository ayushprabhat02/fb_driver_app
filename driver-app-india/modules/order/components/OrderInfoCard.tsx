import React from 'react';
import { View, TextStyle } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { Text, Divider } from '@/components';
import { FBBorders } from '@/types/styles';
import { orderStore } from '@/globalStore';

const OrderInfoCard: React.FC = () => {
    const currentFillupOrder = orderStore.use.currentFillupOrder();
    const currentDriverOrder = orderStore.use.currentDriverOrder();
    const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();

    // Get the selected order (fillup order takes priority)
    const selectedOrder = currentFillupOrder || currentDriverOrder;

    if (!selectedOrder) {
        return null;
    }

    // Extract order information based on order type
    const getOrderInfo = () => {
        const isFillupOrder = currentFillupOrder &&
            (currentFillupOrder as any)?.fillup_requests &&
            (currentFillupOrder as any)?.fillup_requests.length > 0;

        if (isFillupOrder) {
            // For fillup orders
            const fillupRequest = (selectedOrder as any).fillup_requests?.[0];
            return {
                orderCode: String((selectedOrder as any).id || 'N/A'),
                indusId: String(fillupRequest?.driver_vehicle?.vehicle?.registration_number || 'N/A'),
                deliveryDate: String((selectedOrder as any).scheduled_start_time || (selectedOrder as any).created_at || 'N/A'),
                quantity: quantityToBeDispensed || 0
            };
        } else {
            // For delivery orders
            const customerOrder = (selectedOrder as any).customer_order;
            const deliveryDate = customerOrder?.customer_order_items?.[0]?.estimate_delivery_date || 'N/A';
            const organizationName = customerOrder?.organization_user?.organization?.name || 'N/A';

            // Calculate quantity
            const items = customerOrder?.customer_order_items || [];
            const totalQty = items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);

            return {
                orderCode: String(customerOrder?.order_code || 'N/A'),
                indusId: String(organizationName),
                deliveryDate: String(deliveryDate),
                quantity: totalQty || quantityToBeDispensed || 0
            };
        }
    };

    const orderInfo = getOrderInfo();

    // Format date
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString || dateString === 'N/A' || typeof dateString !== 'string') return 'N/A';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            });
        } catch {
            return 'N/A';
        }
    };

    // Helper function to truncate long text
    const truncateText = (text: string | undefined | null, maxLength: number) => {
        if (!text || typeof text !== 'string') return 'N/A';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    return (
        <View style={styles.orderListCardContainer}>
            {/* Title */}
            <Text weight="600" size="base">Order Details</Text>

            <Divider height={8} />

            {/* First row: Order Code, Quantity, Delivery Date */}
            <View style={styles.firstRow}>
                <View style={styles.leftSection}>
                    <Text weight="600" size="sm">Code: </Text>
                    <Text weight="600" size="sm">
                        {truncateText(orderInfo.orderCode, 10)}
                    </Text>
                </View>
                <View style={styles.middleSection}>
                    <Text weight="600" size="sm">Qty: </Text>
                    <Text weight="600" size="sm" color="primary">
                        {orderInfo.quantity}L
                    </Text>
                </View>
                <View style={styles.rightSection}>
                    <Text weight="600" size="sm">Date: </Text>
                    <Text weight="600" size="sm">
                        {formatDate(orderInfo.deliveryDate)}
                    </Text>
                </View>
            </View>

            <Divider height={6} />

            {/* Second row: Indus ID (full width for long text) */}
            <View style={styles.flexRow}>
                <Text weight="600" size="sm">Indus ID: </Text>
                <Text weight="400" size="sm" lines={1} style={{ flex: 1 }}>
                    {truncateText(orderInfo.indusId, 35)}
                </Text>
            </View>
        </View>
    );
};

const styles = ScaledSheet.create({
    orderListCardContainer: {
        backgroundColor: 'white',
        padding: '10@s',
        borderRadius: '10@s',
        borderWidth: 1,
        borderColor: FBBorders.secondary,
        marginBottom: '10@vs',
    },
    firstRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    middleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    flexRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
});

export default OrderInfoCard;