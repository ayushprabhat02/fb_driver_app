// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchAddressByTypeQuery,
  FetchAddressByNameQuery,
} from '@/generated/graphql';

type LoaderTypes = 'fetchAddresses';

type Loaders = {
  fetchAddresses: boolean;
};

type AddressStore = {
  shippingAddresses:
    | FetchAddressByTypeQuery['organization_address']
    | []
    | FetchAddressByNameQuery['organization_address'];
  billingAddresses: FetchAddressByTypeQuery['organization_address'];
  currentLocationAddress: any;
  deliveryCountry: any;
  deliveryStates: any;

  // loading states
  loaders: Loaders;
};

type AddressActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetAddressStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const addressInitialState: AddressStore = {
  shippingAddresses: [],
  billingAddresses: [],
  currentLocationAddress: {},
  deliveryCountry: [],
  deliveryStates: [],
  loaders: {
    fetchAddresses: true,
  },
};

const addressStore = create<AddressStore & AddressActions>(set => ({
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

  // reset address store
  resetAddressStore: () => set(addressInitialState),
}));

export default createSelectors(addressStore);
