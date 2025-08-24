// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchAddressByTypeQuery,
  FetchAddressByNameQuery,
} from '@/generated/graphql';

type LoaderTypes = 'fetchAddresses' | 'raiseFillupRequest' | 'fetchFillupRequestById';

type Loaders = {
  fetchAddresses: boolean;
  raiseFillupRequest: boolean;
  fetchFillupRequestById: boolean;
};

type TankTypeDetails = {
  id: string;
  name: string;
  slug: string;
  tank_type_id: string;
  vehicle_tank_type_product_variations: Array<{
    id: string;
    product_variation: {
      id: string;
      price: string;
      product_id: string;
      variation: {
        id: string;
        slug: string;
        variation_type: string;
      };
    };
  }>;
};

type FillupStore = {
  shippingAddresses:
    | FetchAddressByTypeQuery['organization_address']
    | []
    | FetchAddressByNameQuery['organization_address'];
  billingAddresses: FetchAddressByTypeQuery['organization_address'];
  currentLocationAddress: any;
  deliveryCountry: any;
  deliveryStates: any;
  selectedTankType: TankTypeDetails | null;
  fillupRequestDetails: any;

  // loading states
  loaders: Loaders;
};

type AddressActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  setSelectedTankType: (tankType: TankTypeDetails | null) => void;
  setFillupRequestDetails: (details: any) => void;
  resetFillupStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const addressInitialState: FillupStore = {
  shippingAddresses: [],
  billingAddresses: [],
  currentLocationAddress: {},
  deliveryCountry: [],
  deliveryStates: [],
  selectedTankType: null,
  fillupRequestDetails: null,
  loaders: {
    fetchAddresses: true,
    raiseFillupRequest: false,
    fetchFillupRequestById: false,
  },
};

const fillupStore = create<FillupStore & AddressActions>(set => ({
  ...addressInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // tank type actions
  setSelectedTankType: (tankType: TankTypeDetails | null) =>
    set(state => ({
      ...state,
      selectedTankType: tankType,
    })),

  // fillup request details actions
  setFillupRequestDetails: (details: any) =>
    set(state => ({
      ...state,
      fillupRequestDetails: details,
    })),

  // reset address store
  resetFillupStore: () => set(addressInitialState),
}));

export default createSelectors(fillupStore);
