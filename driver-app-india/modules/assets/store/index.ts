// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {CustomerAssetQuery, FetchAssetTypesQuery} from '@/generated/graphql';

type LoaderTypes = 'fetchAssets' | 'addAsset';

type Loaders = {
  fetchAssets: boolean;
  addAsset: boolean;
};

type AssetStore = {
  allCustomerAssets: CustomerAssetQuery['customer_asset'];
  currentAssetsInView: CustomerAssetQuery['customer_asset'];
  assetTypes: FetchAssetTypesQuery['asset_type'];
  selectedAssetType: FetchAssetTypesQuery['asset_type'][0] | undefined;

  // loading states
  loaders: Loaders;
};

type AssetActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetAssetStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const assetInitialState: AssetStore = {
  allCustomerAssets: [],
  currentAssetsInView: [],
  assetTypes: [],
  selectedAssetType: undefined,

  loaders: {
    fetchAssets: true,
    addAsset: false,
  },
};

const assetStore = create<AssetStore & AssetActions>(set => ({
  ...assetInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // reset asset store
  resetAssetStore: () => set(assetInitialState),
}));

export default createSelectors(assetStore);
