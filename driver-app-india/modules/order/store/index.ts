// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchCancellationReasonsByReasonTypeQuery,
  FetchDeliveryOrderByIdQuery,
  FetchCustomerOrderByIdQuery,
  FetchDeliveryOrderByStateQuery,
  FetchDeliveryOrderStateflowQuery,
  Customer_Order,
  FetchOrderItemStatusQuery,
  FetchOrganizationUpcomingOrdersQuery,
  VerifyPlacedOrderOtpQuery,
} from '@/generated/graphql';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

type LoaderTypes =
  | 'currentOrdersInView'
  | 'singleOrderDetails'
  | 'fetchInvoices'
  | 'verifyPlacedOrderOtp';

type Loaders = {
  currentOrdersInView: boolean;
  singleOrderDetails: boolean;
  fetchInvoices: boolean;
  verifyPlacedOrderOtp: boolean;
};

type OrderStore = {
  currentOrdersInView: FetchDeliveryOrderByStateQuery['customer_order'];
  currentOrdersInViewClone: FetchDeliveryOrderByStateQuery['customer_order'];
  currentOrdersInViewOffset: number;
  currentOrdersInViewCnt: number;
  allOrdersCount: number;
  currentOrdersInViewHasMoreOrders: boolean;
  singleOrderDetails:
    | FetchDeliveryOrderByStateQuery['customer_order'][0]
    | FetchDeliveryOrderByIdQuery['customer_order'][0]
    | Customer_Order
    | undefined;
  currentOrderStateFlow: FetchDeliveryOrderStateflowQuery['customer_order_item_stateflow'];
  currentOrderStatus: FetchOrderItemStatusQuery['fetchOrderItemStatus'];

  // cancellation
  cancellationReasonsByReasonType: FetchCancellationReasonsByReasonTypeQuery['reasons'];
  cancellationReason:
    | FetchCancellationReasonsByReasonTypeQuery['reasons'][0]
    | undefined;

  // upcoming orders
  upcomingOrders: FetchOrganizationUpcomingOrdersQuery['fetchOrganizationUpcomingOrdersOtp'];
  placeOrderOtp: string;
  upcomingOrdersVerify: any;

  singleOrderDetailsId:
    | FetchCustomerOrderByIdQuery['customer_order'][0]
    | undefined;
  fetchInvoices: string;
  // loading states
  loaders: Loaders;

  // bottom sheet
  bottomSheetRefOtp: React.RefObject<BottomSheetModal> | null;
  
  // selected order
  selectedOrder: FetchDeliveryOrderByStateQuery['customer_order'][0] | null;
};

type OrderActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetOrderStore: () => void;
  resetOrderPagination: () => void;
  // bottom sheet
  setBottomSheetRefOtp: (ref: React.RefObject<BottomSheetModal>) => void;
  
  // selected order
  setSelectedOrder: (order: FetchDeliveryOrderByStateQuery['customer_order'][0] | null) => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const orderInitialState: OrderStore = {
  currentOrdersInView: [],
  currentOrdersInViewClone: [],
  allOrdersCount: 0,
  currentOrdersInViewOffset: 0,
  currentOrdersInViewCnt: 0,
  currentOrdersInViewHasMoreOrders: false,
  singleOrderDetails: undefined,
  currentOrderStateFlow: [],
  cancellationReasonsByReasonType: [],
  cancellationReason: undefined,
  singleOrderDetailsId: undefined,
  fetchInvoices: '',
  // loading states
  loaders: {
    currentOrdersInView: false,
    singleOrderDetails: false,
    fetchInvoices: true,
    verifyPlacedOrderOtp: false,
  },
  currentOrderStatus: undefined,
  upcomingOrders: undefined,
  placeOrderOtp: '',
  upcomingOrdersVerify: undefined,

  // bottom sheet
  bottomSheetRefOtp: null,
  selectedOrder: null,
};

const orderPaginationInitialState = {
  currentOrdersInView: [],
  currentOrdersInViewOffset: 0,
  currentOrdersInViewCnt: 0,
  currentOrdersInViewHasMoreOrders: false,
};

const orderStore = create<OrderStore & OrderActions>(set => ({
  ...orderInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // reset order store
  resetOrderStore: () => set(orderInitialState),

  // reset pagination
  resetOrderPagination: () =>
    set(state => ({
      ...state,
      ...orderPaginationInitialState,
    })),

  // bottom sheet ref + actions
  setBottomSheetRefOtp: ref =>
    set(() => ({
      bottomSheetRefOtp: ref,
    })),
    
  setSelectedOrder: order =>
    set(() => ({
      selectedOrder: order,
    })),
}));

export default createSelectors(orderStore);
