// dependencies
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderStore, checkinStore, userStore } from "@/globalStore";
import orderService from "@/modules/order/services";
import { getCurrentLocation } from "@/utils/location";

// utils
import createSelectors from "@/utils/selectors";

const TRACKING_ACTIVE_KEY = "isTrackingActive";

type LocationTrackingStore = {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    isTracking: boolean;
    intervalId: NodeJS.Timeout | null;
    setLatitude: (latitude: number | null) => void;
    setLongitude: (longitude: number | null) => void;
    setError: (error: string | null) => void;
    setIsTracking: (isTracking: boolean) => void;
    setIntervalId: (intervalId: NodeJS.Timeout | null) => void;
    startLiveLocationTracking: () => void;
    stopLiveLocationTracking: () => void;
    initialize: () => void;
};

const initialState = {
    latitude: null,
    longitude: null,
    error: null,
    isTracking: false,
    intervalId: null,
};

const locationTrackingStore = create<LocationTrackingStore>((set, get) => ({
    ...initialState,

    setLatitude: (latitude) => set({ latitude }),
    setLongitude: (longitude) => set({ longitude }),
    setError: (error) => set({ error }),
    setIsTracking: (isTracking) => set({ isTracking }),
    setIntervalId: (intervalId) => set({ intervalId }),

    startLiveLocationTracking: () => {
        const { intervalId } = get();
        if (intervalId) return console.log("Tracking already active.");

        const orderState = orderStore.getState();
        const checkinState = checkinStore.getState();
        const userState = userStore.getState();

        const driverId = checkinState.driverDetails?.id;
        const deviceId =
            orderState.currentDriverOrder?.driver_vehicle?.vehicle?.vehicle_devices?.[0]
                ?.device_id || null;
        const driverVehicleId = checkinState.driverVehicleId;
        const shiftScheduleId = checkinState.shiftSchedule?.id;

        if (!driverId || !driverVehicleId || !shiftScheduleId) {
            set({ error: "Could not start tracking. Required driver data is missing." });
            return console.error("Missing essential tracking data");
        }

        console.log("Starting location tracking...");
        set({ isTracking: true });
        AsyncStorage.setItem(TRACKING_ACTIVE_KEY, "true");

        const sendCurrentLocation = async () => {
            try {
                const coords = await getCurrentLocation();
                set({ latitude: coords.latitude, longitude: coords.longitude, error: null });

                await orderService.sendDriverLocation({
                    driverId,
                    deviceId,
                    driverVehicleId,
                    shiftScheduleId,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });

                console.log(`Location sent at ${new Date().toLocaleTimeString()}`);
            } catch (err) {
                console.error("Location update failed:", err);
                set({ error: "Error sending location data" });
            }
        };

        sendCurrentLocation();
        set({ intervalId: setInterval(sendCurrentLocation, 900000) }); // every 9s
    },

    stopLiveLocationTracking: () => {
        const { intervalId } = get();
        if (intervalId) clearInterval(intervalId);

        set({ intervalId: null, isTracking: false });
        AsyncStorage.removeItem(TRACKING_ACTIVE_KEY);
        console.log("Location tracking stopped.");
    },

    initialize: async () => {
        const wasTracking = await AsyncStorage.getItem(TRACKING_ACTIVE_KEY);
        if (wasTracking === "true") get().stopLiveLocationTracking();
        else if (get().intervalId) {
            clearInterval(get().intervalId!);
            set({ intervalId: null, isTracking: false });
        }
    },
}));

export default createSelectors(locationTrackingStore);
