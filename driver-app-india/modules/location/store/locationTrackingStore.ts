// dependencies
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderStore, checkinStore, userStore } from '@/globalStore';
import orderService from '@/modules/order/services';
import { getCurrentLocation } from '@/utils/location';

// utils
import createSelectors from '@/utils/selectors';

// Key for AsyncStorage
const TRACKING_ACTIVE_KEY = "isTrackingActive";

type LocationTrackingStore = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isTracking: boolean;
  intervalId: NodeJS.Timeout | null;
};

type LocationTrackingActions = {
  setLatitude: (latitude: number | null) => void;
  setLongitude: (longitude: number | null) => void;
  setError: (error: string | null) => void;
  setIsTracking: (isTracking: boolean) => void;
  setIntervalId: (intervalId: NodeJS.Timeout | null) => void;
  startLiveLocationTracking: () => void;
  stopLiveLocationTracking: () => void;
  initialize: () => void;
};

const locationTrackingInitialState: LocationTrackingStore = {
  latitude: null,
  longitude: null,
  error: null,
  isTracking: false,
  intervalId: null,
};

const locationTrackingStore = create<LocationTrackingStore & LocationTrackingActions>((set) => ({
  ...locationTrackingInitialState,

  setLatitude: (latitude: number | null) => set({ latitude }),
  setLongitude: (longitude: number | null) => set({ longitude }),
  setError: (error: string | null) => set({ error }),
  setIsTracking: (isTracking: boolean) => set({ isTracking }),
  setIntervalId: (intervalId: NodeJS.Timeout | null) => set({ intervalId }),

  /**
   * Action to start live location tracking.
   * This should ONLY be called when the user clicks "Check In".
   */
  startLiveLocationTracking: () => {
    const state = locationTrackingStore.getState();

    // If already tracking, do nothing
    if (state.intervalId !== null) {
      console.log("Tracking is already active.");
      return;
    }

    // Get required data from stores
    const orderState = orderStore.getState();
    const checkinState = checkinStore.getState();
    const userState = userStore.getState();

    // These properties need to be added to the order store
    const scheduleShiftIdTracking = (orderState as any).scheduleShiftIdTracking;
    const driverDetails = userState.loggedInUser;
    const driverVehicleId = checkinState.driverVehicleId;
    const deviceId = checkinState.driverVehicleDetails?.vehicle_devices?.[0]?.device_id || null;

    // Log the data for debugging
    console.log("Location tracking data:", {
      scheduleShiftIdTracking,
      driverDetails: driverDetails?.id,
      driverVehicleId,
      deviceId
    });

    // Check if all required data is available
    if (
      !scheduleShiftIdTracking ||
      !driverDetails?.id ||
      !driverVehicleId
    ) {
      console.error(
        "Essential tracking data is missing from stores. Cannot start tracking.",
        {
          scheduleShiftIdTracking: scheduleShiftIdTracking ? 'Available' : 'Missing',
          driverDetails: driverDetails?.id ? 'Available' : 'Missing',
          driverVehicleId: driverVehicleId ? 'Available' : 'Missing'
        }
      );
      // Show error to user
      set({ error: "Could not start tracking. Required driver data is missing." });
      return;
    }

    console.log("Starting location tracking...");
    set({ isTracking: true });
    AsyncStorage.setItem(TRACKING_ACTIVE_KEY, "true");

    // The function that gets coordinates and sends them
    const sendCurrentLocation = async () => {
      try {
        const coords = await getCurrentLocation();

        set({
          latitude: coords.latitude,
          longitude: coords.longitude,
          error: null
        });

        try {
          await orderService.sendDriverLocation({
            driverId: checkinStore.getState().driverDetails.id,
            deviceId: orderStore.getState().currentDriverOrder?.driver_vehicle?.vehicle?.vehicle_devices[0]?.device_id || null,
            driverVehicleId: checkinStore.getState().driverVehicleId as string,
            shiftScheduleId: checkinStore.getState().shiftSchedule?.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          console.log(
            `Location sent at ${new Date().toLocaleTimeString()}`,
          );
        } catch (error) {
          console.error("Error updating live location:", error);
          set({ error: "Error sending location data" });
        }
      } catch (err) {
        console.error("Geolocation error:", err);
        set({ error: "Failed to get current location" });
        // If permission is denied, stop tracking.
        // Note: We can't check error codes like in browser, so we'll be more conservative
      }
    };

    // Immediately get location, then start interval
    sendCurrentLocation();
    const intervalId = setInterval(sendCurrentLocation, 9000); // every 15 min
    set({ intervalId });
  },

  /**
   * Action to stop live location tracking.
   * This is called on checkout, logout, or when the app is closed.
   */
  stopLiveLocationTracking: () => {
    const state = locationTrackingStore.getState();

    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      set({ intervalId: null });
    }

    set({ isTracking: false });
    AsyncStorage.removeItem(TRACKING_ACTIVE_KEY);
    console.log("Location tracking stopped.");
  },

  /**
   * Initializes the store to a clean state on app load.
   * This ensures tracking is always off until explicitly started.
   */
  initialize: async () => {
    // Check if tracking was active before app was closed
    const wasTracking = await AsyncStorage.getItem(TRACKING_ACTIVE_KEY);

    if (wasTracking === "true") {
      // If tracking was active, stop it to give control to the user
      const { stopLiveLocationTracking } = locationTrackingStore.getState();
      stopLiveLocationTracking();
    } else {
      // Ensure tracking is stopped on app load
      const state = locationTrackingStore.getState();
      if (state.intervalId !== null) {
        clearInterval(state.intervalId);
        set({ intervalId: null, isTracking: false });
      }
    }
  },
}));

export default createSelectors(locationTrackingStore);