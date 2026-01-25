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

// Initialize i18n (must be imported early)
import './utils/i18n';

// navigator
import { createStackNavigator } from '@react-navigation/stack';

// store
import { authStore, splashStore, locationTrackingStore } from './globalStore';

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

  // Periodic shift validation moved to HomeLandingPage.tsx to only run when on home screen

  /**
   * If the app is still loading, show the splash screen.
   * refer to https://reactnavigation.org/docs/auth-flow#what-we-need
   */
  if (isLoading) {
    return <SplashScreen />;
  }



  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

export default App;
