import {DateTime} from 'luxon';
import Toast from 'react-native-toast-message';
import {
  FetchDriverVehicleIdDocument,
  FetchDriverVehicleIdQuery,
} from '@/generated/graphql';
import {callQuery} from '@/utils/client';
import {signOut} from '@/modules/auth/services';
import {getDriverVehicleId} from '@/utils/localStorage';
import {authStore} from '@/globalStore';

/**
 * @description Validates the current shift status and logs out user if shift has ended
 * @param driverVehicleId - Current driver vehicle ID from store
 * @returns Promise<void>
 */
export const validateShiftPeriodically = async (
  driverVehicleId: string | null,
): Promise<void> => {
  const graphqlClient = authStore.getState().graphQLClient;

  if (!graphqlClient || !driverVehicleId) {
    return;
  }

  try {
    // Get stored driver vehicle ID from localStorage
    const storedDriverVehicleId = await getDriverVehicleId();
    if (!storedDriverVehicleId) {
      console.log('No stored driver vehicle ID found, logging out user');
      Toast.show({
        type: 'info',
        text1: 'Session Expired',
        text2: 'Please log in again.',
      });
      signOut();
      return;
    }

    // Fetch current shift schedule to validate
    const currentTime = new Date().toISOString();
    const response: FetchDriverVehicleIdQuery = await callQuery({
      queryDocument: FetchDriverVehicleIdDocument,
      variables: {dateTime: currentTime},
    });

    const shiftSchedule = response.shift_schedule?.[0];
    if (!shiftSchedule) {
      console.log('No active shift found, logging out user instantly');
      Toast.show({
        type: 'info',
        text1: 'No Active Shift',
        text2: 'No shift found. Please log in again.',
      });
      signOut();
      return;
    }

    // Check if current time exceeds shift end time by more than 1 hour
    const now = DateTime.now();
    const shiftEndTime = DateTime.fromISO(shiftSchedule.end_time);
    const timeDifference = now.diff(shiftEndTime, 'hours').hours;

    if (timeDifference > 1) {
      console.log('Shift ended more than 1 hour ago, logging out user');
      Toast.show({
        type: 'info',
        text1: 'Shift Ended',
        text2: 'Your shift has ended. Please log in again.',
      });
      signOut();
    }
  } catch (error) {
    console.error('Error during periodic shift validation:', error);
    // Don't logout on network errors to avoid disrupting user experience
  }
};

/**
 * @description Sets up periodic shift validation with interval and app state listeners
 * @param driverVehicleId - Current driver vehicle ID from store
 * @param intervalRef - Ref to store the interval ID
 * @returns Cleanup function to clear interval and remove listeners
 */
export const setupShiftValidation = (
  driverVehicleId: string | null,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
): (() => void) | undefined => {
  const {AppState} = require('react-native');
  const graphqlClient = authStore.getState().graphQLClient;

  if (!graphqlClient || !driverVehicleId) {
    return undefined;
  }

  // Run validation immediately
  validateShiftPeriodically(driverVehicleId);

  // Set up periodic validation every 5 minutes
  intervalRef.current = setInterval(() => {
    validateShiftPeriodically(driverVehicleId);
  }, 300000);

  // Also validate when app becomes active
  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      validateShiftPeriodically(driverVehicleId);
    }
  };

  const subscription = AppState.addEventListener(
    'change',
    handleAppStateChange,
  );

  // Return cleanup function
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    subscription?.remove();
  };
};
