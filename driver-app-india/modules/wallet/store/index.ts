// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  FetchPaymentCardsByOrgUserIdQuery,
  FetchSingleUserWalletQuery,
  FetchUserLedgerOrgIdQuery,
  PendingInvoicesMutation,
} from '@/generated/graphql';

type LoaderTypes =
  | 'fetchWalletData'
  | 'initiatePayment'
  | 'fetchPendingInvoices';

type Loaders = {
  fetchWalletData: boolean;
  initiatePayment: boolean;
  fetchPendingInvoices: boolean;
};

type WalletStore = {
  currentWallet: FetchSingleUserWalletQuery['checkWalletBalance'] | undefined;
  userLedger: FetchUserLedgerOrgIdQuery['user_ledger'];
  userLedgerOffset: number;
  userLedgerCnt: number;
  userLedgerHasMoreItems: boolean;
  pendingInvoice: PendingInvoicesMutation['fetchPostpaidInvoice'] | undefined;
  deliveryWalletAmountExists: boolean;
  orderId: string;
  selectedInvoiceCodes: string[];

  // to keep track of how many times the page was visited
  pageVisitCount: number;

  // icici card integration
  paymentCards:
    | FetchPaymentCardsByOrgUserIdQuery['fetchPaymentCards']['data']
    | undefined;
  iciciUrl: string;
  iciciWalletTransactionId: string;
  iciciAmount: string;
  knockoffAmount: string;

  // loading states
  loaders: Loaders;

  // axis card integration
  axisAmount: string;
  axisWalletTransactionId: string;
  axisKnockoffAmount: string;
};

type AddressActions = {
  startLoader: (loaderType: LoaderTypes) => void;
  stopLoader: (loaderType: LoaderTypes) => void;
  resetLedgerPagination: () => void;
  resetWalletStore: () => void;
};

/*
 * NOTE - apart from loader actions, all the states will be set from the services file
 * Hence make sure to use 'setState' method provided by zustand to update the state
 */

const walletInitialState: WalletStore = {
  currentWallet: undefined,
  userLedger: [],
  userLedgerOffset: 0,
  userLedgerCnt: 0,
  userLedgerHasMoreItems: false,
  pendingInvoice: undefined,
  deliveryWalletAmountExists: false,
  orderId: '',
  pageVisitCount: 0,
  selectedInvoiceCodes: [],

  // icici card integration
  paymentCards: undefined,
  iciciUrl: '',
  iciciWalletTransactionId: '',
  iciciAmount: '',
  knockoffAmount: '',

  loaders: {
    fetchWalletData: false,
    initiatePayment: false,
    fetchPendingInvoices: false,
  },

  // axis card integration
  axisAmount: '',
  axisWalletTransactionId: '',
  axisKnockoffAmount: '',
};

const ledgerPaginationInitialState = {
  userLedger: [],
  userLedgerOffset: 0,
  userLedgerCnt: 0,
  userLedgerHasMoreItems: false,
};

const walletStore = create<WalletStore & AddressActions>(set => ({
  ...walletInitialState,

  // loader actions
  startLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: true}};
    }),

  stopLoader: (loaderType: LoaderTypes) =>
    set(state => {
      return {...state, loaders: {...state.loaders, [loaderType]: false}};
    }),

  // reset wallet store
  resetWalletStore: () => set(walletInitialState),

  resetLedgerPagination: () =>
    set(state => ({
      ...state,
      ...ledgerPaginationInitialState,
    })),
}));

export default createSelectors(walletStore);
