import React from 'react';
import FillupOrderCard from './FillupOrderCard';
import NormalOrderCard from './NormalOrderCard';

interface Props {
  order: any; // type from your driverOrders API
}

const DriverOrderCard: React.FC<Props> = ({order}) => {
  const isFillup = order?.category === 'FILL_UP';

  if (isFillup) {
    return <FillupOrderCard order={order} />;
  }

  return <NormalOrderCard order={order} />;
};

export default DriverOrderCard;
