// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {Coords} from '@/types/custom';
import {AddressComponents} from '../types';
import {
  CheckServiceAblilityQuery,
  FetchAllCountriesQuery,
} from '@/generated/graphql';

type LoaderTypes = 'fetchCoords' | 'addNewAddress';

type Loaders = {
  fetchCoords: boolean;
  addNewAddress: boolean;
};

type LocationStore = {
  currentCoords: Coords | null;
  addressComponents: AddressComponents | null;
  statesList: FetchAllCountriesQuery['country'][0]['states'];
  citiesList: FetchAllCountriesQuery['country'][0]['states'][0]['cities'];
  selectedState: FetchAllCountriesQuery['country'][0]['states'][0] | undefined;
  selectedCity:
    | FetchAllCountriesQuery['country'][0]['states'][0]['cities'][0]
    | undefined;

  addressType: 'home' | 'work' | 'other';
  postalCode: string;
  selectedCountry: FetchAllCountriesQuery['country'][0] | undefined;
  addressLine: string;
  deliveryPartner: CheckServiceAblilityQuery['partner'][0] | undefined;
  isServiceable: boolean;
  addressNote: string;

  // loading states
  loaders: Loaders;
};

type LoaderActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetLocationStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const locationInitialState: LocationStore = {
  currentCoords: null,
  addressComponents: null,
  statesList: [],
  citiesList: [],
  selectedState: undefined,
  selectedCity: undefined,
  addressType: 'home',
  postalCode: '',
  selectedCountry: undefined,
  addressLine: '',
  deliveryPartner: undefined,
  isServiceable: false,
  addressNote: '',

  loaders: {
    fetchCoords: false,
    addNewAddress: false,
  },
};

const locationStore = create<LocationStore & LoaderActions>(set => ({
  ...locationInitialState,

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
  resetLocationStore: () => set(locationInitialState),
}));

export default createSelectors(locationStore);
