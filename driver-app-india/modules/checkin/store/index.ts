// dependencies
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// utils
import createSelectors from '@/utils/selectors';
import {GetDriverVehicleDetailsByIdQuery, Vehicle} from '@/generated/graphql';

// types

export type LoaderTypes =
  | 'isDriverVehicleIdLoading'
  | 'isSelfieImageUploading'
  | 'isRefuellerImageUploading'
  | 'isOdometerImageUploading'
  | 'isTotalizerImageUploading'
  | 'isCheckingIn';

type Loaders = {
  isDriverVehicleIdLoading: boolean;
  isSelfieImageUploading: boolean;
  isRefuellerImageUploading: boolean;
  isOdometerImageUploading: boolean;
  isTotalizerImageUploading: boolean;
  isCheckingIn: boolean;
};

type CheckinStore = {
  driverVehicleId: string | null;
  driverVehicleDetails: Vehicle | null;
  selfieImageData: string | null;
  selfieStoreUrl: string | null; // Store the uploaded image URL
  refuellerImageData: string | null;
  odometerImageData: string | null;
  totalizerImageData: string | null;
  isQuantityCheckEnabled: boolean;
  // New explicit completion flag for check-in state
  isCheckedIn: boolean;
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
  selfieStoreUrl: null,
  refuellerImageData: null,
  isQuantityCheckEnabled: false,
  odometerImageData: null,
  totalizerImageData: null,
  // Initially, user is not checked in
  isCheckedIn: false,
  loaders: {
    isDriverVehicleIdLoading: false,
    isSelfieImageUploading: false,
    isRefuellerImageUploading: false,
    isOdometerImageUploading: false,
    isTotalizerImageUploading: false,
    isCheckingIn: false,
  },
};

const checkinStore = create(
  persist<CheckinStore & CheckinActions>(
    set => ({
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
    }),
    {
      name: 'checkin-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        driverVehicleId: state.driverVehicleId,
        // Persist check-in completion status to preserve UX across app reloads
        isCheckedIn: state.isCheckedIn,
      }) as any,
    },
  ),
);

export default createSelectors(checkinStore);
