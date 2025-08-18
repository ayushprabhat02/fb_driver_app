// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  Support_Tickets_Category,
  Support_Tickets_Subcategory,
  Support_Tickets,
  FetchAllOrgUsersByTypeQuery,
  FetchTicketDetailsFromErpMutation,
} from '@/generated/graphql';

type LoaderTypes = 'support';

type Loaders = {
  support: boolean;
};

type SupportStore = {
  supportTicketCategories: Support_Tickets_Category[];
  supportTicketSubCategories: Support_Tickets_Subcategory[];
  supportTickets: Support_Tickets[];
  supportTicketsOffset: number;
  supportTicketsCnt: number;
  supportTicketsHasMoreOrders: boolean;
  allUserOrgsForSupportProfiles: FetchAllOrgUsersByTypeQuery['organization_user'];
  erpTicketDetails:
    | FetchTicketDetailsFromErpMutation['fetchSupportTicketErp']
    | undefined;

  // loading states
  loaders: Loaders;
};

type SupportActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetSupportStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */
const supportInitialState: SupportStore = {
  supportTicketCategories: [],
  supportTicketSubCategories: [],
  allUserOrgsForSupportProfiles: [],
  supportTickets: [],
  erpTicketDetails: undefined,
  supportTicketsOffset: 0,
  supportTicketsCnt: 0,
  supportTicketsHasMoreOrders: false,
  loaders: {
    support: false,
  },
};

const supportPaginationInitialState = {
  supportTickets: [],
  supportTicketsOffset: 0,
  supportTicketsCnt: 0,
  supportTicketsHasMoreOrders: false,
};

const supportStore = create<SupportStore & SupportActions>(set => ({
  ...supportInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  resetSupportStore: () => set(supportInitialState),

  // reset pagination
  resetSupportPagination: () =>
    set(state => ({
      ...state,
      ...supportPaginationInitialState,
    })),
}));

export default createSelectors(supportStore);
