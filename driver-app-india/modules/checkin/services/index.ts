import {
  FetchDriverVehicleIdDocument,
  FetchDriverVehicleIdQuery,
  FetchDriverVehicleIdQueryVariables,
  GetDriverVehicleDetailsByIdQueryVariables,
  GetDriverVehicleDetailsByIdQuery,
  GetDriverVehicleDetailsByIdDocument,
} from './../../../generated/graphql';
import {setDriverVehicleId, getDriverVehicleId} from '@/utils/localStorage';
/**
 * @module Checkin
 * @description This is the service file for the checkin module.
 */

// dependencies
import {callQuery} from '@/utils/client';

// store
import {checkinStore, orderStore} from '@/globalStore';

// graphql-documents

/**
 * @class CheckinService
 * @description This class represents the service for the checkin module.
 */
class CheckinService {
  private static instance: CheckinService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the CheckinService class.
   * @returns {CheckinService} The singleton instance of the CheckinService class.
   */
  public static getInstance(): CheckinService {
    if (!CheckinService.instance) {
      CheckinService.instance = new CheckinService();
    }
    return CheckinService.instance;
  }

  public async fetchDriverVehicleId(args: FetchDriverVehicleIdQueryVariables) {
    // Try to get driverVehicleId from local storage first
    const storedDriverVehicleId = getDriverVehicleId();

    if (storedDriverVehicleId) {
      // If found in local storage, update the store
      checkinStore.setState(state => ({
        ...state,
        driverVehicleId: storedDriverVehicleId,
      }));
      return [{driver_vehicle_id: storedDriverVehicleId}];
    }

    // If not found in local storage, fetch from API
    const response: FetchDriverVehicleIdQuery = await callQuery({
      queryDocument: FetchDriverVehicleIdDocument,
      variables: {...args},
    });

    const driverVehicleId = response.shift_schedule[0]?.driver_vehicle_id;

    if (driverVehicleId) {
      // Store in local storage
      setDriverVehicleId(driverVehicleId);

      // Update the store
      checkinStore.setState(state => ({
        ...state,
        driverVehicleId: driverVehicleId,
      }));
    }

    return response.shift_schedule;
  }

  public async fetchDriverVehicleDetailsById(
    args: GetDriverVehicleDetailsByIdQueryVariables,
  ) {
    const response: GetDriverVehicleDetailsByIdQuery = await callQuery({
      queryDocument: GetDriverVehicleDetailsByIdDocument,
      variables: {...args},
    });

    // Use type assertion to ensure the vehicle data matches the expected Vehicle type
    const vehicleData = response.driver_vehicle_by_pk
      ?.vehicle as Vehicle | null;

    checkinStore.setState(state => ({
      ...state,
      driverVehicleDetails: vehicleData,
    }));

    return response.driver_vehicle_by_pk;
  }
}

const checkinService = CheckinService.getInstance();

export default checkinService;
