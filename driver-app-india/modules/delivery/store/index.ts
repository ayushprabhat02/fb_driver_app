// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchAddressByTypeQuery,
  CustomerAssetQuery,
  CheckServiceAblilityQuery,
  FetchDeliveryProductsWithPricesQuery,
  FetchDeliveryFeesQuery,
  AddNewBillingAddressMutation,
  LastCustomerOrderQuery,
} from '@/generated/graphql';
import {
  ActiveBottomSheetComponents,
  PaymentMethods,
  Slot,
  SlotTime,
  AssetObjectList,
  BillingAddressBottomSheetView,
  SelectedProduct,
} from '../types';

export type LoaderTypes =
  | 'fetchShippingAddresses'
  | 'createDeliveryOrder'
  | 'fetchCustomerAssets'
  | 'fetchDeliveryFee'
  | 'fetchDeliverySlots'
  | 'paymentSuccess';

type Loaders = {
  fetchShippingAddresses: boolean;
  createDeliveryOrder: boolean;
  fetchCustomerAssets: boolean;
  fetchDeliveryFee: boolean;
  fetchDeliverySlots: boolean;
  paymentSuccess: boolean;
};

type DeliveryStore = {
  // delivery address data - billing and shipping
  selectedShippingAddress:
    | FetchAddressByTypeQuery['organization_address'][0]
    | undefined;

  selectedBillingAddress:
    | FetchAddressByTypeQuery['organization_address'][0]
    | AddNewBillingAddressMutation['insert_organization_address']['returning'][0]
    | undefined;

  billingAddressView: BillingAddressBottomSheetView;

  //delivery assets data
  selectedAssetsForDelivery: string[];
  selectedAssetsForDeliveryDetails:
    | CustomerAssetQuery['customer_asset']
    | LastCustomerOrderQuery['customer_order_stateflow'][0]['customer_order']['customer_order_customer_assets'][0]['customer_asset'][];
  selectedAssetsForDeliveryByType: AssetObjectList[];

  // serviceability partner data
  deliveryPartner: CheckServiceAblilityQuery['partner'][0] | undefined;

  //delivery products
  fetchedDeliveryProducts: FetchDeliveryProductsWithPricesQuery['product_partner_localities_price'];
  selectedDeliveryProducts: SelectedProduct[];

  //fetched delivery dates + slots
  fetchedDeliverySlots: SlotTime[];
  slotsToDisplay: Slot[];
  selectedDate: string;
  selectedSlot: Slot | undefined;
  selectedDateForDisplay: string;
  selectedSlotForDisplay: Slot | undefined;

  // product amount + delivery fee
  deliveryFee: FetchDeliveryFeesQuery['fetchDeliveryFees'] | undefined;
  expressDeliveryFee: number;
  totalAmount: number;
  tax: number;
  selectedPaymentMethod: PaymentMethods;

  // misc
  orderInstructions: string;
  activeBottomSheetComponent: ActiveBottomSheetComponents;
  isOtpRequired: boolean;
  quantity: string;
  isError: string[];
  isPostpaid: boolean;
  deliveryWalletAmountExists: boolean;
  purchaseOrderCode: string;

  // loading states
  loaders: Loaders;
};

type DeliveryActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetDeliveryStore: () => void;
  setActiveBottomSheetComponent: (
    component: ActiveBottomSheetComponents,
  ) => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const deliveryInitialState: DeliveryStore = {
  // address data
  selectedShippingAddress: undefined,
  selectedBillingAddress: undefined,
  billingAddressView: 'select',

  // assets data
  selectedAssetsForDelivery: [],
  selectedAssetsForDeliveryDetails: [],
  selectedAssetsForDeliveryByType: [],

  // serviceability partner data
  deliveryPartner: undefined,

  // delivery products
  fetchedDeliveryProducts: [],
  selectedDeliveryProducts: [],

  // delivery dates & slots
  fetchedDeliverySlots: [],
  slotsToDisplay: [],
  selectedDate: '',
  selectedSlot: undefined,
  selectedDateForDisplay: '',
  selectedSlotForDisplay: undefined,

  // product amount + delivery fee
  totalAmount: 0,
  tax: 0,
  deliveryFee: undefined,
  expressDeliveryFee: 0,
  selectedPaymentMethod: 'fb-wallet',

  // misc
  orderInstructions: '',
  activeBottomSheetComponent: 'AddBillingAddress',
  isOtpRequired: false,
  quantity: '',
  isError: [],
  isPostpaid: false,
  deliveryWalletAmountExists: false,
  purchaseOrderCode: '',

  loaders: {
    fetchShippingAddresses: false,
    createDeliveryOrder: false,
    fetchCustomerAssets: false,
    fetchDeliveryFee: false,
    paymentSuccess: false,
    fetchDeliverySlots: true,
  },
};

const deliveryStore = create<DeliveryStore & DeliveryActions>(set => ({
  ...deliveryInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  setActiveBottomSheetComponent: (component: ActiveBottomSheetComponents) =>
    set(state => ({...state, activeBottomSheetComponent: component})),

  // reset delivery store
  resetDeliveryStore: () => set(deliveryInitialState),
}));

export default createSelectors(deliveryStore);
