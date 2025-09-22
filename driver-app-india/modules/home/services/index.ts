/**
 * @module Home
 * @description This module contains the service file for the home module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// store
import homeStore from '../store';

// graphql-documents
import {
  // last order
  LastCustomerOrderDocument,
  LastCustomerOrderQuery,
  LastCustomerOrderQueryVariables,

  // customer stats
  CustomerStatsDocument,
  CustomerStatsQuery,
  CustomerStatsQueryVariables,

  // fetch order stats for driver
  FetchOrderStatsForDriverMutationVariables,
  FetchOrderStatsForDriverDocument,
  FetchOrderStatsForDriverMutation,

  // fetch order for driver new 2
  FetchOrderForDriverNew2QueryVariables,
  FetchOrderForDriverNew2Document,
  FetchOrderForDriverNew2Query,

} from '@/generated/graphql';
import {DeliveryStat} from '../types';

/**
 * @class HomeService
 * @description This class represents the service for the home module.
 */
class HomeService {
  private static instance: HomeService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the HomeService class.
   * @returns {HomeService} The singleton instance of the HomeService class.
   */
  public static getInstance(): HomeService {
    if (!HomeService.instance) {
      HomeService.instance = new HomeService();
    }
    return HomeService.instance;
  }

  /**
   * @method getLastCustomerOrder
   * @args org_user_id
   * @description Retrieves the user's last order.
   */
  public async getLastCustomerOrder(args: LastCustomerOrderQueryVariables) {
    const response: LastCustomerOrderQuery = await callQuery({
      queryDocument: LastCustomerOrderDocument,
      variables: {
        ...args,
      },
    });

    homeStore.setState(state => ({
      ...state,
      lastCustomerOrder: response.customer_order_stateflow[0],
      showRepeatOrder: response.customer_order_stateflow[0] ? true : false,
    }));

    return response.customer_order_stateflow;
  }

  public async fetchCustomerStatistic(args: CustomerStatsQueryVariables) {
    const response: CustomerStatsQuery = await callQuery({
      queryDocument: CustomerStatsDocument,
      variables: {
        ...args,
      },
    });

    const stats: DeliveryStat[] = [];

    if (response.customer_order_item.length) {
      stats.push({
        key: 'Total no. of orders',
        value: response.customer_order_item.length,
      });

      let totalQtyDispensed = 0.0;

      response.customer_order_item.forEach(orderItem => {
        orderItem?.task?.task_values.forEach(taskValue => {
          if (
            taskValue?.quantity_dispensed > 0 &&
            taskValue.key === 'TOTALIZER_AFTER_READING'
          ) {
            totalQtyDispensed += taskValue?.quantity_dispensed;
          }
        });
      });

      stats.push({
        key: 'Total qty dispensed (litres)',
        value: parseFloat(totalQtyDispensed.toFixed(2)),
      });

      const assetObj: {[key: string]: number} = {};

      response.customer_order_item.forEach(orderItem => {
        orderItem?.task?.task_values?.forEach(taskValue => {
          if (
            taskValue?.quantity_dispensed > 0 &&
            taskValue?.customer_asset?.id
          ) {
            if (
              !Object.prototype.hasOwnProperty.call(
                assetObj,
                taskValue?.customer_asset?.id,
              )
            ) {
              assetObj[taskValue?.customer_asset?.id] = 1;
            } else {
              assetObj[taskValue?.customer_asset?.id] += 1;
            }
          }
        });
      });

      // todo: do no need this in the new UI. But keep for future use
      // stats.push({
      //   key: 'Unique assets filled',
      //   value: Object.keys(assetObj).length,
      // });

      // let totalRefills = 0;

      // for (const key in assetObj) {
      //   totalRefills += assetObj[key];
      // }

      // stats.push({
      //   key: 'Total refills',
      //   value: totalRefills,
      // });
    }

    homeStore.setState(state => ({
      ...state,
      deliveryStats: stats,
    }));

    return response.customer_order_item;
  }

  public async fetchOrderStatsForDriver(
    args: FetchOrderStatsForDriverMutationVariables,
  ) {
    const response: FetchOrderStatsForDriverMutation = await callMutation({
      queryDocument: FetchOrderStatsForDriverDocument,
      variables: {
        ...args,
      },
    });

    homeStore.setState(state => ({
      ...state,
      driverOrderStats: response?.fetchOrderStatsForDriver,
    }));
  }

  // fetchOrderForDriverNew2
  public async fetchDriverOrders(args: FetchOrderForDriverNew2QueryVariables) {
    const response: FetchOrderForDriverNew2Query = await callQuery({
      queryDocument: FetchOrderForDriverNew2Document,
      variables: {
        ...args,
      },
    });

    homeStore.setState(state => ({
      ...state,
      driverOrders: response.task,
    }));
    return response.task;
  }

}

const homeService = HomeService.getInstance();

export default homeService;
