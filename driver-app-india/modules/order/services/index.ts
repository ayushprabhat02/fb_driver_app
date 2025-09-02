import {
  FetchOrganizationUpcomingOrdersQueryVariables,
  FetchOrganizationUpcomingOrdersDocument,
  FetchOrganizationUpcomingOrdersQuery,
  FetchOrderForDriverIncompleteQueryVariables,
  FetchOrderForDriverIncompleteQuery,
  FetchOrderForDriverIncompleteDocument,
} from './../../../generated/graphql';
/**
 * @module Order
 * @description This is the service file for the order module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// store
import orderStore from '../store';

// graphql-documents
import {
  CancelOrderByUserDocument,
  CancelOrderByUserMutation,
  CancelOrderByUserMutationVariables,
  FetchCancellationReasonsByReasonTypeDocument,
  FetchCancellationReasonsByReasonTypeQuery,
  FetchCancellationReasonsByReasonTypeQueryVariables,
  FetchCustomerOrderByIdDocument,
  FetchCustomerOrderByIdQuery,
  FetchDeliveryOrderByIdQueryVariables,
  // delivery order list
  FetchDeliveryOrderByStateDocument,
  FetchDeliveryOrderByStateQuery,
  FetchDeliveryOrderByStateQueryVariables,
  // delivery order state flow
  FetchDeliveryOrderStateflowDocument,
  FetchDeliveryOrderStateflowQuery,
  FetchDeliveryOrderStateflowQueryVariables,
  // download invoice
  FetchSalesInvoicePdfDocument,
  FetchSalesInvoicePdfQuery,
  FetchSalesInvoicePdfQueryVariables,

  // customer order status
  FetchOrderItemStatusDocument,
  FetchOrderItemStatusQuery,
  FetchOrderItemStatusQueryVariables,

  // Fetch customer order details by code
  FetchCustomerOrderDetailsByCodeDocument,
  FetchCustomerOrderDetailsByCodeQuery,
  FetchCustomerOrderDetailsByCodeQueryVariables,

  // verify order
  VerifyPlacedOrderOtpDocument,
  VerifyPlacedOrderOtpQuery,
  VerifyPlacedOrderOtpQueryVariables,

  // fetch customer order details by ID
  FetchCustomerOrderDetailsByIdDocument,
  FetchCustomerOrderDetailsByIdQuery,
  FetchCustomerOrderDetailsByIdQueryVariables,

  // fetch order for driver incomplete

  // fetch task value
  FetchTaskValueDocument,
  FetchTaskValueQuery,
  FetchTaskValueQueryVariables,

  // upsert task value
  UpsertTaskValueDocument,
  UpsertTaskValueMutation,
  UpsertTaskValueMutationVariables,

  // customer ordered assets
  GetCustomerOrderedAssetsDocument,
  GetCustomerOrderedAssetsQuery,
  GetCustomerOrderedAssetsQueryVariables,
} from '@/generated/graphql';

/**
 * @class OrderService
 * @description This class represents the service for the order module.
 */
class OrderService {
  private static instance: OrderService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the OrderService class.
   * @returns {OrderService} The singleton instance of the OrderService class.
   */
  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * @method getDeliveryOrdersByState
   * @description Retrieves the active user's delivery orders.
   * @args FetchDeliveryOrderByStateQueryVariables
   */

