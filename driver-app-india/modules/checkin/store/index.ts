// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';
import {GetDriverVehicleDetailsByIdQuery, Vehicle} from '@/generated/graphql';

// types

export type LoaderTypes =
  | 'isDriverVehicleIdLoading'
  | 'isSelfieImageUploading'
  | 'isRefuellerImageUploading'
  | 'isOdometerImageUploading'
  | 'isTotalizerImageUploading';

type Loaders = {
  isDriverVehicleIdLoading: boolean;
  isSelfieImageUploading: boolean;
  isRefuellerImageUploading: boolean;
  isOdometerImageUploading: boolean;
  isTotalizerImageUploading: boolean;
};

type CheckinStore = {
  driverVehicleId: string | null;
  driverVehicleDetails: Vehicle | null;
  selfieImageData: string | null;
  refuellerImageData: string | null;
  odometerImageData: string | null;
  totalizerImageData: string | null;
  isQuantityCheckEnabled: boolean;
  loaders: Loaders;
};

type CheckinActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetCheckinStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const checkinInitialState: CheckinStore = {
  driverVehicleId: null,
  driverVehicleDetails: null,
  selfieImageData: null,
  refuellerImageData: null,
  isQuantityCheckEnabled: false,
  odometerImageData: null,
  totalizerImageData: null,
  loaders: {
    isDriverVehicleIdLoading: false,
    isSelfieImageUploading: false,
    isRefuellerImageUploading: false,
    isOdometerImageUploading: false,
    isTotalizerImageUploading: false,
  },
};

const checkinStore = create<CheckinStore & CheckinActions>(set => ({
  ...checkinInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => ({
      ...state,
      loaders: {...state.loaders, [loaderType]: true},
    })),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => ({
      ...state,
      loaders: {...state.loaders, [loaderType]: false},
    })),

  // reset checkin store
  resetCheckinStore: () => set(checkinInitialState),
}));

export default createSelectors(checkinStore);
