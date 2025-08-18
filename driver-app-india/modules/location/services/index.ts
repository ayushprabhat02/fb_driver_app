/**
 * @module Location
 * @description This module contains the service file for the location module.
 * Location module contains all functionality related to map.
 */

// dependencies
import {callQuery} from '@/utils/client';

// store
// import {deliveryStore} from '@/globalStore';

//actions
import {findDefaultFranchise, findNearestPolygon} from '@/utils/general';

// graphql-documents
import {
  CheckServiceAblilityDocument,
  CheckServiceAblilityQuery,
  CheckServiceAblilityQueryVariables,
  FetchNearestZonesDocument,
  FetchNearestZonesQuery,
  FetchNearestZonesQueryVariables,
} from '@/generated/graphql';

/**
 * @class LocationService
 * @description This class represents the service for the location module.
 */
class LocationService {
  private static instance: LocationService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the LocationService class.
   * @returns {LocationService} The singleton instance of the LocationService class.
   */
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * @method checkServiceability
   * @description Retrieves the selected locations's serviceability status.
   * @args AddressByTypeQueryVariables
   */
  public async checkServiceability(args: CheckServiceAblilityQueryVariables) {
    const response: CheckServiceAblilityQuery = await callQuery({
      queryDocument: CheckServiceAblilityDocument,
      variables: {
        ...args,
      },
    });
    const foundPartner = findDefaultFranchise(response.partner);
    return foundPartner;
  }

  /**
   * @method fetchNearestZones
   * @description Retrieves the selected locations's nearest serviceables zones.
   * @args FetchNearestZonesQueryVariables
   */
  public async fetchNearestZones(args: FetchNearestZonesQueryVariables) {
    const response: FetchNearestZonesQuery = await callQuery({
      queryDocument: FetchNearestZonesDocument,
      variables: {
        ...args,
      },
    });

    const nearestAreaObject = findNearestPolygon(response?.partner as any, {
      lat: args.latitude,
      lng: args.longitude,
    });
    return nearestAreaObject;
  }
}

const locationService = LocationService.getInstance();

export default locationService;
