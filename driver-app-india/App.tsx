// dependencies
import React, {useEffect, useRef} from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import {MenuProvider} from 'react-native-popup-menu';
import {DateTime} from 'luxon';
import {
  FetchDriverVehicleIdDocument,
  FetchDriverVehicleIdQuery,
} from './generated/graphql';
import {AppState} from 'react-native';
import './utils/ignoreWarnings';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

// navigator
import {createStackNavigator} from '@react-navigation/stack';

// store
import {splashStore, authStore, checkinStore} from './globalStore';

// services
import {signOut} from './modules/auth/services';
import {getDriverVehicleId} from './utils/localStorage';
import {callQuery} from './utils/client';

// components
import AuthNavigator from './modules/auth/navigator';
import SplashScreen from '@/modules/splash/screens';
import ProtectedNavigator from './navigator';

/**
 * Importing the ReactotronConfig file will allow us to use the Reactotron tool to debug our app.
 * Needs to be added in dev environment only.
 * No dev env available in this project as of now.
 */
import './ReactotronConfig';
import {FocusAwareStatusBar} from './components';

const StackNavigator = createStackNavigator();

function App(): React.JSX.Element {
  const isLoading = splashStore.use.isLoading();
  const graphqlClient = authStore.use.graphQLClient();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Periodic shift validation - similar to Vue.js App.vue monitoring
  useEffect(() => {
    const validateShiftPeriodically = async () => {
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
          console.log('No active shift found, logging out user');
          Toast.show({
            type: 'info',
            text1: 'Shift Ended',
            text2: 'Your shift has ended. Please log in again.',
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
        // The validation will retry on the next interval
      }
    };

    // Set up periodic validation every 5 minutes (300000ms)
    if (graphqlClient) {
      intervalRef.current = setInterval(validateShiftPeriodically, 300000);

      // Also validate immediately when app becomes active
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
          validateShiftPeriodically();
        }
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange,
      );

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        subscription?.remove();
      };
    }
  }, [graphqlClient, driverVehicleId]);

  /**
   * If the app is still loading, show the splash screen.
   * refer to https://reactnavigation.org/docs/auth-flow#what-we-need
   */
  if (isLoading) {
    return <SplashScreen />;
  }

  console.log('GraphQL Client:', graphqlClient);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex: 1}}>

      <GestureHandlerRootView style={{flex: 1}}>
        <MenuProvider>
          <NavigationContainer>
            <BottomSheetModalProvider>
              <FocusAwareStatusBar />
              {/*
               * * We are rendering the AuthScreens and Protected screen conditionally to handle authentication.
               * * This was done in accordance with the React Navigation documentation - https://reactnavigation.org/docs/auth-flow#what-we-need
               */}
              <StackNavigator.Navigator screenOptions={{headerShown: false}}>
                {!graphqlClient ? (
                  <StackNavigator.Screen
                    component={AuthNavigator}
                    name="authnav"
                  />
                ) : (
                  <StackNavigator.Screen
                    component={ProtectedNavigator as React.ComponentType}
                    name="protected"
                    key="_protected"
                  />
                )}
              </StackNavigator.Navigator>
            </BottomSheetModalProvider>
          </NavigationContainer>
        </MenuProvider>
      </GestureHandlerRootView>

      <Toast />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
