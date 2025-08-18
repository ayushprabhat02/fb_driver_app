//types
import {
  Customer_Order_State_Enum,
  Customer_Order_Item_State_Enum,
} from '@/generated/graphql';

export const acceptedOrderStates = Customer_Order_Item_State_Enum;

//  TODO: Pending  status is both delivery & pickup are hide for now
export type DeliveryOrderFilterTypes =
  | 'ALL'
  | 'INPROGRESS'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'UPCOMING';

export type Filter = {
  title: string;
  value: DeliveryOrderFilterTypes;
  states: Customer_Order_State_Enum[];
};

export const deliveryOrderFilter: Filter[] = [
  {
    title: 'All',
    value: 'ALL',
    states: [
      Customer_Order_State_Enum.Delivered,
      Customer_Order_State_Enum.Cancelled,
      Customer_Order_State_Enum.Paid,
      Customer_Order_State_Enum.PayLater,
      // Customer_Order_State_Enum.Confirmed,
    ],
  },

  {
    title: 'In Progress',
    value: 'INPROGRESS',
    states: [
      Customer_Order_State_Enum.Paid,
      Customer_Order_State_Enum.PayLater,
    ],
  },
  {
    title: 'Delivered',
    value: 'DELIVERED',
    states: [Customer_Order_State_Enum.Delivered],
  },
  {
    title: 'Cancelled',
    value: 'CANCELLED',
    states: [Customer_Order_State_Enum.Cancelled],
  },
  {
    title: 'Upcoming',
    value: 'UPCOMING',
    states: [Customer_Order_State_Enum.Confirmed],
  },
];
