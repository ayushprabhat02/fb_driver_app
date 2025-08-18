// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchUserProfileQuery,
  FetchCustomerSegmentationListQuery,
} from '@/generated/graphql';

type LoaderTypes = 'loggedInUser';

type Loaders = {
  loggedInUser: boolean;
};

type UserStore = {
  loggedInUser: FetchUserProfileQuery['user'] | null | undefined;
  customerSegmentationList: FetchCustomerSegmentationListQuery['customer_segmentation'];

  // loading states
  loaders: Loaders;
};

type UserActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetUserStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const userInitialState: UserStore = {
  loggedInUser: null,
  customerSegmentationList: [],

  // loading states
  loaders: {
    loggedInUser: false,
  },
};

const userStore = create<UserStore & UserActions>(set => ({
  ...userInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // reset user store
  resetUserStore: () => set(userInitialState),
}));

export default createSelectors(userStore);
