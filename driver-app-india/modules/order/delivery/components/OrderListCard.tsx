import React from 'react';
import FillupOrderCard from './FillupOrderCard';
import NormalOrderCard from './NormalOrderCard';

interface Props {
  order: any; // type from your driverOrders API
  onRefreshOrders?: () => Promise<void>; // callback to refresh orders
}

const DriverOrderCard: React.FC<Props> = ({order, onRefreshOrders}) => {
  const isFillup = order?.category === 'FILL_UP';

  if (isFillup) {
    return <FillupOrderCard order={order} onRefreshOrders={onRefreshOrders} />;
  }

  return <NormalOrderCard order={order} onRefreshOrders={onRefreshOrders} />;
};

export default DriverOrderCard;
