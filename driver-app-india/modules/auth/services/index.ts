// dependencies
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {authStore, checkinStore, checkoutStore} from '@/globalStore';
import {initializeClient} from '@/utils/client';
import {clearDriverVehicleId} from '@/utils/localStorage';

const errorMessage = (message: string) => {
  if (message.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please try after some time';
  } else {
    console.log('firebase error', message);
    return 'Make sure your phone number is correct and try again.';
  }
};

export const sendOTP = async (phoneNumber: string, forceResend: boolean) => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(
      phoneNumber,
      forceResend,
    );
    return confirmation;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to send OTP',
      text2: errorMessage((error as any).message),
    });
    console.error('error sending OTP', error);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Signs in a user with their email and password using Firebase Auth.
 * @param email The user's email.
 * @param password The user's password.
 */

export const signInWithEmailPass = async (email: string, password: string) => {
  try {
    const confirmation = await auth().signInWithEmailAndPassword(
      email,
      password,
    );
    console.log('-------confirmation------', JSON.stringify(confirmation));

    return confirmation;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to Login',
      text2: errorMessage((error as any).message),
    });
    console.error('error Login', error);
    throw new Error('error Login');
  }
};

/**
 * * function that adds the user to Hasura claims to user token
 * we wait for a certain amount of time before calling the refresh token function ( 3000ms for now )
 * we wait so that user is added to firebase before adding claims to the token
 * @param timeout in milliseconds
 * @param uid user id
 * @returns
 */
export const addHasuraClaimsViaRefreshToken = (
  timeout: number,
  uid: string,
  errorCallback: () => void,
) => {
  return new Promise(resolve => {
    setTimeout(async () => {
      try {
        const result = await axios.get(
          // todo: this url is different for different environments and should be moved to a config file
          'https://us-central1-fuelbuddy-india.cloudfunctions.net/refreshToken',
          {
            params: {
              uid: `${uid}`,
            },
          },
        );

        resolve(result.data);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Phone number already in use',
          text2: 'Please use a different phone number',
        });
        errorCallback();
        throw new Error('Failed to add hasura claims');
      }
    }, timeout);
  });
};

export const verifyOTP = async (
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string,
  errorCallback: () => void,
) => {
  try {
    const userCredential = await confirmation.confirm(code);

    return userCredential?.user;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'OTP Verification Failed',
      text2: 'Please enter the correct OTP and try again.',
    });
    errorCallback();
    throw new Error('Failed to verify OTP');
  }
};

// export const checkHasuraId = (token: FirebaseAuthTypes.IdTokenResult) => {
//   const hasuraClaim = token?.claims['https://hasura.io/jwt/claims'];

//   if (!hasuraClaim) {
//     return null;
//   } else {
//     return {
//       hasuraId: hasuraClaim['x-hasura-user-id'],
//       role: hasuraClaim['x-hasura-default-role'],
//     };
//   }
// };

export const checkHasuraId = (token: FirebaseAuthTypes.IdTokenResult) => {
  const hasuraClaim = token?.claims['https://hasura.io/jwt/claims'];

  if (!hasuraClaim) return null;

  const allowedRoles = hasuraClaim['x-hasura-allowed-roles'] as string[];
  const defaultRole = hasuraClaim['x-hasura-default-role'] as string;
  const hasuraId = hasuraClaim['x-hasura-user-id'];

  console.log('---allowedRoles---', allowedRoles, 'defaultRole:', defaultRole);

  const isDriver = allowedRoles?.includes('driver');
  const isTowerDriver = allowedRoles?.includes('tower_driver');

  // ✅ Only pass if both conditions met
  if (isDriver && isTowerDriver) {
    return {
      hasuraId,
      role: 'tower_driver', // force role to customer
      isDriverAccount: true,
    };
  }

  return {
    hasuraId: null,
    role: null,
    isDriverAccount: false,
  };
};

export const signOut = async () => {
  try {
    // Clear any locally persisted check-in state so next login starts from check-in
    clearDriverVehicleId();
    checkinStore.getState().resetCheckinStore();

    // Reset the auth store to clear GraphQL client and other auth state
    authStore.getState().resetAuthStore();

    // Additional safeguard to ensure no automatic navigation to checkout
    // Reset checkout store state as well to prevent any checkout flow continuation
    checkoutStore.getState().resetCheckoutStore();

    await auth().signOut();
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Error signing out',
      text2: `${error}`,
    });
    throw new Error('Failed to sign out');
  }
};
