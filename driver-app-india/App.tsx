// dependencies
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import './utils/ignoreWarnings';

// navigator
import { createStackNavigator } from '@react-navigation/stack';

// store
import { authStore, splashStore, locationTrackingStore, checkinStore } from './globalStore';

// services
import { shiftValidator } from '@/services/ShiftValidator';

// services

// components
import SplashScreen from '@/modules/splash/screens';
import AuthNavigator from './modules/auth/navigator';
import ProtectedNavigator from './navigator';

/**
 * Importing the ReactotronConfig file will allow us to use the Reactotron tool to debug our app.
 * Needs to be added in dev environment only.
 * No dev env available in this project as of now.
 */
import './ReactotronConfig';
import { FocusAwareStatusBar } from './components';

const StackNavigator = createStackNavigator();

function App(): React.JSX.Element {
  const isLoading = splashStore.use.isLoading();
  const initializeSplash = splashStore.use.initializeSplash();
  const graphqlClient = authStore.use.graphQLClient();

  useEffect(() => {
    initializeSplash();
    // Initialize location tracking
    locationTrackingStore.getState().initialize();
  }, [initializeSplash]);

  // ========================================
  // SHIFT VALIDATION - App Level (Global)
  // ========================================
  useEffect(() => {
    // Subscribe to auth and checkin store changes
    const unsubscribe = authStore.subscribe((state) => {
      const isAuthenticated = !!state.graphQLClient;
      const driverVehicleId = checkinStore.getState().driverVehicleId;

      if (isAuthenticated && driverVehicleId) {
        console.log('[App] Starting shift validation for driver vehicle:', driverVehicleId);
        shiftValidator.start(driverVehicleId);
      } else {
        console.log('[App] Stopping shift validation (not authenticated or no driver vehicle)');
        shiftValidator.stop();
      }
    });

    // Also subscribe to checkin store for driver vehicle ID changes
    const unsubscribeCheckin = checkinStore.subscribe((state) => {
      const isAuthenticated = !!authStore.getState().graphQLClient;
      const driverVehicleId = state.driverVehicleId;

      if (isAuthenticated && driverVehicleId) {
        console.log('[App] Starting shift validation for driver vehicle:', driverVehicleId);
        shiftValidator.start(driverVehicleId);
      } else {
        console.log('[App] Stopping shift validation (no driver vehicle)');
        shiftValidator.stop();
      }
    });

    // Check initial state and start if already authenticated
    const authState = authStore.getState();
    const checkinState = checkinStore.getState();
    if (authState.graphQLClient && checkinState.driverVehicleId) {
      console.log('[App] Initial start of shift validation for:', checkinState.driverVehicleId);
      shiftValidator.start(checkinState.driverVehicleId);
    }

    return () => {
      unsubscribe();
      unsubscribeCheckin();
      shiftValidator.stop();
    };
  }, []);

  /**
   * If the app is still loading, show the splash screen.
   * refer to https://reactnavigation.org/docs/auth-flow#what-we-need
   */
  if (isLoading) {
    return <SplashScreen />;
  }



  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>

        <GestureHandlerRootView style={{ flex: 1 }}>
          <MenuProvider>
            <NavigationContainer>
              <BottomSheetModalProvider>
                <FocusAwareStatusBar />
                {/*
               * * We are rendering the AuthScreens and Protected screen conditionally to handle authentication.
               * * This was done in accordance with the React Navigation documentation - https://reactnavigation.org/docs/auth-flow#what-we-need
               */}
                <StackNavigator.Navigator screenOptions={{ headerShown: false }}>
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
