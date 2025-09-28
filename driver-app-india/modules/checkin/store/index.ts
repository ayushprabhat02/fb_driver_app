// dependencies
import { create } from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import { Vehicle } from '@/generated/graphql';

type LoaderTypes =
  | 'isRefuellerImageUploading'
  | 'isOdometerImageUploading'
  | 'isTotalizerImageUploading'
  | 'isCheckingIn'
  | 'isDriverVehicleIdLoading';

type Loaders = {
  isRefuellerImageUploading: boolean;
  isOdometerImageUploading: boolean;
  isTotalizerImageUploading: boolean;
  isCheckingIn: boolean;
  isDriverVehicleIdLoading: boolean;
};

// Define the shift schedule type based on the GraphQL query
type ShiftSchedule = {
  __typename?: "shift_schedule";
  driver_vehicle_id?: any;
  end_time: any;
  id: any;
  start_time: any;
  driver_vehicle?: {
    __typename?: "driver_vehicle";
    driver_id: any;
    id: any;
    status?: any;
    state?: any;
  } | null;
};

type CheckinStore = {
  driverVehicleId: string | null;
  driverVehicleDetails: Vehicle | null;
  driverDetails: any | null;
  shiftSchedule: ShiftSchedule | null;
  isCheckedIn: boolean;
  isQuantityCheckEnabled: boolean;

  // refueller image data
  refuellerImageData: string | null;
  refuellerStoreUrl: string | null;

  // odometer image data
  odometerImageData: string | null;

  // totalizer image data
  totalizerImageData: string | null;

  // loading states
  loaders: Loaders;
};

type CheckinActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetCheckinStore: () => void;
  setShiftSchedule: (schedule: ShiftSchedule | null) => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const checkinInitialState: CheckinStore = {
  driverVehicleId: null,
  driverVehicleDetails: null,
  driverDetails: null,
  shiftSchedule: null,
  isCheckedIn: false,
  isQuantityCheckEnabled: false,

  // refueller image data initial state
  refuellerImageData: null,
  refuellerStoreUrl: null,

  // odometer image data initial state
  odometerImageData: null,

  // totalizer image data initial state
  totalizerImageData: null,

  // loading states
  loaders: {
    isRefuellerImageUploading: false,
    isOdometerImageUploading: false,
    isTotalizerImageUploading: false,
    isCheckingIn: false,
    isDriverVehicleIdLoading: false,
  },
};

const checkinStore = create<CheckinStore & CheckinActions>(set => ({
  ...checkinInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      console.log(`Starting loader: ${loaderType}`);
      return { ...state, loaders: { ...state.loaders, [loaderType]: true } };
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      console.log(`Stopping loader: ${loaderType}`);
      return { ...state, loaders: { ...state.loaders, [loaderType]: false } };
    }),

  // reset checkin store
  resetCheckinStore: () => {
    console.log('Resetting checkin store');
    set(checkinInitialState);
  },

  // set shift schedule
  setShiftSchedule: (schedule: ShiftSchedule | null) =>
    set(state => {
      console.log('Setting shift schedule:', schedule);
      return { ...state, shiftSchedule: schedule };
    }),
}));

// Add a listener to log when driverVehicleId changes
const unsub = checkinStore.subscribe((state, prevState) => {
  if (state.driverVehicleId !== prevState.driverVehicleId) {
    console.log('driverVehicleId changed:', {
      old: prevState.driverVehicleId,
      new: state.driverVehicleId
    });
  }
});

export default createSelectors(checkinStore);