// dependencies
import {FetchOrderStatsForDriverQuery} from '@/generated/graphql';
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchOrderForDriverNew2Query,
  LastCustomerOrderQuery,
} from '@/generated/graphql';
import {DeliveryStat} from '../types';

type LoaderTypes =
  | 'lastCustomerOrder'
  | 'driverOrderStats'
  | 'driverCurrentOrder'
  | 'fillupHistory';

type Loaders = {
  driverOrderStats: boolean;
  lastCustomerOrder: boolean;
  driverCurrentOrder: boolean;
  fillupHistory: boolean;
};

type HomeStore = {
  lastCustomerOrder:
    | LastCustomerOrderQuery['customer_order_stateflow'][0]
    | null;

  deliveryStats: DeliveryStat[];
  driverOrderStats: FetchOrderStatsForDriverQuery['fetchOrderStatsForDriver'];
  driverOrders: FetchOrderForDriverNew2Query['task'] | null;
  fillupHistory: any; // Assuming fillup history is also part of the home store

  userCoordinates: any;
  userLocationAddress: any;
  showRepeatOrder: boolean;

  // loading states
  loaders: Loaders;
};

type HomeActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetHomeStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const homeIntialState: HomeStore = {
  lastCustomerOrder: null,
  deliveryStats: [],
  userCoordinates: {},
  userLocationAddress: {},
  showRepeatOrder: false,
  driverOrderStats: null,
  driverOrders: null,
  fillupHistory: null,

  loaders: {
    lastCustomerOrder: false,
    driverOrderStats: false,
    driverCurrentOrder: false,
    fillupHistory: false,
  },
};

const homeStore = create<HomeStore & HomeActions>(set => ({
  ...homeIntialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  //reset home store
  resetHomeStore: () => set(homeIntialState),
}));

export default createSelectors(homeStore);
