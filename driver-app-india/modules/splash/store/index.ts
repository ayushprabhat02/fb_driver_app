// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

type UserStore = {
  isLoading: boolean;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const userInitialState: UserStore = {
  // controls which navigator is to be rendered
  isLoading: true,
};

const userStore = create<UserStore>(() => ({
  ...userInitialState,
}));

export default createSelectors(userStore);
