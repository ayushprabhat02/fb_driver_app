// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

type UserStore = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  initializeSplash: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const userInitialState: UserStore = {
  // controls which navigator is to be rendered
  isLoading: true,
};

const userStore = create<UserStore>((set) => ({
  ...userInitialState,
  setLoading: (loading: boolean) => set({isLoading: loading}),
  initializeSplash: () => {
    set({isLoading: true});
    setTimeout(() => {
      set({isLoading: false});
    }, 2000);
  },
}));

export default createSelectors(userStore);
