// dependencies
import {create} from 'zustand';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {Client} from 'urql';

// utils
import createSelectors from '@/utils/selectors';

type LoaderTypes = 'auth';

type Loaders = {
  auth: boolean;
  signOut: boolean;
};

type AuthStore = {
  firebaseUser: FirebaseAuthTypes.User | null;
  phone: string;
  authToken: string;
  xHasuraId: string | null;
  graphQLClient: Client | null;
  isNewUser: boolean;
  userRole: 'tower_driver' | 'customer' | null;

  // loading states
  loaders: Loaders;
};

type AuthActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  setPhone: (phone: string) => void;
  setAuthToken: (token: string) => void;
  setFirebaseUser: (user: FirebaseAuthTypes.User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setXHasuraId: (id: string | null) => void;
  resetAuthStore: () => void;
  setGraphQLClient: (client: Client | null) => void;
  setIsNewUser: (isNew: boolean) => void;
  setUserRole: (role: 'tower_driver' | 'customer' | null) => void;
};

export const authIntialState: AuthStore = {
  firebaseUser: null,
  phone: '',
  authToken: '',
  xHasuraId: '',
  graphQLClient: null,
  isNewUser: false,
  userRole: null,

  // loading states
  loaders: {
    auth: false,
    signOut: false,
  },
};

const authStore = create<AuthStore & AuthActions>(set => ({
  ...authIntialState,

  setFirebaseUser: (user: FirebaseAuthTypes.User | null) =>
    set(state => ({...state, firebaseUser: user})),

  setPhone: (phone: string) => set(state => ({...state, phone})),

  setAuthToken: (token: string) => set(state => ({...state, authToken: token})),

  setXHasuraId: (id: string | null) =>
    set(state => ({...state, xHasuraId: id})),

  setGraphQLClient: (client: Client | null) =>
    set(state => ({...state, graphQLClient: client})),

  setIsLoading: (loading: boolean) =>
    set(state => ({...state, isLoading: loading})),

  setIsNewUser: (isNew: boolean) =>
    set(state => ({...state, isNewUser: isNew})),

  setUserRole: (role: 'tower_driver' | 'customer' | null) =>
    set(state => ({...state, userRole: role})),

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // reset auth store
  resetAuthStore: () => set(authIntialState),
}));

export default createSelectors(authStore);
