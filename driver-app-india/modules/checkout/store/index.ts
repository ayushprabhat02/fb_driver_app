// dependencies
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// utils
import createSelectors from '@/utils/selectors';

// types
export type LoaderTypes =
  | 'isSelfieImageUploading'
  | 'isRefuellerImageUploading'
  | 'isCheckingOut';

type Loaders = {
  isSelfieImageUploading: boolean;
  isRefuellerImageUploading: boolean;
  isCheckingOut: boolean;
};

type CheckoutStore = {
  selfieImageData: string | null;
  selfieStoreUrl: string | null; // Store the uploaded image URL
  refuellerImageData: string | null;
  refuellerStoreUrl: string | null; // Store the uploaded image URL
  isCheckedOut: boolean;
  loaders: Loaders;
};

type CheckoutActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetCheckoutStore: () => void;
  setSelfieImageData: (data: string | null, url: string | null) => void;
  setRefuellerImageData: (data: string | null, url: string | null) => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const checkoutInitialState: CheckoutStore = {
  selfieImageData: null,
  selfieStoreUrl: null,
  refuellerImageData: null,
  refuellerStoreUrl: null,
  isCheckedOut: false,
  loaders: {
    isSelfieImageUploading: false,
    isRefuellerImageUploading: false,
    isCheckingOut: false,
  },
};

const checkoutStore = create(
  persist<CheckoutStore & CheckoutActions>(
    set => ({
      ...checkoutInitialState,

      // loader actions
      startLoader: (loaderType: LoaderTypes) =>
        set(state => ({
          ...state,
          loaders: { ...state.loaders, [loaderType]: true },
        })),

      stopLoader: (loaderType: LoaderTypes) =>
        set(state => ({
          ...state,
          loaders: { ...state.loaders, [loaderType]: false },
        })),

      // reset checkout store
      resetCheckoutStore: () => set(checkoutInitialState),

      // image data actions
      setSelfieImageData: (data: string | null, url: string | null) =>
        set(state => ({
          ...state,
          selfieImageData: data,
          selfieStoreUrl: url,
        })),

      setRefuellerImageData: (data: string | null, url: string | null) =>
        set(state => ({
          ...state,
          refuellerImageData: data,
          refuellerStoreUrl: url,
        })),
    }),
    {
      name: 'checkout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isCheckedOut: state.isCheckedOut,
      }) as any,
    },
  ),
);

export default createSelectors(checkoutStore);