  public async getDeliveryOrdersByState(
    args: FetchDeliveryOrderByStateQueryVariables,
  ) {
    const currentOrdersInView = orderStore.getState()?.currentOrdersInView;
    const response: FetchDeliveryOrderByStateQuery = await callQuery({
      queryDocument: FetchDeliveryOrderByStateDocument,
      variables: {
        ...args,
      },
    });
    const existingOrders = currentOrdersInView;
    const fetchedOrders = response.customer_order;
    const mergedOrders = [
      ...existingOrders,
      ...fetchedOrders.filter(
        newOrder =>
          !existingOrders.some(
            existingOrder => existingOrder.id === newOrder.id,
          ),
      ),
    ];
    const maxCount = response.customer_order_aggregate.aggregate
      ?.count as number;
    const totalFetchedCount = mergedOrders.length;
    orderStore.setState(state => ({
      ...state,
      currentOrdersInView: mergedOrders.sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() -
          new Date(a.created_at as string).getTime(),
      ),
      currentOrdersInViewClone: mergedOrders.sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() -
          new Date(a.created_at as string).getTime(),
      ),
      currentOrdersInViewCnt: response.customer_order_aggregate.aggregate
        ?.count as number,
      currentOrdersInViewHasMoreOrders:
        fetchedOrders.length === 0 || totalFetchedCount >= maxCount
          ? false
          : true,
    }));
    return response;
  }

  /**
   * @method fetchDeliveryOrderStateFlow
   * @description Retrieves the state flow of the delivery order ( displayed in stepper on order details page ).
   * @args FetchDeliveryOrderStateflowQueryVariables
   */
  public async fetchDeliveryOrderStateFlow(
    args: FetchDeliveryOrderStateflowQueryVariables,
  ) {
    const response: FetchDeliveryOrderStateflowQuery = await callQuery({
      queryDocument: FetchDeliveryOrderStateflowDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      currentOrderStateFlow: response.customer_order_item_stateflow,
    }));
  }

  /**
   * @method cancelOrderByUser
   * @description Cancels an order by the user.
   * @args CancelOrderByUserMutationVariables
   */
  public async cancelOrderByUser(args: CancelOrderByUserMutationVariables) {
    const response: CancelOrderByUserMutation = await callMutation({
      queryDocument: CancelOrderByUserDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }

  /**
   * @method fetchCancellationReasonsByReasonType
   * @description Fetches cancellation reasons by reason type.
   * @args FetchCancellationReasonsByReasonTypeQueryVariables
   */
  public async fetchCancellationReasonsByReasonType(
    args: FetchCancellationReasonsByReasonTypeQueryVariables,
  ) {
    const response: FetchCancellationReasonsByReasonTypeQuery = await callQuery(
      {
        queryDocument: FetchCancellationReasonsByReasonTypeDocument,
        variables: {
          ...args,
        },
      },
    );

    orderStore.setState(state => ({
      ...state,
      cancellationReasonsByReasonType: response?.reasons || [],
    }));

    return response.reasons;
  }
  /**
   * @method FetchDeliveryOrderByIdQuery
   * @description Retrieves the state flow of the delivery order ( displayed in stepper on order details page ).
   * @args FetchDeliveryOrderByIdQueryVariables
   */
  public async fetchCustomerOrderById(
    args: FetchDeliveryOrderByIdQueryVariables,
  ) {
    const response: FetchCustomerOrderByIdQuery = await callQuery({
      queryDocument: FetchCustomerOrderByIdDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      singleOrderDetailsId: response.customer_order[0],
    }));

    return response;
  }
  /**
   * @method FetchSalesInvoicePdfQuery
   * @description Retrieves the state flow of the delivery order ( displayed in stepper on order details page ).
   * @args FetchSalesInvoicePdfQuery
   */
  public async fetchSalesInvoicePdfQuery(
    args: FetchSalesInvoicePdfQueryVariables,
  ) {
    const response: FetchSalesInvoicePdfQuery = await callQuery({
      queryDocument: FetchSalesInvoicePdfDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      fetchInvoices: response.fetchSalesInvoicePdf.data as string,
    }));
  }

  public async fetchCustomerOrderStatus(
    args: FetchOrderItemStatusQueryVariables,
  ) {
    const response: FetchOrderItemStatusQuery = await callQuery({
      queryDocument: FetchOrderItemStatusDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      currentOrderStatus: response.fetchOrderItemStatus,
    }));
  }

  /**
   * fetch customer order details by code
   */
  public async fetchCustomerOrderDetailsByCode(
    args: FetchCustomerOrderDetailsByCodeQueryVariables,
  ) {
    const response: FetchCustomerOrderDetailsByCodeQuery = await callQuery({
      queryDocument: FetchCustomerOrderDetailsByCodeDocument,
      variables: {...args},
    });

    return response.customer_order;
  }

  public async fetchOrganizationUpcomingOrders(
    args: FetchOrganizationUpcomingOrdersQueryVariables,
  ) {
    const response: FetchOrganizationUpcomingOrdersQuery = await callQuery({
      queryDocument: FetchOrganizationUpcomingOrdersDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      upcomingOrders: response?.fetchOrganizationUpcomingOrdersOtp?.data,
    }));
  }

  public async verifyPlacedOrderOtp(args: VerifyPlacedOrderOtpQueryVariables) {
    const response: VerifyPlacedOrderOtpQuery = await callQuery({
      queryDocument: VerifyPlacedOrderOtpDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      upcomingOrdersVerify: response?.verifyPlacedOrderOtp,
    }));

    return response.verifyPlacedOrderOtp;
  }

  public async fetchCustomerOrderDetailsById(
    args: FetchCustomerOrderDetailsByIdQueryVariables,
  ) {
    const response: FetchCustomerOrderDetailsByIdQuery = await callQuery({
      queryDocument: FetchCustomerOrderDetailsByIdDocument,
      variables: {...args},
    });

    orderStore.setState(state => ({
      ...state,
      singleOrderDetailsId: response.fetchCustomerOrderDetailsById?.data,
    }));

    return response.fetchCustomerOrderDetailsById?.data;
  }

  public async fetchOrderForDriverIncomplete(
    args: FetchOrderForDriverIncompleteQueryVariables,
  ) {
    const response: FetchOrderForDriverIncompleteQuery = await callQuery({
      queryDocument: FetchOrderForDriverIncompleteDocument,
      variables: {...args},
    });

    orderStore.setState(state => ({
      ...state,
      currentDriverOrder: response.task,
    }));
  }

  /**
   * @method fetchTaskValue
   * @description Fetches task values by task ID
   * @args FetchTaskValueQueryVariables
   */
  public async fetchTaskValue(args: FetchTaskValueQueryVariables) {
    const response: FetchTaskValueQuery = await callQuery({
      queryDocument: FetchTaskValueDocument,
      variables: {
        ...args,
      },
    });
    return response;
  }

  /**
   * @method upsertTaskValue
   * @description Upserts task values by task ID
   * @args UpsertTaskValueMutationVariables
   */
  public async upsertTaskValue(args: UpsertTaskValueMutationVariables) {
    const response: UpsertTaskValueMutation = await callMutation({
      queryDocument: UpsertTaskValueDocument,
      variables: {
        ...args,
      },
    });

    return response;
  }

  public async getAllCustomerOrderedAssets(
    args: GetCustomerOrderedAssetsQueryVariables,
  ) {
    try {
      const response: GetCustomerOrderedAssetsQuery = await callQuery({
        queryDocument: GetCustomerOrderedAssetsDocument,
        variables: {
          ...args,
        },
      });

      // we are doing sorting so that we can show filled asset on the top of the list
      const sortedAssets = [...response.customer_order_customer_asset].sort(
        (a, b) => {
          return (
            Number(b.quantity_dispensed) - Number(a.quantity_dispensed)
          );
        },
      );

      orderStore.setState({
        orderAssets: sortedAssets,
      });

      return sortedAssets;
    } catch (error) {
      throw new Error("error fetching all customer assets");
    }
  }
}

const orderService = OrderService.getInstance();

export default orderService;
