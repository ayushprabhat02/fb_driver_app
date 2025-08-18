import {
  FetchDriverVehicleIdDocument,
  FetchDriverVehicleIdQuery,
  FetchDriverVehicleIdQueryVariables,
  GetDriverVehicleDetailsByIdQueryVariables,
  GetDriverVehicleDetailsByIdQuery,
  GetDriverVehicleDetailsByIdDocument,
} from './../../../generated/graphql';
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
    const response: FetchDriverVehicleIdQuery = await callQuery({
      queryDocument: FetchDriverVehicleIdDocument,
      variables: {...args},
    });

    checkinStore.setState(state => ({
      ...state,
      driverVehicleId: response.shift_schedule[0]?.driver_vehicle_id,
    }));

    return response.shift_schedule;
  }

  public async fetchDriverVehicleDetailsById(
    args: GetDriverVehicleDetailsByIdQueryVariables,
  ) {
    const response: GetDriverVehicleDetailsByIdQuery = await callQuery({
      queryDocument: GetDriverVehicleDetailsByIdDocument,
      variables: {...args},
    });

    checkinStore.setState(state => ({
      ...state,
      driverVehicleDetails: response.driver_vehicle_by_pk?.vehicle ?? null,
    }));

    return response.driver_vehicle_by_pk;
  }
}

const checkinService = CheckinService.getInstance();

export default checkinService;
