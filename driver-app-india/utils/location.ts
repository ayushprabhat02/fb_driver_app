import Geolocation from 'react-native-geolocation-service';
import {Platform, PermissionsAndroid} from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Requests location permissions for Android
 */
const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location to provide services.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Gets the current location coordinates
 * Falls back to default Delhi coordinates if location is unavailable
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise(async (resolve) => {
    const fallbackCoordinates = {
      latitude: 28.626330828,
      longitude: 77.218499126,
    };

    try {
      // Request permission first
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log('Location permission denied, using fallback coordinates');
        resolve(fallbackCoordinates);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback to default coordinates on error
          resolve(fallbackCoordinates);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } catch (error) {
      console.log('Location service error:', error);
      resolve(fallbackCoordinates);
    }
  });
};

/**
 * Watches the user's location for continuous updates
 */
export const watchLocation = (
  onLocationUpdate: (coordinates: LocationCoordinates) => void,
  onError?: (error: any) => void
): number => {
  return Geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.log('Watch location error:', error);
      if (onError) onError(error);
    },
    {
      enableHighAccuracy: true,
      interval: 5000,
      fastestInterval: 2000,
    }
  );
};

/**
 * Clears location watching
 */
export const clearLocationWatch = (watchId: number): void => {
  Geolocation.clearWatch(watchId);
};