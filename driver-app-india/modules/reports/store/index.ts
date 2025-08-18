// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {
  CustomerOrderReportIndividualQuery,
  FetchCustomerOrganizationOrdersQuery,
} from '@/generated/graphql';

type ReportLoaderTypes = 'customerOrderReport';

type ReportLoaders = {
  customerOrderReport: boolean;
};

type ReportStore = {
  customerOrderReportData:
    | FetchCustomerOrganizationOrdersQuery['fetchCustomerOrganizationOrders']['data']['orders']
    | [];
  customerOrderReportDataIndividual:
    | CustomerOrderReportIndividualQuery['customer_order_item']
    | [];
  loaders: ReportLoaders;
};

type ReportActions = {
  startLoader: (loaderType: ReportLoaderTypes) => void;
  stopLoader: (loaderType: ReportLoaderTypes) => void;
  resetReportStore: () => void;
};

const reportInitialState: ReportStore = {
  customerOrderReportData: [],
  customerOrderReportDataIndividual: [],
  loaders: {
    customerOrderReport: false,
  },
};

const reportStore = create<ReportStore & ReportActions>(set => ({
  ...reportInitialState,

  startLoader: (loaderType: ReportLoaderTypes) =>
    set(state => ({...state, loaders: {...state.loaders, [loaderType]: true}})),

  stopLoader: (loaderType: ReportLoaderTypes) =>
    set(state => ({
      ...state,
      loaders: {...state.loaders, [loaderType]: false},
    })),

  resetReportStore: () => set(reportInitialState),
}));

export default createSelectors(reportStore);
