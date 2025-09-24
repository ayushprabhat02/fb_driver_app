/**
 * @module Fillup
 * @description This module contains the service file for the address module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// store
import fillupStore from '../store';

// graphql-documents
import {
  // delivery addresses
  FetchAddressByTypeDocument,
  FetchAddressByTypeQuery,
  FetchAddressByTypeQueryVariables,
  FetchAddressByNameDocument,
  FetchAddressByNameQuery,
  FetchAddressByNameQueryVariables,
  AddNewCustomerAddressDocument,
  AddNewCustomerAddressQuery,
  AddNewCustomerAddressQueryVariables,
  FetchAllCountriesQuery,
  FetchAllCountriesDocument,
  AddNewBillingAddressDocument,
  AddNewBillingAddressMutation,
  AddNewBillingAddressMutationVariables,
  CheckIfShippingAddressExistsDocument,
  CheckIfShippingAddressExistsQuery,
  CheckIfShippingAddressExistsQueryVariables,

  // billing address check
  CheckIfBillingAddressExistsDocument,
  CheckIfBillingAddressExistsQuery,
  CheckIfBillingAddressExistsQueryVariables,

  //toggle address
  ToggleAddressActivationMutationVariables,
  ToggleAddressActivationMutation,
  ToggleAddressActivationDocument,

  // GST validation
  ValidateGstDocument,
  ValidateGstQuery,
  ValidateGstQueryVariables,

  // new gst validation
  IsValidateGstinDocument,
  IsValidateGstinQuery,
  IsValidateGstinQueryVariables,

  // fillup request
  RaiseFillupRequestDocument,
  RaiseFillupRequestMutation,
  RaiseFillupRequestMutationVariables,
  FillupRequestByIdDocument,
  FillupRequestByIdQuery,
  FillupRequestByIdQueryVariables,

  //  Fillup history
  FillupHistoryDocument,
  FillupHistoryQuery,
  FillupHistoryQueryVariables,

  // Active fillup check
  ActiveFillupCheckDocument,
  ActiveFillupCheckQuery,
  ActiveFillupCheckQueryVariables,

  // Fillup history new
  FillupHistoryNewDocument,
  FillupHistoryNewQuery,
  FillupHistoryNewQueryVariables,

  // Reject old fillup requests
  RejectOldFillupRequestsDocument,
  RejectOldFillupRequestsMutation,
  RejectOldFillupRequestsMutationVariables,

  // Indent upload APIs
  UpdateFillupRequestStateDocument,
  UpdateFillupRequestStateMutation,
  UpdateFillupRequestStateMutationVariables,
  AddIndentDocument,
  AddIndentMutation,
  AddIndentMutationVariables,
  CheckIndentNumberExistsDocument,
  CheckIndentNumberExistsQuery,
  CheckIndentNumberExistsQueryVariables,
  UpdatePartnerOrderItemStateDocument,
  UpdatePartnerOrderItemStateMutation,
  UpdatePartnerOrderItemStateMutationVariables,
  UpdatePartnerOrderStateDocument,
  UpdatePartnerOrderStateMutation,
  UpdatePartnerOrderStateMutationVariables,

  // Enums
  Fillup_Request_Status_Enum,
  Partner_Order_Item_State_Enum,
  Partner_Order_State_Enum,
} from '@/generated/graphql';
import {deliveryStore, locationStore} from '@/globalStore';
import Toast from 'react-native-toast-message';

// types
type TankTypeOption = {
  label: string;
  value: string;
  tankTypeDetails: {
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
};

/**
 * @function extractTankTypeOptions
 * @description Extracts tank type options from driverVehicleDetails
 * @param driverVehicleDetails - The driver vehicle details object
 * @returns Array of tank type options for the dropdown
 */
