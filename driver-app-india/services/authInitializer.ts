// src/services/authInitializer.ts

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {DateTime} from 'luxon';

// Global Stores
import {authStore, splashStore} from '@/globalStore';

// Services & Utilities
import {
  checkHasuraId,
  addHasuraClaimsViaRefreshToken,
  signOut,
} from '@/modules/auth/services';
import {initializeClient} from '@/utils/client';

// This function holds all the logic you had in SplashScreen
const initializeAuthListener = () => {
  const {
    setGraphQLClient,
    setFirebaseUser,
    setAuthToken,
    setXHasuraId,
    stopLoader,
    setIsNewUser,
    resetAuthStore,
  } = authStore.getState();

  // Helper functions
  const isNewUserCheck = (creationTime?: string, lastSignInTime?: string) => {
    if (!creationTime || !lastSignInTime) return false;
    const diff = DateTime.fromISO(lastSignInTime).diff(
      DateTime.fromISO(creationTime),
      ['seconds'],
    );
    return diff.seconds <= 15;
  };

  const fireRefreshToken = async (user: FirebaseAuthTypes.User | null) => {
    // Logic to handle token refresh and claim setting
    await addHasuraClaimsViaRefreshToken(3000, user?.uid as string, () => {
      resetAuthStore();
      signOut();
      stopLoader('auth');
    });

    setTimeout(async () => {
      const updatedToken = await user?.getIdToken(true);
      const updatedTokenResult = await user?.getIdTokenResult(true);
      const hasuraIdExists = checkHasuraId(updatedTokenResult);

      if (!hasuraIdExists?.hasuraId) {
        await fireRefreshToken(user); // Recursive call if claims not set yet
      } else {
        if (hasuraIdExists?.role !== 'tower_driver') {
          Toast.show({type: 'error', text1: 'Unauthorized account role.'});
          setTimeout(() => {
            signOut();
            resetAuthStore();
          }, 1500);
          return;
        }

        const isNew = isNewUserCheck(
          user?.metadata.creationTime,
          user?.metadata.lastSignInTime,
        );
        setIsNewUser(isNew);
        const client = initializeClient();
        setGraphQLClient(client);
        setXHasuraId(hasuraIdExists.hasuraId);
        setAuthToken(updatedToken as string);
        setFirebaseUser(user);
      }
    }, 500);
  };

  // The main listener - optimized for faster loading
  auth().onAuthStateChanged(async user => {
    try {
      if (user) {
        // Check if client is already initialized to prevent duplicate initialization
        const currentClient = authStore.getState().graphQLClient;
        if (currentClient) {
          splashStore.setState({isLoading: false});
          return;
        }

        const tokenResult = await user.getIdTokenResult();
        const hasuraIdExists = checkHasuraId(tokenResult);

        if (!hasuraIdExists?.hasuraId || !hasuraIdExists?.isDriverAccount) {
          Toast.show({type: 'error', text1: 'Unauthorized account role.'});
          setTimeout(() => signOut(), 1500);
          splashStore.setState({isLoading: false});
          return;
        }

        const isNew = isNewUserCheck(
          user.metadata.creationTime,
          user.metadata.lastSignInTime,
        );
        setIsNewUser(isNew);
        setXHasuraId(hasuraIdExists.hasuraId);
        
        const token = await user.getIdToken();
        setAuthToken(token);
        setFirebaseUser(user);

        // Initialize GraphQL client only once
        const graphqlClient = initializeClient();
        setGraphQLClient(graphqlClient);
      } else {
        setGraphQLClient(null);
        resetAuthStore();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setGraphQLClient(null);
      resetAuthStore();
    } finally {
      splashStore.setState({isLoading: false});
    }
  });
};

export {initializeAuthListener};
