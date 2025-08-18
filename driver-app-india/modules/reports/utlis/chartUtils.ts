import {Customer_Order_Item} from '@/generated/graphql';
import {DateTime} from 'luxon';

export type DeliveryReportChartFormat = {
  date: string;
  qty: number;
};

export const formatDeliveryReportData = (data: Customer_Order_Item[]) => {
  const allOrderDays = [
    ...new Set(
      data.map(orderItem =>
        DateTime.fromISO(orderItem.customer_order.order_date).toFormat(
          'yyyy-MM-dd',
        ),
      ),
    ),
  ];

  const deliveredData = data.filter(
    orderItem =>
      orderItem.state === 'DELIVERED' && orderItem.task?.state === 'DELIVERED',
  );

  const orderedQtySummation = allOrderDays.map(date => {
    const totalQty = data.reduce((total, orderItem) => {
      const orderDate = DateTime.fromISO(
        orderItem.customer_order.order_date,
      ).toFormat('yyyy-MM-dd');
      return orderDate === date && orderItem.actual_qty > 0
        ? total + orderItem.actual_qty
        : total;
    }, 0);
    return {date, qty: totalQty};
  });

  const deliveredQtySummation = allOrderDays.map(date => {
    const totalQty = deliveredData.reduce((total, orderItem) => {
      const deliveryDate = DateTime.fromISO(
        orderItem.customer_order.order_date,
      ).toFormat('yyyy-MM-dd');
      if (deliveryDate !== date) return total;

      const deliveredQty =
        orderItem.task?.task_values?.reduce((qtyTotal, taskValue) => {
          return taskValue.key === 'TOTALIZER_AFTER_READING' &&
            taskValue.quantity_dispensed > 0
            ? qtyTotal + taskValue.quantity_dispensed
            : qtyTotal;
        }, 0) || 0;

      return total + deliveredQty;
    }, 0);
    return {date, qty: totalQty};
  });

  // Limit the number of displayed points to a maximum of 7
  const maxPoints = 7;
  const step = Math.ceil(allOrderDays.length / maxPoints);
  const limitedOrderedQtyData = orderedQtySummation.filter(
    (_, index) => index % step === 0,
  );
  const limitedDeliveredQtyData = deliveredQtySummation.filter(
    (_, index) => index % step === 0,
  );

  const formattedData = {
    orderedQtyData: limitedOrderedQtyData.map(item => ({
      x: DateTime.fromFormat(item.date, 'yyyy-MM-dd').toFormat('dd-MM'),
      y: item.qty,
    })),
    deliveredQtyData: limitedDeliveredQtyData.map(item => ({
      x: DateTime.fromFormat(item.date, 'yyyy-MM-dd').toFormat('dd-MM'),
      y: item.qty,
    })),
  };

  return formattedData;
};
