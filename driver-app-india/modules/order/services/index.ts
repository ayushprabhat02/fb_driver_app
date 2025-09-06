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

  // streaming functionality  
  UpsertStepTaskActionDocument,
  UpsertStepTaskActionMutation,
  UpsertStepTaskActionMutationVariables,
  MarkTaskLiveDispensingDocument,
  MarkTaskLiveDispensingMutation,
  MarkTaskLiveDispensingMutationVariables,
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

  // public async fetchOrderForDriverIncomplete(
  //   args: FetchOrderForDriverIncompleteQueryVariables,
  // ) {
  //   const response: FetchOrderForDriverIncompleteQuery = await callQuery({
  //     queryDocument: FetchOrderForDriverIncompleteDocument,
  //     variables: {...args},
  //   });

  //   orderStore.setState({
  //     incompleteDriverOrders: response.task[0],
  //   });
  // }

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

  /**
   * @method upsertStepTaskAction
   * @description Upserts step task action for streaming functionality
   * @args UpsertStepTaskActionMutationVariables
   */
  public async upsertStepTaskAction(args: {object: any}) {
    try {
      console.log('UpsertStepTaskAction API call:', args);
      
      // Use raw GraphQL mutation call 
      const response = await callMutation({
        queryDocument: `
          mutation upsertTaskValue($object: upsertTaskValueInput!) {
            upsertTaskValue(object: $object) {
              id
              is_updated
              is_inserted
            }
          }
        ` as any,
        variables: {
          object: args.object,
        },
      });

      return response.upsertTaskValue;
    } catch (error) {
      console.error('Error upserting step task action:', error);
      throw new Error('Failed to upsert step task action');
    }
  }

  /**
   * @method updateTaskLiveDispensingStatus
   * @description Updates task live dispensing status
   * @args MarkTaskLiveDispensingMutationVariables
   */
  public async updateTaskLiveDispensingStatus(args: {task_id: string; is_live_dispensing: boolean}) {
    const response: MarkTaskLiveDispensingMutation = await callMutation({
      queryDocument: MarkTaskLiveDispensingDocument,
      variables: {
        id: args.task_id, // Map task_id to id parameter
        is_live_dispensing: args.is_live_dispensing,
      },
    });

    return response;
  }

  /**
   * @method updateAssetQty
   * @description Updates the quantity dispensed for a customer asset
   * @args {customerAssetId: string, customerOrderId: string, qty: number}
   */
  public async updateAssetQty(args: {
    customerAssetId: string;
    customerOrderId: string;
    qty: number;
  }) {
    try {
      // Log the API call for debugging
      console.log('UpdateAssetQty API call:', args);
      
      // Use raw GraphQL mutation call since types may not be generated yet
      const response = await callMutation({
        queryDocument: `
          mutation updateAssetQty(
            $customerAssetId: uuid
            $customerOrderId: uuid
            $qty: numeric
          ) {
            update_customer_order_customer_asset(
              where: {
                customer_asset_id: { _eq: $customerAssetId }
                customer_order_id: { _eq: $customerOrderId }
              }
              _set: { quantity_dispensed: $qty }
            ) {
              returning {
                customer_asset_id
                id
                is_active
                quantity_dispensed
              }
            }
          }
        ` as any,
        variables: {
          customerAssetId: args.customerAssetId,
          customerOrderId: args.customerOrderId,
          qty: args.qty,
        },
      });
      
      return response.update_customer_order_customer_asset?.returning[0];
    } catch (error) {
      console.error('Error updating asset quantity:', error);
      throw new Error('Failed to update asset quantity');
    }
  }

  /**
   * @method updateTotalizerReading
   * @description Updates the totalizer reading for a vehicle
   * @args {totalizer_reading: number, vehicle_id: string}
   */
  public async updateTotalizerReading(args: {
    totalizer_reading: number;
    vehicle_id: string;
  }) {
    try {
      // Log the API call for debugging
      console.log('UpdateTotalizerReading API call:', args);
      
      // TODO: Implement when GraphQL types are available and generated
      // For now, return mock response
      console.log('UpdateTotalizerReading - using mock response');
      
      // Return mock response for now - will be replaced with actual API call
      return {
        totalizer_reading: args.totalizer_reading,
      };
    } catch (error) {
      console.error('Error updating totalizer reading:', error);
      throw new Error('Failed to update totalizer reading');
    }
  }

  /**
   * @method markOrderDispensing
   * @description Marks an order as dispensing
   * @args {task_id: string}
   */
  public async markOrderDispensing(args: {task_id: string}) {
    try {
      console.log('MarkOrderDispensing API call:', args);
      
      // Use raw GraphQL mutation call
      const response = await callMutation({
        queryDocument: `
          mutation markOrderDispensing(
            $id: uuid!
            $state: task_state_enum
          ) {
            update_task_by_pk(
              pk_columns: { id: $id }
              _set: { state: $state }
            ) {
              id
              state
              category
            }
          }
        ` as any,
        variables: {
          id: args.task_id,
          state: 'DISPENSING',
        },
      });
      
      return response.update_task_by_pk;
    } catch (error) {
      console.error('Error marking order as dispensing:', error);
      throw new Error('Failed to mark order as dispensing');
    }
  }

  /**
   * @method markOrderCompleted
   * @description Marks an order as completed/delivered
   * @args {task_id: string}
   */
  public async markOrderCompleted(args: {task_id: string}) {
    try {
      console.log('MarkOrderCompleted API call:', args);
      
      const response = await callMutation({
        queryDocument: `
          mutation markOrderCompleted(
            $id: uuid!
            $state: task_state_enum
          ) {
            update_task_by_pk(
              pk_columns: { id: $id }
              _set: { state: $state }
            ) {
              id
              state
              category
            }
          }
        ` as any,
        variables: {
          id: args.task_id,
          state: 'DELIVERED',
        },
      });
      
      return response.update_task_by_pk;
    } catch (error) {
      console.error('Error marking order as completed:', error);
      throw new Error('Failed to mark order as completed');
    }
  }

  /**
   * @method createInvoice
   * @description Creates an invoice for the order
   * @args {delivery_fee: string, actual_amount: string, dispensedQty: string, invoiced_items: object[], charges: number, tax: number, discount: number}
   */
  public async createInvoice(args: {
    delivery_fee: string;
    actual_amount: string;
    dispensedQty: string;
    invoiced_items: object[];
    charges: number;
    tax: number;
    discount: number;
    customer_order_id: string;
  }) {
    try {
      console.log('CreateInvoice API call:', args);
      
      const response = await callMutation({
        queryDocument: `
          mutation createInvoice($object: invoice_insert_input!) {
            insert_invoice_one(object: $object) {
              id
              customer_order_id
              amount
              delivery_fee
              is_active
            }
          }
        ` as any,
        variables: {
          object: {
            customer_order_id: args.customer_order_id,
            delivery_fee: args.delivery_fee,
            invoice_date: new Date().toISOString(),
            is_active: true,
            amount: args.actual_amount,
            delivery_fee_no_tax: args.charges,
            delivery_tax: args.tax,
            discount_amount: args.discount,
            invoiced_items: {
              data: args.invoiced_items,
            },
          },
        },
      });
      
      return response.insert_invoice_one;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * @method addTransactionLogs
   * @description Adds transaction logs for vehicle inventory
   * @args {quantity: number, product_var_id: string, fillup_request_id: string | null, customer_order_id: string | null, vehicle_id: string, transaction_type: string}
   */
  public async addTransactionLogs(args: {
    quantity: number;
    product_var_id: string;
    fillup_request_id: string | null;
    customer_order_id: string | null;
    vehicle_id: string;
    transaction_type: string;
  }) {
    try {
      console.log('AddTransactionLogs API call:', args);
      
      const response = await callMutation({
        queryDocument: `
          mutation addTransactionLogs($object: vehicle_inventory_transaction_log_insert_input!) {
            insert_vehicle_inventory_transaction_log_one(object: $object) {
              id
              quantity
              unit
              transaction_type
              vehicle_id
              customer_order_id
            }
          }
        ` as any,
        variables: {
          object: {
            customer_order_id: args.customer_order_id,
            fillup_request_id: args.fillup_request_id,
            product_variation_id: args.product_var_id,
            quantity: args.quantity,
            unit: 'liters',
            vehicle_id: args.vehicle_id,
            transaction_type: args.transaction_type,
            is_active: true,
          },
        },
      });
      
      return response.insert_vehicle_inventory_transaction_log_one;
    } catch (error) {
      console.error('Error adding transaction logs:', error);
      throw new Error('Failed to add transaction logs');
    }
  }

  /**
   * @method fetchDeliveryFee
   * @description Fetches delivery fee for an order
   * @args {customer_order_id: string, total_dispensed_qty: number}
   */
  public async fetchDeliveryFee(args: {
    customer_order_id: string;
    total_dispensed_qty: number;
  }) {
    try {
      console.log('FetchDeliveryFee API call:', args);
      
      const response = await callQuery({
        queryDocument: `
          query fetchDeliveryFee(
            $customer_order_id: uuid!
            $total_dispensed_qty: numeric!
          ) {
            fetchDeliveryFee(
              customer_order_id: $customer_order_id
              total_dispensed_qty: $total_dispensed_qty
            ) {
              delivery_fees
              delivery_fees_no_tax
              total_tax
              discount
            }
          }
        ` as any,
        variables: {
          customer_order_id: args.customer_order_id,
          total_dispensed_qty: args.total_dispensed_qty,
        },
      });
      
      return response.fetchDeliveryFee;
    } catch (error) {
      console.error('Error fetching delivery fee:', error);
      throw new Error('Failed to fetch delivery fee');
    }
  }

  /**
   * @method checkServiceability
   * @description Checks serviceability for given coordinates
   * @args {lat: number, lng: number}
   */
  public async checkServiceability(args: {lat: number; lng: number}) {
    try {
      console.log('CheckServiceability API call:', args);
      
      const response = await callQuery({
        queryDocument: `
          query checkServiceability(
            $latitude: numeric!
            $longitude: numeric!
          ) {
            checkServiceAblility(
              latitude: $latitude
              longitude: $longitude
            ) {
              partner {
                id
                name
                partner_localities {
                  id
                  product_partner_localities_prices {
                    parent_id
                    sale_price
                  }
                }
              }
            }
          }
        ` as any,
        variables: {
          latitude: args.lat,
          longitude: args.lng,
        },
      });
      
      return response.checkServiceAblility?.partner?.[0];
    } catch (error) {
      console.error('Error checking serviceability:', error);
      throw new Error('Failed to check serviceability');
    }
  }

  /**
   * @method fetchDeliveryProductsWithPrices
   * @description Fetches delivery products with prices
   * @args {id: string}
   */
  public async fetchDeliveryProductsWithPrices(args: {id: string}) {
    try {
      console.log('FetchDeliveryProductsWithPrices API call:', args);
      
      const response = await callQuery({
        queryDocument: `
          query fetchProductPartnerLocalitiesPrice($id: uuid!) {
            product_partner_localities_price(where: { id: { _eq: $id } }) {
              id
              sale_price
              unit_price
            }
          }
        ` as any,
        variables: {
          id: args.id,
        },
      });
      
      return response.product_partner_localities_price;
    } catch (error) {
      console.error('Error fetching delivery products with prices:', error);
      throw new Error('Failed to fetch delivery products with prices');
    }
  }
}

const orderService = OrderService.getInstance();

export default orderService;
