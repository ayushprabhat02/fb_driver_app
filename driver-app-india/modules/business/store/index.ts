// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  Organization_User,
  FetchAllOrgUsersByTypeQuery,
  FetchOrganizationSegmentationQuery,
  FetchOrganizationUsersOutput,
} from '@/generated/graphql';

type LoaderTypes =
  | 'fetchBusiness'
  | 'setActiveDelOrgUser'
  | 'createBusiness'
  | 'currentOrgUsersList'
  | 'createDefaultBusiness';

type Loaders = {
  fetchBusiness: boolean;
  setActiveDelOrgUser: boolean;
  createBusiness: boolean;
  currentOrgUsersList: boolean;
  createDefaultBusiness: boolean;
};

type BusinessStore = {
  // general
  activeDeliveryOrgUser:
    | Organization_User
    | FetchAllOrgUsersByTypeQuery['organization_user'][0]
    | undefined;

  // business lists
  fetchedOrganizationSegmentations: FetchOrganizationSegmentationQuery['organization_segmentation'];
  deliveryBusinessOrgs: FetchAllOrgUsersByTypeQuery['organization_user'];
  deliveryBusinessIndividual:
    | FetchAllOrgUsersByTypeQuery['organization_user'][0]
    | undefined;

  // single business details
  currentOrgUserInView:
    | Organization_User
    | FetchAllOrgUsersByTypeQuery['organization_user'][0]
    | undefined;
  currentOrgUsersList: FetchOrganizationUsersOutput['organization_users'];

  // loading states
  loaders: Loaders;
};

type BusinessActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetBusinessStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const businessInitialState: BusinessStore = {
  // general
  activeDeliveryOrgUser: undefined,

  // business lists
  fetchedOrganizationSegmentations: [],
  deliveryBusinessOrgs: [],
  deliveryBusinessIndividual: undefined,

  // single business details
  currentOrgUserInView: undefined,
  currentOrgUsersList: [],

  // loaders
  loaders: {
    fetchBusiness: true,
    setActiveDelOrgUser: true,
    createBusiness: false,
    currentOrgUsersList: true,
    createDefaultBusiness: false,
  },
};

const businessStore = create<BusinessStore & BusinessActions>(set => ({
  ...businessInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // reset business store
  resetBusinessStore: () => set(businessInitialState),
}));

export default createSelectors(businessStore);
