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
  FetchOrderForDriverIncompleteQuery,
  GetCustomerOrderedAssetsQuery,
  FetchOrderForDriverNew2Query,
} from '@/generated/graphql';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

type LoaderTypes =
  | 'currentOrdersInView'
  | 'singleOrderDetails'
  | 'fetchInvoices'
  | 'verifyPlacedOrderOtp'
  | 'totalizerImage'
  | 'quantityImage'
  | 'challanImage'
  | 'technicianImage'
  | 'orderAssets'
  | 'upsertTaskAction'     // For API calls to upsert task actions
  | 'updateAssetQty'      // For API calls to update asset quantity
  | 'uploadVideo'         // For actual file upload operations
  | 'liveStream'          // For live streaming operations
  | 'chooseAsset'         // For choose asset screen operations
  | 'quantityBottomSheet'; // For quantity bottom sheet operations

type Loaders = {
  currentOrdersInView: boolean;
  singleOrderDetails: boolean;
  fetchInvoices: boolean;
  verifyPlacedOrderOtp: boolean;
  totalizerImage: boolean;
  quantityImage: boolean;
  challanImage: boolean;
  technicianImage: boolean;
  orderAssets: boolean;
  upsertTaskAction: boolean;
  updateAssetQty: boolean;
  uploadVideo: boolean;
  liveStream: boolean;
  chooseAsset: boolean;
  quantityBottomSheet: boolean;
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

  // selected orders - split by order type
  currentFillupOrder: FetchOrderForDriverNew2Query['task'][0] | null;
  currentDriverOrder: FetchOrderForDriverNew2Query['task'][0] | null;

  // fillup image data
  totalizerImageData: string | null;
  quantityImageData: string | null;
  totalizerReading: string;
  quantityDispensed: number;
  
  // buddy challan image data
  challanImageData: string | null;
  technicianImageData: string | null;
  challanUploadedUrl: string | null;
  technicianUploadedUrl: string | null;
  
  // totalizer readings
  totalizerBeforeReading: number;
  totalizerAfterReading: number;

  // order assets
  orderAssets: GetCustomerOrderedAssetsQuery['customer_order_customer_asset'];

  // current asset for dispense (for tower driver streaming)
  currentAssetForDispense: any | null;

  // completed dispensed assets for delivery challan
  dispenseCompletedAssets: any[] | null;

  // partially filled assets array to track assets that have some quantity dispensed but not completed
  partiallyFilledAssetsArray: string[];

  // assets with uploaded videos but no quantity dispensed yet
  assetsWithUploadedVideos: string[];

  pendingQuantity: number;

  // fuel dispensed till now - tracks total quantity dispensed across all sessions
  fuelDispensedTillNow: number;

  // quantity to be dispensed - target quantity for current dispensing session
  quantityToBeDispensed: number;

  // driver vehicle details
  driverVehicleDetails: any | null;
};

type OrderActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetOrderStore: () => void;
  resetOrderPagination: () => void;
  // bottom sheet
  setBottomSheetRefOtp: (ref: React.RefObject<BottomSheetModal>) => void;
  // partially filled assets management
  addPartiallyFilledAsset: (assetId: string) => void;
  removePartiallyFilledAsset: (assetId: string) => void;
  // video upload status management
  addAssetWithUploadedVideo: (assetId: string) => void;
  removeAssetWithUploadedVideo: (assetId: string) => void;

  // quantity tracking actions
  setFuelDispensedTillNow: (quantity: number) => void;
  setQuantityToBeDispensed: (quantity: number) => void;
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
    totalizerImage: false,
    quantityImage: false,
    challanImage: false,
    technicianImage: false,
    orderAssets: false,
    upsertTaskAction: false,
    updateAssetQty: false,
    uploadVideo: false,
    liveStream: false,
    chooseAsset: false,
    quantityBottomSheet: false,
  },
  currentOrderStatus: undefined,
  upcomingOrders: undefined,
  placeOrderOtp: '',
  upcomingOrdersVerify: undefined,

  // bottom sheet
  bottomSheetRefOtp: null,
  currentFillupOrder: null,
  currentDriverOrder: null,

  // fillup image data initial state
  totalizerImageData: null,
  quantityImageData: null,
  totalizerReading: '',
  quantityDispensed: 0,
  
  // buddy challan image data initial state
  challanImageData: null,
  technicianImageData: null,
  challanUploadedUrl: null,
  technicianUploadedUrl: null,
  
  // totalizer readings initial state
  totalizerBeforeReading: 0,
  totalizerAfterReading: 0,

  // order assets
  orderAssets: [],

  // current asset for dispense
  currentAssetForDispense: null,

  // dispensed assets for delivery challan
  dispenseCompletedAssets: null,
  
  // partially filled assets array initial state
  partiallyFilledAssetsArray: [],
  
  // assets with uploaded videos initial state
  assetsWithUploadedVideos: [],
  
  // missing properties initial values
  fuelDispensedTillNow: 0,
  quantityToBeDispensed: 0,
  driverVehicleDetails: null,

  pendingQuantity: 0
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
  resetOrderStore: () => set({...orderInitialState, partiallyFilledAssetsArray: [], assetsWithUploadedVideos: []}),

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

  // partially filled assets management
  addPartiallyFilledAsset: (assetId: string) =>
    set(state => ({
      ...state,
      partiallyFilledAssetsArray: state.partiallyFilledAssetsArray.includes(assetId)
        ? state.partiallyFilledAssetsArray
        : [...state.partiallyFilledAssetsArray, assetId],
    })),

  removePartiallyFilledAsset: (assetId: string) =>
    set(state => ({
      ...state,
      partiallyFilledAssetsArray: state.partiallyFilledAssetsArray.filter(id => id !== assetId),
    })),

  // video upload status management
  addAssetWithUploadedVideo: (assetId: string) =>
    set(state => ({
      ...state,
      assetsWithUploadedVideos: state.assetsWithUploadedVideos.includes(assetId)
        ? state.assetsWithUploadedVideos
        : [...state.assetsWithUploadedVideos, assetId],
    })),

  removeAssetWithUploadedVideo: (assetId: string) =>
    set(state => ({
      ...state,
      assetsWithUploadedVideos: state.assetsWithUploadedVideos.filter(id => id !== assetId),
    })),

  // quantity tracking actions
  setFuelDispensedTillNow: (quantity: number) =>
    set(state => ({
      ...state,
      fuelDispensedTillNow: quantity,
    })),

  setQuantityToBeDispensed: (quantity: number) =>
    set(state => ({
      ...state,
      quantityToBeDispensed: quantity,
    })),

  setDriverVehicleDetails: (details: any) =>
    set(state => ({
      ...state,
      driverVehicleDetails: details,
    })),

}));

export default createSelectors(orderStore);
