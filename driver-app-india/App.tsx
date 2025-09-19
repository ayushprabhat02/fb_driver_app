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
  const initializeSplash = splashStore.use.initializeSplash();
  const graphqlClient = authStore.use.graphQLClient();

  useEffect(() => {
    initializeSplash();
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
