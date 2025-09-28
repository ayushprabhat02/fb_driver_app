import {
  FetchDriverVehicleIdDocument,
  FetchDriverVehicleIdQuery,
  FetchDriverVehicleIdQueryVariables,
  GetDriverVehicleDetailsByIdQueryVariables,
  GetDriverVehicleDetailsByIdQuery,
  GetDriverVehicleDetailsByIdDocument,
  DriverCheckInDocument,
  DriverCheckInMutation,
  DriverCheckInMutationVariables,
  UpdateDriverVehicleStateByIdDocument,
  UpdateDriverVehicleStateByIdMutation,
  UpdateDriverVehicleStateByIdMutationVariables,
  Login_Type_Enum,
  Partner_Vehicle_State_Enum,
  Photo_Type_Enum,
} from './../../../generated/graphql';
import { setDriverVehicleId, getDriverVehicleId } from '@/utils/localStorage';
import { DateTime } from 'luxon';
import { signOut } from '../../auth/services';
import Toast from 'react-native-toast-message';
import { Vehicle } from '../../../generated/graphql';
/**
 * @module Checkin
 * @description This is the service file for the checkin module.
 */

// dependencies
import { callQuery, callMutation } from '@/utils/client';

// store
import { checkinStore, orderStore, authStore } from '@/globalStore';

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
      // Always fetch fresh data from API to validate current shift status
      const response: FetchDriverVehicleIdQuery = await callQuery({
        queryDocument: FetchDriverVehicleIdDocument,
        variables: { ...args },
      });

      console.log('FetchDriverVehicleId response:', JSON.stringify(response, null, 2));

      const shiftSchedule = response.shift_schedule[0];
      const driverVehicleId = shiftSchedule?.driver_vehicle_id;
      const shiftScheduleId = shiftSchedule?.id; // Get the shift schedule ID for tracking
      const shiftEndTime = shiftSchedule?.end_time;

      // Log the extracted data
      console.log('Extracted data:', {
        shiftSchedule,
        driverVehicleId,
        shiftScheduleId,
        shiftEndTime
      });

      // Check for shift end conditions
      if (!driverVehicleId || !shiftSchedule) {
        // No shift found - clear cached data and logout
        console.log('No shift found, clearing cached data and logging out');

        // Clear cached driver vehicle ID since shift no longer exists
        const storedDriverVehicleId = getDriverVehicleId();
        if (storedDriverVehicleId) {
          setDriverVehicleId(''); // Clear the cached ID
          console.log('Cleared cached driver vehicle ID');
        }

        // Clear store state
        checkinStore.setState(state => ({
          ...state,
          driverVehicleId: null,
          shiftSchedule: null,
          isCheckedIn: false,
        }));

        Toast.show({
          type: 'info',
          text1: 'Access Restricted',
          text2: 'Please contact your supervisor for shift assignment.',
        });

        // Handle logout gracefully without throwing errors
        this.handleShiftEndLogout();
        return []; // Return empty array instead of throwing
      }

      // Set the schedule shift ID for tracking in the order store
      if (shiftScheduleId) {
        console.log('Setting scheduleShiftIdTracking:', shiftScheduleId);
        (orderStore.getState() as any).setScheduleShiftIdTracking(shiftScheduleId);
      }

      // Set the shift schedule in the checkin store
      if (shiftSchedule) {
        checkinStore.getState().setShiftSchedule(shiftSchedule);
      }

      // Check if current time exceeds shift end time by more than 1 hour (grace period)
      if (shiftEndTime) {
        const currentTime = DateTime.now();
        const endTime = DateTime.fromISO(shiftEndTime);
        const timeDifference = currentTime.diff(endTime, 'hours').hours;

        if (timeDifference > 1) {
          // Shift has ended more than 1 hour ago - driver should be logged out
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
      console.warn('Error validating shift status:', error);

      // Clear cached data on error
      const storedDriverVehicleId = getDriverVehicleId();
      if (storedDriverVehicleId) {
        setDriverVehicleId(''); // Clear the cached ID
        console.log('Cleared cached driver vehicle ID due to validation error');
      }

      // Clear store state
      checkinStore.setState(state => ({
        ...state,
        driverVehicleId: null,
        shiftSchedule: null,
        isCheckedIn: false,
      }));

      Toast.show({
        type: 'info',
        text1: 'Unable to Verify Shift',
        text2: 'Please check your connection and try again.',
      });

      // Handle logout gracefully without awaiting to avoid blocking
      this.handleShiftEndLogout();

      // Return empty array to prevent app crash
      return [];
    }
  }

  /**
   * @method handleShiftEndLogout
   * @description Handles automatic logout when shift ends
   */
  private handleShiftEndLogout() {
    // Use setTimeout to avoid blocking the main thread
    setTimeout(async () => {
      try {
        await signOut();
        console.log('User logged out successfully');
      } catch (error) {
        console.warn('Logout process encountered an issue:', error);
        // Don't show error toast to user - just log for debugging
        // The app state has already been cleared, so user won't see cached data
      }
    }, 100);
  }

  public async fetchDriverVehicleDetailsById(
    args: GetDriverVehicleDetailsByIdQueryVariables,
  ) {
    const response: GetDriverVehicleDetailsByIdQuery = await callQuery({
      queryDocument: GetDriverVehicleDetailsByIdDocument,
      variables: { ...args },
    });

    // Use type assertion to ensure the vehicle data matches the expected Vehicle type
    const vehicleData = response.driver_vehicle_by_pk
      ?.vehicle as Vehicle | null;

    checkinStore.setState(state => ({
      ...state,
      driverVehicleDetails: vehicleData,
      driverDetails: response.driver_vehicle_by_pk?.user
    }));

    return response.driver_vehicle_by_pk;
  }

  /**
   * @method driverCheckIn
   * @description Creates a driver duty log entry for check-in with photos
   */
  public async driverCheckIn(args: DriverCheckInMutationVariables) {
    try {
      console.log(
        'Calling driverCheckIn API with variables:',
        JSON.stringify(args, null, 2),
      );

      // Check if GraphQL client is available
      const graphQLClient = authStore.getState().graphQLClient;
      if (!graphQLClient) {
        throw new Error(
          'GraphQL client is not initialized. Please ensure you are logged in.',
        );
      }

      const response: DriverCheckInMutation = await callMutation({
        queryDocument: DriverCheckInDocument,
        variables: { ...args },
      });

      if (response && response.insert_driver_duty_log_one) {
        console.log(
          'Driver check-in successful:',
          response.insert_driver_duty_log_one,
        );
        return response;
      }

      throw new Error('Failed to create driver duty log - no response data');
    } catch (error) {
      console.error('Error during driver check-in:', error);
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: `Unable to complete check-in: ${error instanceof Error ? error.message : 'Unknown error'
          }`,
      });
      throw error;
    }
  }

  /**
   * @method updateDriverVehicleStateById
   * @description Updates driver vehicle state and status
   */
  public async updateDriverVehicleStateById(
    args: UpdateDriverVehicleStateByIdMutationVariables,
  ) {
    try {
      console.log(
        'Calling updateDriverVehicleStateById API with variables:',
        args,
      );

      const response: UpdateDriverVehicleStateByIdMutation = await callMutation(
        {
          queryDocument: UpdateDriverVehicleStateByIdDocument,
          variables: { ...args },
        },
      );

      console.log(
        'Driver vehicle state updated:',
        response.update_driver_vehicle_by_pk,
      );
      return response.update_driver_vehicle_by_pk;
    } catch (error) {
      console.error('Error updating driver vehicle state:', error);
      Toast.show({
        type: 'error',
        text1: 'State Update Failed',
        text2: 'Unable to update vehicle status.',
      });
      throw error;
    }
  }

  /**
   * @method completeCheckIn
   * @description Complete check-in process with refueller store URL and location - Following fuelbuddy-driver flow
   */
  public async completeCheckIn(checkInData: {
    refuellerStoreUrl: string;
    location: { lat: number; lng: number };
    driverVehicleId: string;
  }) {
    try {
      const { refuellerStoreUrl, location, driverVehicleId } = checkInData;

      console.log('Starting check-in process with data:', checkInData);

      // Step 1: Prepare check-in data object following fuelbuddy-driver pattern
      // Use fallback coordinates if location is 0,0 (GPS failed)
      // Format: (lng,lat) - exactly as in FuelBuddy Vue project line 404
      const locationPoint =
        location.lat === 0 && location.lng === 0
          ? '(77.5946,12.9716)' // Bangalore coordinates as fallback
          : `(${location.lng},${location.lat})`;

      const checkInObject = {
        is_active: true,
        location: locationPoint,
        name: 'Driver Check-in',
        odometer: '0', // Default for simplified flow
        totallizer: '0', // Default for simplified flow
        category: Login_Type_Enum.CheckIn, // Maps to 'CHECK_IN' as in Vue project
        driver_vehicle_id: driverVehicleId,
        driver_duty_photos: {
          data: [
            {
              category: Photo_Type_Enum.RefuellerStart, // As in Vue project line 429
              is_active: true,
              url: refuellerStoreUrl,
            },
          ],
        },
      };

      // Step 2: Execute driverCheckIn API call
      console.log('Calling driverCheckIn API...');
      const checkInResponse = await this.driverCheckIn({
        object: checkInObject,
      });

      if (checkInResponse.insert_driver_duty_log_one) {
        // Step 3: Update driver vehicle state to checked-in and idle
        console.log('Updating driver vehicle state...');
        await this.updateDriverVehicleStateById({
          id: driverVehicleId,
          state: Login_Type_Enum.CheckIn,
          status: Partner_Vehicle_State_Enum.Idle,
        });

        // Step 4: Update local state to mark as checked-in
        checkinStore.setState(state => ({
          ...state,
          isCheckedIn: true,
        }));

        console.log('Check-in process completed successfully');

        Toast.show({
          type: 'success',
          text1: 'Check-in Successful',
          text2: 'You have successfully checked in.',
        });

        return checkInResponse;
      }

      throw new Error('Check-in response invalid');
    } catch (error) {
      console.error('Error completing check-in process:', error);
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: 'Unable to complete check-in. Please try again.',
      });
      throw error;
    }
  }
}

const checkinService = CheckinService.getInstance();

export default checkinService;