export const extractTankTypeOptions = (
  driverVehicleDetails: any,
): TankTypeOption[] => {
  if (!driverVehicleDetails?.vehicle_tank_types) {
    return [];
  }

  return driverVehicleDetails.vehicle_tank_types.map((tankType: any) => ({
    label: tankType.tank_type.name,
    value: tankType.tank_type.slug,
    tankTypeDetails: {
      id: tankType.tank_type.id,
      name: tankType.tank_type.name,
      slug: tankType.tank_type.slug,
      tank_type_id: tankType.tank_type_id,
      vehicle_tank_type_product_variations:
        tankType.vehicle_tank_type_product_variations,
    },
  }));
};

/**
 * @function findTankTypeById
 * @description Finds tank type details by tank type ID
 * @param driverVehicleDetails - The driver vehicle details object
 * @param tankTypeId - The tank type ID to search for
 * @returns Tank type details or null if not found
 */
export const findTankTypeById = (
  driverVehicleDetails: any,
  tankTypeId: string,
) => {
  if (!driverVehicleDetails?.vehicle_tank_types) {
    return null;
  }

  const tankType = driverVehicleDetails.vehicle_tank_types.find(
    (tank: any) =>
      tank.tank_type.id === tankTypeId || tank.tank_type.slug === tankTypeId,
  );

  if (!tankType) {
    return null;
  }

  return {
    id: tankType.tank_type.id,
    name: tankType.tank_type.name,
    slug: tankType.tank_type.slug,
    tank_type_id: tankType.tank_type_id,
    vehicle_tank_type_product_variations:
      tankType.vehicle_tank_type_product_variations,
  };
};

/**
 * @class FillupService
 * @description This class represents the service for the address module.
 */
class FillupService {
  private static instance: FillupService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the FillupService class.
   * @returns {FillupService} The singleton instance of the FillupService class.
   */
  public static getInstance(): FillupService {
    if (!FillupService.instance) {
      FillupService.instance = new FillupService();
    }
    return FillupService.instance;
  }

  /**
   * @method getDeliveryAddresses
   * @description Retrieves the active user's delivery addresses.
   * @args AddressByTypeQueryVariables
   */

  public async getShippingAddresses(args: FetchAddressByTypeQueryVariables) {
    const response: FetchAddressByTypeQuery = await callQuery({
      queryDocument: FetchAddressByTypeDocument,
      variables: {
        ...args,
      },
    });

    fillupStore.setState(state => ({
      ...state,
      shippingAddresses: response.organization_address,
    }));
    return response.organization_address;
  }

  /**
   * @method searchShippingAddresses
   * @description Retrieves the active user's delivery addresses based on search query.
   * @args FetchAddressByNameQueryVariables
   */
  public async searchShippingAddresses(args: FetchAddressByNameQueryVariables) {
    const response: FetchAddressByNameQuery = await callQuery({
      queryDocument: FetchAddressByNameDocument,
      variables: {
        ...args,
      },
    });
    fillupStore.setState(state => ({
      ...state,
      shippingAddresses: response.organization_address,
    }));
    return response.organization_address;
  }

  /**
   * @method getBillingAddresses
   * @description Retrieves the active user's billing delivery addresses.
   * @args AddressByTypeQueryVariables
   */
  public async getBillingAddresses(args: FetchAddressByTypeQueryVariables) {
    const response: FetchAddressByTypeQuery = await callQuery({
      queryDocument: FetchAddressByTypeDocument,
      variables: {
        ...args,
      },
    });

    fillupStore.setState(state => ({
      ...state,
      billingAddresses: response.organization_address,
    }));
    return response.organization_address;
  }

