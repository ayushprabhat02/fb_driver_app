import {
  FetchDriverVehicleIdDocument,
  FetchDriverVehicleIdQuery,
  FetchDriverVehicleIdQueryVariables,
  GetDriverVehicleDetailsByIdQueryVariables,
  GetDriverVehicleDetailsByIdQuery,
  GetDriverVehicleDetailsByIdDocument,
} from './../../../generated/graphql';
import {setDriverVehicleId, getDriverVehicleId} from '@/utils/localStorage';
import {DateTime} from 'luxon';
import {signOut} from '../../auth/services';
import Toast from 'react-native-toast-message';
import {Vehicle} from '../../../generated/graphql';
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
    try {
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

      const shiftSchedule = response.shift_schedule[0];
      const driverVehicleId = shiftSchedule?.driver_vehicle_id;
      const shiftEndTime = shiftSchedule?.end_time;

      // Check for shift end conditions
      if (!driverVehicleId || !shiftSchedule) {
        // No active shift found - driver should be logged out
        Toast.show({
          type: 'info',
          text1: 'Shift Ended',
          text2: 'Your shift has ended. Please log in again.',
        });
        await this.handleShiftEndLogout();
        return response.shift_schedule;
      }

      // Check if current time exceeds shift end time
      if (shiftEndTime) {
        const currentTime = DateTime.now();
        const endTime = DateTime.fromISO(shiftEndTime);
        
        if (currentTime > endTime) {
          // Shift has ended based on time - driver should be logged out
          Toast.show({
            type: 'info',
            text1: 'Shift Time Expired',
            text2: 'Your shift time has expired. Please log in again.',
          });
          await this.handleShiftEndLogout();
          return response.shift_schedule;
        }
      }

      // Store in local storage
      setDriverVehicleId(driverVehicleId);

      // Update the store
      checkinStore.setState(state => ({
        ...state,
        driverVehicleId: driverVehicleId,
      }));

      return response.shift_schedule;
    } catch (error) {
      console.error('Error fetching driver vehicle ID:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Unable to verify shift status. Please check your connection.',
      });
      // Return empty array to prevent app crash
      return [];
    }
  }

  /**
   * @method handleShiftEndLogout
   * @description Handles automatic logout when shift ends
   */
  private async handleShiftEndLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during automatic logout:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: 'Please try logging out manually.',
      });
    }
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
