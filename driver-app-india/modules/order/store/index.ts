// dependencies
import { create } from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// services - import OrderService for use in actions
import orderService from '../services';

// types
import {
  FetchOrderForDriverNew2Query,
  GetCustomerOrderedAssetsQuery,
  Task_State_Enum,
} from '@/generated/graphql';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

type LoaderTypes =
  | 'totalizerImage'
  | 'quantityImage'
  | 'challanImage'
  | 'technicianImage'
  | 'orderAssets'
  | 'upsertTaskAction' // For API calls to upsert task actions
  | 'updateAssetQty' // For API calls to update asset quantity
  | 'uploadVideo' // For actual file upload operations
  | 'liveStream' // For live streaming operations
  | 'chooseAsset' // For choose asset screen operations
  | 'quantityBottomSheet'; // For quantity bottom sheet operations

type Loaders = {
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
  cancellationReason: undefined;
  cancellationReasonsByReasonType: any;

  // loading states
  loaders: Loaders;

  // bottom sheet
  bottomSheetRefOtp: React.RefObject<BottomSheetModal> | null;

  // selected orders - split by order type
  currentFillupOrder: FetchOrderForDriverNew2Query['task'][0] | null;
  currentDriverOrder: FetchOrderForDriverNew2Query['task'][0] | null;

  // all driver orders (matching Vue.js orderStore)
  allDriverOrders: FetchOrderForDriverNew2Query['task'];

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

  // driver details
  driverDetails: any | null;

  // driver vehicle ID
  driverVehicleId: string | null;

  // current shift data
  driverCurrentShift: any | null;

  // partially filled asset IDs (matching Vue.js)
  partiallyFilledAssetIds: string[];

  // UI state flags
  showRefresh: boolean;
  fetchDriverOrderLoader: boolean;
  isAuthorizedForDispense: boolean;

  // date filter for orders
  selectedDeliveryDate: string;

  // notification state
  showNotification: boolean;
  notificationTitle: string;
  notificationBody: string;

  // verification states
  verificationStarted: boolean;
  dispenseAuthModal: boolean;
  orderPriorityModal: boolean;
  orderPriorityInterval: any;

  // order stats tracking
  totalQuantityDispensed: number;
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

  // Order state management actions (matching Vue.js)
  setCurrentDriverOrder: (order: any) => void;
  setAllDriverOrders: (orders: any[]) => void;
  setCurrentAssetForDispense: (assetDetails: any) => void;
  setIsAuthorizedForDispense: (state: boolean) => void;
  setDispenseCompletedAssets: (assetList: any[]) => void;
  setDriverVehicleId: (id: string) => void;
  setDriverCurrentShift: (shift: any) => void;
  setDriverVehicleDetails: (vehicle: any) => void;
  setDriverDetails: (user: any) => void;
  setPartiallyFilledAssetIds: (ids: string[]) => void;
  setTotalQuantityDispensed: (qty: number) => void;
  setQuantityDispensed: (qty: number) => void;
  setTotalizerAfterReading: (reading: number) => void;
  setTotalizerBeforeReading: (reading: number) => void;
  setSelectedDeliveryDate: (date: string) => void;
  setOrderAssets: (assets: any[]) => void;

  // UI state toggles (matching Vue.js)
  toggleFetchDriverOrderLoader: (state: boolean) => void;
  toggleDispenseAuthModal: (state: boolean) => void;
  toggleVerificationStarted: (state: boolean) => void;
  toggleRefresh: (state: boolean) => void;
  toggleOrderPriorityModal: (state: boolean) => void;
  setOrderPriorityInterval: (interval: any) => void;
  setNotification: (notification: { title?: string; body?: string }) => void;

  // Order state transition methods (matching Vue.js API calls)
  markOrderInTransit: (id: string) => Promise<boolean>;
  markOrderArrived: (id: string) => Promise<boolean>;
  markOrderDispensing: (id: string) => Promise<boolean>;
  markOrderCompleted: (id: string) => Promise<boolean>;
  markOrderCancelRequest: (id: string) => Promise<boolean>;
  addTaskCancellationReason: (id: string, reason: string) => Promise<boolean>;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const orderInitialState: OrderStore = {
  cancellationReason: undefined,
  cancellationReasonsByReasonType: [],

  loaders: {
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

  // bottom sheet
  bottomSheetRefOtp: null,
  currentFillupOrder: null,
  currentDriverOrder: null,

  // all driver orders (matching Vue.js orderStore)
  allDriverOrders: [],

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
  driverDetails: null,
  driverVehicleId: null,
  driverCurrentShift: null,
  partiallyFilledAssetIds: [],
  showRefresh: false,
  fetchDriverOrderLoader: true,
  isAuthorizedForDispense: false,
  selectedDeliveryDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
  showNotification: false,
  notificationTitle: '',
  notificationBody: '',
  verificationStarted: false,
  dispenseAuthModal: false,
  orderPriorityModal: false,
  orderPriorityInterval: null,
  totalQuantityDispensed: 0,

  pendingQuantity: 0,
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
      return { ...state, loaders: { ...state.loaders, [loaderType]: true } };
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return { ...state, loaders: { ...state.loaders, [loaderType]: false } };
    }),

  // reset order store
  resetOrderStore: () =>
    set({
      ...orderInitialState,
      partiallyFilledAssetsArray: [],
      assetsWithUploadedVideos: [],
    }),

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
      partiallyFilledAssetsArray: state.partiallyFilledAssetsArray.includes(
        assetId,
      )
        ? state.partiallyFilledAssetsArray
        : [...state.partiallyFilledAssetsArray, assetId],
    })),

  removePartiallyFilledAsset: (assetId: string) =>
    set(state => ({
      ...state,
      partiallyFilledAssetsArray: state.partiallyFilledAssetsArray.filter(
        id => id !== assetId,
      ),
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
      assetsWithUploadedVideos: state.assetsWithUploadedVideos.filter(
        id => id !== assetId,
      ),
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

  // Order state management actions (matching Vue.js)
  setCurrentDriverOrder: (order: any) =>
    set(state => ({
      ...state,
      currentDriverOrder: order,
    })),

  setAllDriverOrders: (orders: any[]) =>
    set(state => ({
      ...state,
      allDriverOrders: orders,
    })),

  setCurrentAssetForDispense: (assetDetails: any) =>
    set(state => ({
      ...state,
      currentAssetForDispense: { ...assetDetails },
    })),

  setIsAuthorizedForDispense: (authState: boolean) =>
    set(state => ({
      ...state,
      isAuthorizedForDispense: authState,
    })),

  setDispenseCompletedAssets: (assetList: any[]) =>
    set(state => ({
      ...state,
      dispenseCompletedAssets: [...assetList],
    })),

  setDriverVehicleId: (id: string) =>
    set(state => ({
      ...state,
      driverVehicleId: id,
    })),

  setDriverCurrentShift: (shift: any) =>
    set(state => ({
      ...state,
      driverCurrentShift: shift,
    })),

  setDriverDetails: (user: any) =>
    set(state => ({
      ...state,
      driverDetails: user,
    })),

  setPartiallyFilledAssetIds: (ids: string[]) =>
    set(state => ({
      ...state,
      partiallyFilledAssetIds: ids,
    })),

  setTotalQuantityDispensed: (qty: number) =>
    set(state => ({
      ...state,
      totalQuantityDispensed: state.totalQuantityDispensed + qty,
    })),

  setQuantityDispensed: (qty: number) =>
    set(state => ({
      ...state,
      quantityDispensed: qty,
    })),

  setTotalizerAfterReading: (reading: number) =>
    set(state => ({
      ...state,
      totalizerAfterReading: reading,
    })),

  setTotalizerBeforeReading: (reading: number) =>
    set(state => ({
      ...state,
      totalizerBeforeReading: reading,
    })),

  setSelectedDeliveryDate: (date: string) =>
    set(state => ({
      ...state,
      selectedDeliveryDate: date,
    })),

  setOrderAssets: (assets: any[]) =>
    set(state => ({
      ...state,
      orderAssets: assets,
    })),

  // UI state toggles (matching Vue.js)
  toggleFetchDriverOrderLoader: (toggleState: boolean) =>
    set(state => ({
      ...state,
      fetchDriverOrderLoader: toggleState,
    })),

  toggleDispenseAuthModal: (toggleState: boolean) =>
    set(state => ({
      ...state,
      dispenseAuthModal: toggleState,
    })),

  toggleVerificationStarted: (toggleState: boolean) =>
    set(state => ({
      ...state,
      verificationStarted: toggleState,
    })),

  toggleRefresh: (toggleState: boolean) =>
    set(state => ({
      ...state,
      showRefresh: toggleState,
    })),

  toggleOrderPriorityModal: (toggleState: boolean) =>
    set(state => ({
      ...state,
      orderPriorityModal: toggleState,
    })),

  setOrderPriorityInterval: (interval: any) =>
    set(state => ({
      ...state,
      orderPriorityInterval: interval,
    })),

  setNotification: (notification: { title?: string; body?: string }) =>
    set(state => ({
      ...state,
      notificationTitle: notification.title || '',
      notificationBody: notification.body || '',
      showNotification: true,
    })),

  // Order state transition methods (matching Vue.js API calls)
  markOrderInTransit: async (id: string) => {
    try {
      console.log(`🚀 markOrderInTransit called for order ID: ${id}`);
      await orderService.changeTaskState({
        id,
        state: Task_State_Enum.InTransit,
      });
      console.log(`✅ markOrderInTransit completed for order ID: ${id}`);
      return true;
    } catch (err) {
      console.error(`❌ markOrderInTransit failed for order ID: ${id}`, err);
      return false;
    }
  },

  markOrderArrived: async (id: string) => {
    try {
      console.log(`🎯 markOrderArrived called for order ID: ${id}`);
      await orderService.changeTaskState({
        id,
        state: Task_State_Enum.Arrived,
      });
      console.log(`✅ markOrderArrived completed for order ID: ${id}`);
      return true;
    } catch (err) {
      console.error(`❌ markOrderArrived failed for order ID: ${id}`, err);
      return false;
    }
  },

  markOrderDispensing: async (id: string) => {
    try {
      console.log(`⛽ markOrderDispensing called for order ID: ${id}`);
      await orderService.markOrderDispensing({ id });
      console.log(`✅ markOrderDispensing completed for order ID: ${id}`);
      return true;
    } catch (err) {
      console.error(`❌ markOrderDispensing failed for order ID: ${id}`, err);
      return false;
    }
  },

  markOrderCompleted: async (id: string) => {
    try {
      console.log(`✅ markOrderCompleted called for order ID: ${id}`);
      await orderService.markOrderCompleted({ id });
      console.log(`🎉 markOrderCompleted completed for order ID: ${id}`);
      return true;
    } catch (err) {
      console.error(`❌ markOrderCompleted failed for order ID: ${id}`, err);
      return false;
    }
  },

  markOrderCancelRequest: async (id: string) => {
    try {
      console.log(`❌ markOrderCancelRequest called for order ID: ${id}`);
      await orderService.markOrderCancel({ id });
      console.log(`✅ markOrderCancelRequest completed for order ID: ${id}`);
      return true;
    } catch (err) {
      console.error(`❌ markOrderCancelRequest failed for order ID: ${id}`, err);
      return false;
    }
  },

  addTaskCancellationReason: async (id: string, reason: string) => {
    try {
      console.log(`📝 addTaskCancellationReason called for order ID: ${id}`, reason);
      await orderService.addTaskCancellationReason({ id, reason });
      console.log(`✅ addTaskCancellationReason completed for order ID: ${id}`);
      return true;
    } catch (err) {
      console.error(`❌ addTaskCancellationReason failed for order ID: ${id}`, err);
      return false;
    }
  },
}));

export default createSelectors(orderStore);
