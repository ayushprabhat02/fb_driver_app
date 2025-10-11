// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchOrderForDriverNew2Query,
  GetCustomerOrderedAssetsQuery,
} from '@/generated/graphql';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

type LoaderTypes =
  | 'totalizerImage'
  | 'quantityImage'
  | 'challanImage'
  | 'technicianImage'
  | 'imapImage'
  | 'orderAssets'
  | 'upsertTaskAction' // For API calls to upsert task actions
  | 'updateAssetQty' // For API calls to update asset quantity
  | 'uploadVideo' // For actual file upload operations
  | 'liveStream' // For live streaming operations
  | 'chooseAsset' // For choose asset screen operations
  | 'quantityBottomSheet' // For quantity bottom sheet operations
  | 'cancelFillupOrder' // For fillup order cancellation
  | 'fetchCancellationReasons' // For fetching cancellation reasons
  | 'updateOrderState'; // For updating order state

type Loaders = {
  totalizerImage: boolean;
  quantityImage: boolean;
  challanImage: boolean;
  technicianImage: boolean;
  imapImage: boolean;
  orderAssets: boolean;
  upsertTaskAction: boolean;
  updateAssetQty: boolean;
  uploadVideo: boolean;
  liveStream: boolean;
  chooseAsset: boolean;
  quantityBottomSheet: boolean;
  cancelFillupOrder: boolean;
  fetchCancellationReasons: boolean;
  updateOrderState: boolean;
};

type FillupOrderStateFlow = {
  state: string;
  timestamp: string;
  description: string;
};

type CancellationReason = {
  id: string;
  reason: string;
  type: string;
};

type OrderStore = {
  cancellationReason: undefined;
  cancellationReasonsByReasonType: any;

  // Enhanced fillup order management (Vue-inspired)
  fillupOrderStateFlow: FillupOrderStateFlow[];
  fillupCancellationReasons: CancellationReason[];
  selectedCancellationReason: string;
  cancellationComment: string;
  isCancellationModalOpen: boolean;
  isOrderDetailsModalOpen: boolean;

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
  imapImageData: string | null;
  challanUploadedUrl: string | null;
  technicianUploadedUrl: string | null;
  imapUploadedUrl: string | null;
  totalizerUploadedUrl: string | null;

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

  // assets with interrupted recording sessions (paused/crashed during recording)
  assetsWithInterruptedRecording: string[];

  pendingQuantity: number;

  // fuel dispensed till now - tracks total quantity dispensed across all sessions
  fuelDispensedTillNow: number;

  // quantity to be dispensed - target quantity for current dispensing session
  quantityToBeDispensed: number;

  // driver vehicle details
  driverVehicleDetails: any | null;

  // OCR extracted data from maintenance form
  ocrData: any | null;
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
  // interrupted recording management
  addAssetWithInterruptedRecording: (assetId: string) => void;
  removeAssetWithInterruptedRecording: (assetId: string) => void;

  // quantity tracking actions
  setFuelDispensedTillNow: (quantity: number) => void;
  setQuantityToBeDispensed: (quantity: number) => void;

  // Enhanced fillup order management actions (Vue-inspired)
  setFillupOrderStateFlow: (stateFlow: FillupOrderStateFlow[]) => void;
  setFillupCancellationReasons: (reasons: CancellationReason[]) => void;
  setSelectedCancellationReason: (reason: string) => void;
  setCancellationComment: (comment: string) => void;
  setCancellationModalOpen: (isOpen: boolean) => void;
  setOrderDetailsModalOpen: (isOpen: boolean) => void;
  updateFillupOrderState: (newState: string) => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const orderInitialState: OrderStore = {
  cancellationReason: undefined,
  cancellationReasonsByReasonType: [],

  // Enhanced fillup order management initial state
  fillupOrderStateFlow: [],
  fillupCancellationReasons: [],
  selectedCancellationReason: '',
  cancellationComment: '',
  isCancellationModalOpen: false,
  isOrderDetailsModalOpen: false,

  loaders: {
    totalizerImage: false,
    quantityImage: false,
    challanImage: false,
    technicianImage: false,
    imapImage: false,
    orderAssets: false,
    upsertTaskAction: false,
    updateAssetQty: false,
    uploadVideo: false,
    liveStream: false,
    chooseAsset: false,
    quantityBottomSheet: false,
    cancelFillupOrder: false,
    fetchCancellationReasons: false,
    updateOrderState: false,
  },

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
  imapImageData: null,
  challanUploadedUrl: null,
  technicianUploadedUrl: null,
  imapUploadedUrl: null,
  totalizerUploadedUrl: null,

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

  // assets with interrupted recording initial state
  assetsWithInterruptedRecording: [],

  // missing properties initial values
  fuelDispensedTillNow: 0,
  quantityToBeDispensed: 0,
  driverVehicleDetails: null,

  pendingQuantity: 0,

  // OCR data initial state
  ocrData: null,
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
  resetOrderStore: () =>
    set({
      ...orderInitialState,
      partiallyFilledAssetsArray: [],
      assetsWithUploadedVideos: [],
      assetsWithInterruptedRecording: [],
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

  // interrupted recording management
  addAssetWithInterruptedRecording: (assetId: string) =>
    set(state => ({
      ...state,
      assetsWithInterruptedRecording: state.assetsWithInterruptedRecording.includes(assetId)
        ? state.assetsWithInterruptedRecording
        : [...state.assetsWithInterruptedRecording, assetId],
    })),

  removeAssetWithInterruptedRecording: (assetId: string) =>
    set(state => ({
      ...state,
      assetsWithInterruptedRecording: state.assetsWithInterruptedRecording.filter(
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

  // Enhanced fillup order management action implementations (Vue-inspired)
  setFillupOrderStateFlow: (stateFlow: FillupOrderStateFlow[]) =>
    set(state => ({
      ...state,
      fillupOrderStateFlow: stateFlow,
    })),

  setFillupCancellationReasons: (reasons: CancellationReason[]) =>
    set(state => ({
      ...state,
      fillupCancellationReasons: reasons,
    })),

  setSelectedCancellationReason: (reason: string) =>
    set(state => ({
      ...state,
      selectedCancellationReason: reason,
    })),

  setCancellationComment: (comment: string) =>
    set(state => ({
      ...state,
      cancellationComment: comment,
    })),

  setCancellationModalOpen: (isOpen: boolean) =>
    set(state => ({
      ...state,
      isCancellationModalOpen: isOpen,
    })),

  setOrderDetailsModalOpen: (isOpen: boolean) =>
    set(state => ({
      ...state,
      isOrderDetailsModalOpen: isOpen,
    })),

  updateFillupOrderState: (newState: string) =>
    set(state => ({
      ...state,
      currentFillupOrder: state.currentFillupOrder
        ? { ...state.currentFillupOrder, state: newState as any }
        : null,
    })),
}));

export default createSelectors(orderStore);
