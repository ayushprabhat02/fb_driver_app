/**
 * @module Asset
 * @description This module contains the service file for the address module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// store
import assetStore from '../store';

// graphql-documents
import {
  CustomerAssetDocument,
  CustomerAssetQuery,
  CustomerAssetQueryVariables,

  //add customer asset
  InsertCustomerAssetDocument,
  InsertCustomerAssetMutation,
  InsertCustomerAssetMutationVariables,

  //fetch asset type
  FetchAssetTypesDocument,
  FetchAssetTypesQuery,
  FetchAssetTypesQueryVariables,
  ToggleAssetActivationDocument,
  ToggleAssetActivationMutation,
  ToggleAssetActivationMutationVariables,
} from '@/generated/graphql';

/**
 * @class AssetService
 * @description This class represents the service for the asset module.
 */
class AssetService {
  private static instance: AssetService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the AssetService class.
   * @returns {AssetService} The singleton instance of the AssetService class.
   */
  public static getInstance(): AssetService {
    if (!AssetService.instance) {
      AssetService.instance = new AssetService();
    }
    return AssetService.instance;
  }

  /**
   * @method getAllCustomerAssets
   * @description Retrieves the active user's assets.
   * @args AddressByTypeQueryVariables
   */

  public async getAllCustomerAssets(args: CustomerAssetQueryVariables) {
    const response: CustomerAssetQuery = await callQuery({
      queryDocument: CustomerAssetDocument,
      variables: {
        ...args,
      },
    });

    assetStore.setState(state => ({
      ...state,
      allCustomerAssets: response.customer_asset,
    }));

    return response.customer_asset;
  }

  /**
   * @method addCustomerAsset
   * @description add new customer asset.
   * @args InsertCustomerAssetMutationVariables
   */
  public async addCustomerAsset(args: InsertCustomerAssetMutationVariables) {
    const response: InsertCustomerAssetMutation = await callMutation({
      queryDocument: InsertCustomerAssetDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }

  /**
   * @method fetchAssetTypes
   * @description fetch asset types.
   * @args FetchAssetTypesQueryVariables
   */
  public async fetchAssetTypes(args: FetchAssetTypesQueryVariables) {
    const response: FetchAssetTypesQuery = await callQuery({
      queryDocument: FetchAssetTypesDocument,
      variables: {
        ...args,
      },
    });
    const filteredAssetTypes = response.asset_type.filter(
      assetType => assetType.name !== null,
    );

    assetStore.setState(state => ({
      ...state,
      assetTypes: filteredAssetTypes,
    }));

    return filteredAssetTypes;
  }

  /**
   * @method toggleAssetActivation
   * @description fetch asset types.
   * @args ToggleAssetActivationMutationVariables
   */
  public async toggleAssetActivation(
    args: ToggleAssetActivationMutationVariables,
  ) {
    const response: ToggleAssetActivationMutation = await callMutation({
      queryDocument: ToggleAssetActivationDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }
}

const assetService = AssetService.getInstance();

export default assetService;
