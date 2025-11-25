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
import { callMutation, callQuery } from '@/utils/client';

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

  // change task state (matching Vue.js implementation)
  ChangeTaskStateDocument,
  ChangeTaskStateMutation,
  ChangeTaskStateMutationVariables,
  Task_State_Enum,

  // add task cancellation reason (matching Vue.js implementation)
  AddTaskCancellationReasonDocument,
  AddTaskCancellationReasonMutation,
  AddTaskCancellationReasonMutationVariables,

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

  // inline mutations to import
  UpdateAssetQtyDocument,
  UpdateAssetQtyMutation,
  UpdateAssetQtyMutationVariables,
  MarkOrderDispensingDocument,
  MarkOrderDispensingMutation,
  MarkOrderDispensingMutationVariables,
  MarkOrderCompletedDocument,
  MarkOrderCompletedMutation,
  MarkOrderCompletedMutationVariables,
  CreateInvoiceDocument,
  CreateInvoiceMutation,
  CreateInvoiceMutationVariables,
  AddingVehicleInventoryTransactionLogsDocument,
  AddingVehicleInventoryTransactionLogsMutation,
  AddingVehicleInventoryTransactionLogsMutationVariables,
  CheckServiceAblilityDocument,
  CheckServiceAblilityQuery,
  CheckServiceAblilityQueryVariables,
  FetchProductPartnerLocalitiesPriceDocument,
  FetchProductPartnerLocalitiesPriceQuery,
  FetchProductPartnerLocalitiesPriceQueryVariables,
  DriverDeliveryFeesMutation,
  DriverDeliveryFeesDocument,
  DriverDeliveryFeesMutationVariables,

  // fuel delivery to
  FuelDeliveryToMutation,
  FuelDeliveryToDocument,
  FuelDeliveryToMutationVariables,

  // update totalizer reading
  UpdateTotalizerReadingDocument,
  UpdateTotalizerReadingMutation,
  UpdateTotalizerReadingMutationVariables,

  // asset update changes
  AssetUpdateChangesDocument,
  AssetUpdateChangesMutation,
  AssetUpdateChangesMutationVariables,
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
      variables: { ...args },
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
      variables: { ...args },
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
          return Number(b.quantity_dispensed) - Number(a.quantity_dispensed);
        },
      );

      // Calculate quantities for validation (like Vue project)
      const totalQuantityRequested = sortedAssets.reduce(
        (sum, asset) => sum + (asset.quantity_requested || 0),
        0,
      );
      const totalQuantityDispensed = sortedAssets.reduce(
        (sum, asset) => sum + (asset.quantity_dispensed || 0),
        0,
      );

      orderStore.setState({
        orderAssets: sortedAssets,
        // quantityToBeDispensed: totalQuantityRequested,
        fuelDispensedTillNow: totalQuantityDispensed,
        pendingQuantity: totalQuantityRequested - totalQuantityDispensed,
      });

      return sortedAssets;
    } catch (error) {
      throw new Error('error fetching all customer assets');
    }
  }

  /**
   * @method upsertStepTaskAction
   * @description Upserts step task action for streaming functionality
   * @args UpsertStepTaskActionMutationVariables
   */
  public async upsertStepTaskAction(args: { object: any }) {
    try {
      console.log('UpsertStepTaskAction API call:', args);

      // Use imported GraphQL document
      const response: UpsertTaskValueMutation = await callMutation({
        queryDocument: UpsertTaskValueDocument,
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
  public async updateTaskLiveDispensingStatus(args: {
    task_id: string;
    is_live_dispensing: boolean;
  }) {
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

      // Use imported GraphQL document
      const response: UpdateAssetQtyMutation = await callMutation({
        queryDocument: UpdateAssetQtyDocument,
        variables: {
          customerAssetId: args.customerAssetId,
          customerOrderId: args.customerOrderId,
          qty: args.qty,
        },
      });

      const updatedAsset =
        response.update_customer_order_customer_asset?.returning[0];

      // Update the store state with new quantity values (like Vue project)
      if (updatedAsset) {
        const currentState = orderStore.getState();
        const updatedAssets = currentState.orderAssets.map(asset =>
          // @ts-ignore - Type issue with generated GraphQL types
          asset.customer_asset?.id === updatedAsset.customer_asset?.id
            ? { ...asset, quantity_dispensed: updatedAsset.quantity_dispensed }
            : asset,
        );

        // Recalculate totals
        const totalQuantityDispensed = updatedAssets.reduce(
          (sum, asset) => sum + (asset.quantity_dispensed || 0),
          0,
        );
        const totalQuantityRequested = updatedAssets.reduce(
          (sum, asset) => sum + (asset.quantity_requested || 0),
          0,
        );

        orderStore.setState(state => ({
          ...state,
          orderAssets: updatedAssets,
          fuelDispensedTillNow: totalQuantityDispensed,
          pendingQuantity: totalQuantityRequested - totalQuantityDispensed,
          quantityDispensed: args.qty, // Set the current dispensed quantity
        }));
      }

      return updatedAsset;
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

      // Use imported GraphQL document
      const response: UpdateTotalizerReadingMutation = await callMutation({
        queryDocument: UpdateTotalizerReadingDocument,
        variables: {
          totalizer_reading: args.totalizer_reading,
          vehicle_id: args.vehicle_id,
        },
      });

      return response.update_vehicle?.returning[0];
    } catch (error) {
      console.error('Error updating totalizer reading:', error);
      throw new Error('Failed to update totalizer reading');
    }
  }

  /**
   * @method assetUpdateChanges
   * @description Updates task_value records for asset changes (TOTALIZER_BEFORE_READING and TOTALIZER_AFTER_READING)
   * @args {customer_asset_id: string, task_id: string, key: string, value: string, quantity_dispensed?: number}
   */
  public async assetUpdateChanges(args: {
    customer_asset_id: string;
    task_id: string;
    key: string;
    value: string;
    quantity_dispensed?: number;
  }) {
    try {
      console.log('🔄 AssetUpdateChanges API call:', args);

      const response: AssetUpdateChangesMutation = await callMutation({
        queryDocument: AssetUpdateChangesDocument,
        variables: {
          customer_asset_id: args.customer_asset_id,
          task_id: args.task_id,
          key: args.key,
          value: args.value,
          quantity_dispensed: args.quantity_dispensed,
        },
      });

      console.log('✅ AssetUpdateChanges response:', response);
      return response.update_task_value?.returning[0];
    } catch (error) {
      console.error('❌ Error in assetUpdateChanges:', error);
      throw new Error('Failed to update asset changes');
    }
  }

  /**
   * @method markOrderInTransit
   * @description Marks an order as in transit using changeTaskState mutation (matching Vue.js implementation)
   * @args {id: string}
   */
  public async markOrderInTransit(args: { id: string }) {
    try {
      console.log('MarkOrderInTransit API call:', args);

      const response: ChangeTaskStateMutation = await callMutation({
        queryDocument: ChangeTaskStateDocument,
        variables: {
          id: args.id,
          state: Task_State_Enum.InTransit,
        },
      });

      return response.update_task_by_pk;
    } catch (error) {
      console.error('Error marking order as in transit:', error);
      throw new Error('Failed to mark order as in transit');
    }
  }

  /**
   * @method markOrderArrived
   * @description Marks an order as arrived using changeTaskState mutation (matching Vue.js implementation)
   * @args {id: string}
   */
  public async markOrderArrived(args: { id: string }) {
    try {
      console.log('MarkOrderArrived API call:', args);

      const response: ChangeTaskStateMutation = await callMutation({
        queryDocument: ChangeTaskStateDocument,
        variables: {
          id: args.id,
          state: Task_State_Enum.Arrived,
        },
      });

      return response.update_task_by_pk;
    } catch (error) {
      console.error('Error marking order as arrived:', error);
      throw new Error('Failed to mark order as arrived');
    }
  }

  /**
   * @method markOrderDispensing
   * @description Marks an order as dispensing using changeTaskState mutation (matching Vue.js implementation)
   * @args {task_id: string}
   */
  public async markOrderDispensing(args: { id: string }) {
    try {
      console.log('MarkOrderDispensing API call:', args);

      // Use changeTaskState mutation (same as Vue.js) instead of specific markOrderDispensing
      const response: ChangeTaskStateMutation = await callMutation({
        queryDocument: ChangeTaskStateDocument,
        variables: {
          id: args.id,
          state: Task_State_Enum.Dispensing,
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
  public async markOrderCompleted(args: { id: string }) {
    try {
      console.log('MarkOrderCompleted API call:', args);

      const response: ChangeTaskStateMutation = await callMutation({
        queryDocument: ChangeTaskStateDocument,
        variables: {
          id: args.id,
          state: Task_State_Enum.Delivered,
        },
      });

      return response.update_task_by_pk;
    } catch (error) {
      console.error('Error marking order as completed:', error);
      throw new Error('Failed to mark order as completed');
    }
  }

  /**
   * @method markOrderCancel
   * @description Marks an order as completed/delivered
   * @args {task_id: string}
   */
  public async markOrderCancel(args: { id: string }) {
    try {
      console.log('MarkOrderCancel API call:', args);

      const response: ChangeTaskStateMutation = await callMutation({
        queryDocument: ChangeTaskStateDocument,
        variables: {
          id: args.id,
          state: Task_State_Enum.CancellationRequested,
        },
      });

      return response.update_task_by_pk;
    } catch (error) {
      console.error('Error marking order as completed:', error);
      throw new Error('Failed to mark order as completed');
    }
  }

  /**
   * @method addTaskCancellationReason
   * @description Adds cancellation reason for a task (matching Vue.js implementation)
   * @args {task_id: string, reason: string}
   */
  public async addTaskCancellationReason(args: { id: string; reason: string }) {
    try {
      console.log('AddTaskCancellationReason API call:', args);

      const response: AddTaskCancellationReasonMutation = await callMutation({
        queryDocument: AddTaskCancellationReasonDocument,
        variables: {
          object: {
            task_id: args.id,
            reason: args.reason,
            is_active: true,
          },
        },
      });

      return response.insert_task_cancellation_reasons_one;
    } catch (error) {
      console.error('Error adding task cancellation reason:', error);
      throw new Error('Failed to add task cancellation reason');
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

      const response: CreateInvoiceMutation = await callMutation({
        queryDocument: CreateInvoiceDocument,
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

      const response: AddingVehicleInventoryTransactionLogsMutation =
        await callMutation({
          queryDocument: AddingVehicleInventoryTransactionLogsDocument,
          variables: {
            object: {
              customer_order_id: args.customer_order_id,
              fillup_request_id: args.fillup_request_id,
              product_variation_id: args.product_var_id,
              quantity: args.quantity,
              unit: 'LTRS',
              vehicle_id: args.vehicle_id,
              transaction_type: args.transaction_type,
              is_active: true,
            },
          },
        });

      return response.insert_vehicle_inventory_transaction_logs_one;
    } catch (error) {
      console.error('Error adding transaction logs:', error);
      throw new Error('Failed to add transaction logs');
    }
  }

  /**
   * @method fetchDeliveryFee
   * @description Fetches delivery fee for an order using driver app mutation
   * @args {customer_order_id: string, total_dispensed_qty: number}
   */

  public async fetchDeliveryFee(args: {
    customer_order_id: string;
    total_dispensed_qty: number;
  }) {
    try {
      const response: DriverDeliveryFeesMutation = await callMutation({
        queryDocument: DriverDeliveryFeesDocument,
        variables: {
          object: {
            customer_order_id: args.customer_order_id,
            total_dispensed_qty: args.total_dispensed_qty,
          },
        },
      });

      return response.deliveryFeesDriverApp;
    } catch (error) {
      throw new Error('error fetching all customer assets');
    }
  }

  /**
   * @method checkServiceability
   * @description Checks serviceability for given coordinates
   * @args {lat: number, lng: number}
   */
  public async checkServiceability(args: { lat: number; lng: number }) {
    try {
      console.log('CheckServiceability API call:', args);

      const response: CheckServiceAblilityQuery = await callQuery({
        queryDocument: CheckServiceAblilityDocument,
        variables: {
          latitude: args.lat,
          longitude: args.lng,
        },
      });

      return response.partner?.[0];
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
  public async fetchDeliveryProductsWithPrices(args: { id: string }) {
    try {
      console.log('FetchDeliveryProductsWithPrices API call:', args);

      const response: FetchProductPartnerLocalitiesPriceQuery = await callQuery(
        {
          queryDocument: FetchProductPartnerLocalitiesPriceDocument,
          variables: {
            id: args.id,
          },
        },
      );

      return response.product_partner_localities_price;
    } catch (error) {
      console.error('Error fetching delivery products with prices:', error);
      throw new Error('Failed to fetch delivery products with prices');
    }
  }

  public async createFuelDeliveryTo(args: FuelDeliveryToMutationVariables) {
    const response: FuelDeliveryToMutation = await callMutation({
      queryDocument: FuelDeliveryToDocument,
      variables: {
        ...args,
      },
    });

    return response.insert_fuel_delivery_one;
  }

  /**
   * @method fetchCompletelyFilledAsset
   * @description Fetches completely filled asset data
   * @args {task_id: string, key: string, vehicle_id: string}
   */
  public async fetchCompletelyFilledAsset(args: {
    task_id: string;
    key: string;
    vehicle_id: string;
  }) {
    try {
      console.log('FetchCompletelyFilledAsset API call:', args);

      // Use existing fetchTaskValue method
      const response = await this.fetchTaskValue({ task_id: args.task_id });

      // Filter for the specific key and vehicle
      const filteredValues = response.task_value?.filter(
        (value: any) =>
          value.key === args.key &&
          value.customer_asset_id === args.vehicle_id
      );

      return filteredValues?.[0] || null;
    } catch (error) {
      console.error('Error fetching completely filled asset:', error);
      throw new Error('Failed to fetch completely filled asset');
    }
  }

  /**
   * @method addStockEntryForFillupOnErp
   * @description Adds stock entry for fillup on ERP system
   * @args {state: string, task_id: string}
   */
  public async addStockEntryForFillupOnErp(args: {
    state: string;
    task_id: string;
  }) {
    try {
      console.log('AddStockEntryForFillupOnErp API call:', args);

      // This would be implemented when the actual GraphQL mutation is available
      // For now, return a mock response
      console.log('AddStockEntryForFillupOnErp - using mock response');

      return {
        success: true,
        state: args.state,
        task_id: args.task_id,
      };
    } catch (error) {
      console.error('Error adding stock entry for fillup on ERP:', error);
      throw new Error('Failed to add stock entry for fillup on ERP');
    }
  }

  /**
  * @method sendDriverLocation
  * @description Sends driver location to tracking API
  * @args {driverId: string, deviceId: string, driverVehicleId: string, shiftScheduleId: string, latitude: number, longitude: number, timestamp?: string, source?: string}
  */
  public async sendDriverLocation(args: {
    driverId: string;
    deviceId: string;
    driverVehicleId: string;
    shiftScheduleId: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
    source?: string;
  }) {
    // Using the same API key as in Vue.js implementation
    const apiKey = "3a1223c3a%$!%2!2a1c!$c$1bb2!2$ab";

    // The direct API endpoint from the working curl command
    const apiUrl =
      "https://track-api.fuelbuddy.in/api/v1/publish-driver-location";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId: args.driverId,
          deviceId: args.deviceId,
          driverVehicleId: args.driverVehicleId,
          shiftScheduleId: args.shiftScheduleId,
          latitude: args.latitude,
          longitude: args.longitude,
          timestamp: args.timestamp || new Date().toISOString(),
          source: args.source || "driver_app",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to send location: ${response.status} ${response.statusText} - ${errorData}`,
        );
      }

      // Assuming the API returns JSON on success
      return await response.json();
    } catch (err) {
      console.error('Error publishing driver location:', err);
      throw new Error("Error publishing driver location");
    }
  }

  /**
   * @method fetchPartiallyFilledAsset
   * @description Fetch specific task value for a partially filled asset
   */
  public async fetchPartiallyFilledAsset(args: {
    task_id: string;
    customer_asset_id: string;
    key: string;
  }) {
    try {
      const response = await this.fetchTaskValue({ task_id: args.task_id });

      // Filter for the specific asset and key
      const filteredValues = response.task_value?.filter(
        (value: any) =>
          value.customer_asset_id === args.customer_asset_id &&
          value.key === args.key
      );

      return filteredValues?.[0] || null;
    } catch (error) {
      console.error('Error fetching partially filled asset:', error);
      throw error;
    }
  }

  /**
   * @method checkPartiallyFilledAssets
   * @description Get all task values for a task to check for partially filled assets
   */
  public async checkPartiallyFilledAssets(taskId: string) {
    try {
      const response = await this.fetchTaskValue({ task_id: taskId });
      return response;
    } catch (error) {
      console.error('Error checking partially filled assets:', error);
      throw error;
    }
  }

  /**
   * @method getPartiallyFilledAssetIds
   * @description Get asset IDs that are partially filled (has TOTALIZER_BEFORE_READING but no TOTALIZER_AFTER_READING)
   */
  public async getPartiallyFilledAssetIds(taskId: string): Promise<string[]> {
    try {
      const task = await this.checkPartiallyFilledAssets(taskId);

      if (!task?.task_value) {
        return [];
      }

      const partiallyFilledAssetIds = task.task_value
        .filter((obj: any) =>
          obj.key === "TOTALIZER_BEFORE_READING" &&
          !task.task_value.some((innerObj: any) =>
            innerObj.customer_asset_id === obj.customer_asset_id &&
            innerObj.key === "TOTALIZER_AFTER_READING"
          )
        )
        .map((obj: any) => obj.customer_asset_id);

      console.log('📊 Partially filled assets found:', partiallyFilledAssetIds);
      return partiallyFilledAssetIds;
    } catch (error) {
      console.error('❌ Error getting partially filled asset IDs:', error);
      return [];
    }
  }

  /**
   * @method getAssetsWithUploadedVideos
   * @description Get asset IDs that have uploaded videos (has VIDEO_UPLOADED or LIVE_STREAM_RECORDING but no QUANTITY_ENTERED)
   */
  public async getAssetsWithUploadedVideos(taskId: string): Promise<string[]> {
    try {
      const task = await this.checkPartiallyFilledAssets(taskId);

      if (!task?.task_value) {
        return [];
      }

      const assetsWithVideos = task.task_value
        .filter((obj: any) =>
          // Check for either VIDEO_UPLOADED or LIVE_STREAM_RECORDING
          (obj.key === "VIDEO_UPLOADED" || obj.key === "LIVE_STREAM_RECORDING") &&
          !task.task_value.some((innerObj: any) =>
            innerObj.customer_asset_id === obj.customer_asset_id &&
            innerObj.key === "QUANTITY_ENTERED"
          )
        )
        .map((obj: any) => obj.customer_asset_id);

      console.log('📹 Assets with uploaded videos found:', assetsWithVideos);
      return assetsWithVideos;
    } catch (error) {
      console.error('❌ Error getting assets with uploaded videos:', error);
      return [];
    }
  }

  /**
   * @method getAssetsWithInterruptedRecording
   * @description Get asset IDs that have interrupted recording sessions (stream started/paused but not stopped)
   */
  public async getAssetsWithInterruptedRecording(taskId: string): Promise<string[]> {
    try {
      const task = await this.checkPartiallyFilledAssets(taskId);

      if (!task?.task_value) {
        return [];
      }

      // Group task values by asset ID
      const assetGroups: { [assetId: string]: any[] } = {};
      task.task_value.forEach((tv: any) => {
        if (!assetGroups[tv.customer_asset_id]) {
          assetGroups[tv.customer_asset_id] = [];
        }
        assetGroups[tv.customer_asset_id].push(tv);
      });

      const interruptedAssets: string[] = [];

      // Check each asset for interrupted recording
      Object.entries(assetGroups).forEach(([assetId, taskValues]) => {
        // Get stream events for this asset
        const streamEvents = taskValues
          .filter(tv => [
            'STREAM_STARTED',
            'STREAM_PAUSED',
            'STREAM_RESUMED',
            'STREAM_STOPPED'
          ].includes(tv.key))
          .sort((a, b) => new Date(a.created_at || a.value).getTime() - new Date(b.created_at || b.value).getTime());

        // Check if quantity is entered (if yes, asset is completed)
        const hasQuantity = taskValues.some(tv => tv.key === 'QUANTITY_ENTERED');

        // Check if video recording is completed
        const hasVideoRecording = taskValues.some(tv => tv.key === 'LIVE_STREAM_RECORDING');

        if (streamEvents.length > 0 && !hasQuantity) {
          const latestEvent = streamEvents[streamEvents.length - 1];

          // If stream is stopped and video is recorded, it's not interrupted (it's ready for quantity entry)
          // If latest event is not STREAM_STOPPED, it's interrupted
          if (latestEvent.key !== 'STREAM_STOPPED' && !hasVideoRecording) {
            interruptedAssets.push(assetId);
          }
        }
      });

      console.log('📹 Assets with interrupted recording found:', interruptedAssets);
      return interruptedAssets;
    } catch (error) {
      console.error('❌ Error getting assets with interrupted recording:', error);
      return [];
    }
  }

  /**
   * @method syncAssetStatesWithStore
   * @description Sync asset states from API with store (replaces localStorage approach)
   */
  public async syncAssetStatesWithStore(taskId: string): Promise<void> {
    try {
      console.log('🔄 Syncing asset states from API...');

      const [partiallyFilledIds, videosUploadedIds, interruptedRecordingIds] = await Promise.all([
        this.getPartiallyFilledAssetIds(taskId),
        this.getAssetsWithUploadedVideos(taskId),
        this.getAssetsWithInterruptedRecording(taskId),
      ]);

      // Update store with API data
      orderStore.setState(state => ({
        ...state,
        partiallyFilledAssetsArray: partiallyFilledIds,
        assetsWithUploadedVideos: videosUploadedIds,
        assetsWithInterruptedRecording: interruptedRecordingIds,
      }));

      console.log('✅ Asset states synced successfully:', {
        partiallyFilled: partiallyFilledIds.length,
        videosUploaded: videosUploadedIds.length,
        interruptedRecording: interruptedRecordingIds.length,
      });
    } catch (error) {
      console.error('❌ Error syncing asset states:', error);
    }
  }
}

const orderService = OrderService.getInstance();

export default orderService;
