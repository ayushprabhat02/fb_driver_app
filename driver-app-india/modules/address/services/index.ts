/**
 * @module Address
 * @description This module contains the service file for the address module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// store
import addressStore from '../store';

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
} from '@/generated/graphql';
import {deliveryStore, locationStore} from '@/globalStore';
import Toast from 'react-native-toast-message';

/**
 * @class AddressService
 * @description This class represents the service for the address module.
 */
class AddressService {
  private static instance: AddressService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the AddressService class.
   * @returns {AddressService} The singleton instance of the AddressService class.
   */
  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
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

    addressStore.setState(state => ({
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
    addressStore.setState(state => ({
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

    addressStore.setState(state => ({
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

    addressStore.setState({
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

    addressStore.setState({
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
}

const addressService = AddressService.getInstance();

export default addressService;