  /**
   * @method addNewCustomerAddress
   * @description Retrieves the active user's delivery addresses based on search query.
   * @args FetchAddressByNameQueryVariables
   */
  public async addNewCustomerAddress(
    args: AddNewCustomerAddressQueryVariables,
  ) {
    const response: AddNewCustomerAddressQuery = await callQuery({
      queryDocument: AddNewCustomerAddressDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }

  /**
   * @method addNewBillingAddress
   * @description Retrieves the active user's delivery addresses based on search query.
   * @args AddNewBillingAddressMutationVariables
   */
  public async addNewBillingAddress(
    args: AddNewBillingAddressMutationVariables,
  ) {
    const response: AddNewBillingAddressMutation = await callMutation({
      queryDocument: AddNewBillingAddressDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }

  /**
   * @method fetchAllCountries
   * @description Retrieves the active user's delivery addresses based on search query.
   */
  public async fetchAllCountries() {
    const fetchedCountries: FetchAllCountriesQuery = await callQuery({
      queryDocument: FetchAllCountriesDocument,
      variables: {},
    });

    const countries = fetchedCountries.country.map(country => country);
    const foundCountry = countries?.find(country => {
      return country.alpha_code2 === 'IN';
    });

    fillupStore.setState({
      deliveryCountry: foundCountry,
    });

    const states = foundCountry?.states.map(state => {
      return {
        label: state?.name,
        value: state?.id,
        countryId: state.country_id,
      };
    });

    locationStore.setState(state => ({
      ...state,
      statesList: foundCountry?.states,
      selectedCountry: foundCountry,
    }));

    fillupStore.setState({
      deliveryStates: states,
    });

    return fetchedCountries;
  }

  /**
   * @method toggleAddressActivation
   * @description toggle address activation.
   * @args ToggleAddressActivationMutationVariables
   */
  public async toggleAddressActivation(
    args: ToggleAddressActivationMutationVariables,
  ) {
    const response: ToggleAddressActivationMutation = await callMutation({
      queryDocument: ToggleAddressActivationDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }

  /**
   * @method validateGST
   * @description validate billing address gst number
   * @args ValidateGstQueryVariables
   */
  public async validateGST(args: ValidateGstQueryVariables) {
    const response: ValidateGstQuery = await callQuery({
      queryDocument: ValidateGstDocument,
      errorCallback: () => {
        Toast.show({
          type: 'error',
          text1: 'Invalid GST number',
          text2: 'Please try a different GST number',
        });
      },
      variables: {
        ...args,
      },
    });

    return response.isValidateGstin;
  }

  /**
   * @method validateGST
   * @description validate billing address gst number
   * @args ValidateGstQueryVariables
   */
  public async isValidateGstin(args: IsValidateGstinQueryVariables) {
    const response: IsValidateGstinQuery = await callQuery({
      queryDocument: IsValidateGstinDocument,
      errorCallback: () => {
        Toast.show({
          type: 'error',
          text1: 'Invalid GST number',
          text2: 'Please try a different GST number',
        });
      },
      variables: {
        ...args,
      },
    });

    return response.isValidateGstin;
  }

  /**
   * check if shipping address exists
   * @param args
   */
  public async checkIfAddressExists(
    args: CheckIfShippingAddressExistsQueryVariables,
  ) {
    const response: CheckIfShippingAddressExistsQuery = await callQuery({
      queryDocument: CheckIfShippingAddressExistsDocument,
      variables: {
        ...args,
      },
    });

    return response.organization_address;
  }

  /**
   * check if billing address exists
   */

  public async checkIfBillingAddressExists(
    args: CheckIfBillingAddressExistsQueryVariables,
    loc: string,
  ) {
    const response: CheckIfBillingAddressExistsQuery = await callQuery({
      queryDocument: CheckIfBillingAddressExistsDocument,
      variables: {...args},
    });

    const filterAddresses = response.organization_address.length
      ? response.organization_address.filter(({location}) => location === loc)
      : [];

    // if (filterAddresses.length) {
    //   const fetchedAddress = await fetchOrgUserAddressById(
    //     filterAddresses[0]?.id,
    //   );

    //   // deliveryStore.setDeliveryBillingAddress(
    //   //   fetchedAddress as Organization_Address,
    //   // );
    // }
    return filterAddresses;
  }

  public async raiseFillupRequest(args: RaiseFillupRequestMutationVariables) {
    const response: RaiseFillupRequestMutation = await callMutation({
      queryDocument: RaiseFillupRequestDocument,
      variables: {
        ...args,
      },
    });

    return response.insert_fillup_request_one;
  }

  public async fetchFillupRequestById(args: FillupRequestByIdQueryVariables) {
    fillupStore.getState().startLoader('fetchFillupRequestById');
    try {
      const response: FillupRequestByIdQuery = await callQuery({
        queryDocument: FillupRequestByIdDocument,
        variables: {
          ...args,
        },
      });
      fillupStore
        .getState()
        .setFillupRequestDetails(response?.fillup_request_by_pk || null);
      fillupStore.getState().stopLoader('fetchFillupRequestById');
      return response;
    } catch (error) {
      fillupStore.getState().stopLoader('fetchFillupRequestById');
      throw error;
    }
  }

  public async fetchActiveFillupCheck(args: ActiveFillupCheckQueryVariables) {
    const response: ActiveFillupCheckQuery = await callQuery({
      queryDocument: ActiveFillupCheckDocument,
      variables: {
        ...args,
      },
    });

    // Update fillup store
    fillupStore.setState(state => ({
      ...state,
      activeFillupHistory: response?.fillup_request,
    }));
  }

  public async fetchFillupHistoryNew(args: FillupHistoryNewQueryVariables) {
    fillupStore.getState().startLoader('fetchFillupHistoryNew');
    try {
      const response: FillupHistoryNewQuery = await callQuery({
        queryDocument: FillupHistoryNewDocument,
        variables: {
          ...args,
        },
      });

      // Update fillup store
      fillupStore.setState(state => ({
        ...state,
        fillupHistory: response?.fillup_request,
      }));

      fillupStore.getState().stopLoader('fetchFillupHistoryNew');
      return response;
    } catch (error) {
      fillupStore.getState().stopLoader('fetchFillupHistoryNew');
      throw error;
    }
  }

  public async rejectOldFillupRequests(args: RejectOldFillupRequestsMutationVariables) {
    try {
      const response: RejectOldFillupRequestsMutation = await callMutation({
        queryDocument: RejectOldFillupRequestsDocument,
        variables: {
          ...args,
        },
      });

      console.log(`Rejected ${response?.update_fillup_request?.affected_rows} old fillup requests`);

      return response;
    } catch (error) {
      console.error('Error rejecting old fillup requests:', error);
      throw error;
    }
  }

  public async checkIndentNumberExists(args: CheckIndentNumberExistsQueryVariables) {
    const response: CheckIndentNumberExistsQuery = await callQuery({
      queryDocument: CheckIndentNumberExistsDocument,
      variables: {
        ...args,
      },
    });

    return response?.isPurchaseIndentNumberExits?.is_exit;
  }

  public async addIndent(args: AddIndentMutationVariables) {
    const response: AddIndentMutation = await callMutation({
      queryDocument: AddIndentDocument,
      variables: {
        ...args,
      },
    });

    return response.insert_partner_order_item_value;
  }

  public async updateFillupRequestState(args: UpdateFillupRequestStateMutationVariables) {
    const response: UpdateFillupRequestStateMutation = await callMutation({
      queryDocument: UpdateFillupRequestStateDocument,
      variables: {
        ...args,
      },
    });

    return response.update_fillup_request_by_pk;
  }

  public async updatePartnerOrderItemState(args: UpdatePartnerOrderItemStateMutationVariables) {
    const response: UpdatePartnerOrderItemStateMutation = await callMutation({
      queryDocument: UpdatePartnerOrderItemStateDocument,
      variables: {
        ...args,
      },
    });

    return response.update_partner_order_item_by_pk;
  }

  public async updatePartnerOrderState(args: UpdatePartnerOrderStateMutationVariables) {
    const response: UpdatePartnerOrderStateMutation = await callMutation({
      queryDocument: UpdatePartnerOrderStateDocument,
      variables: {
        ...args,
      },
    });

    return response.update_partner_order_by_pk;
  }
}

const fillupService = FillupService.getInstance();

export default fillupService;
