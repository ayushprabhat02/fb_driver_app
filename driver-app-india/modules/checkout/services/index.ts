/**
 * @module Checkout
 * @description Service file for the checkout module
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// graphql-documents

import {
  DriverCheckOutDocument,
  DriverCheckOutMutation,
  DriverCheckOutMutationVariables,
  MyLastCheckingDetailsDocument,
  MyLastCheckingDetailsQuery,
  MyLastCheckingDetailsQueryVariables,
} from '@/generated/graphql';

/**
 * @class CheckoutService
 * @description This class represents the service for the checkout module.
 */
class CheckoutService {
  private static instance: CheckoutService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the CheckoutService class.
   * @returns {CheckoutService} The singleton instance of the CheckoutService class.
   */
  public static getInstance(): CheckoutService {
    if (!CheckoutService.instance) {
      CheckoutService.instance = new CheckoutService();
    }
    return CheckoutService.instance;
  }

  /**
   * @method fetchLastCheckInDetails
   * @description Fetches the last check-in details for the driver
   */
  public async fetchLastCheckInDetails(
    args: //   {
    //   driver_vehicle_id: string;
    //   category?: Login_Type_Enum;
    // }
    MyLastCheckingDetailsQueryVariables,
  ) {
    const response: MyLastCheckingDetailsQuery = await callQuery({
      queryDocument: MyLastCheckingDetailsDocument,
      variables: {
        ...args,
      },
    });

    return response.driver_duty_log?.[0];
  }

  /**
   * @method driverCheckOut
   * @description Creates a driver checkout record in the database
   */
  public async driverCheckOut(args: DriverCheckOutMutationVariables) {
    const response: DriverCheckOutMutation = await callMutation({
      queryDocument: DriverCheckOutDocument,
      variables: {
        ...args,
      },
    });

    return response.insert_driver_duty_log_one;
  }
}

const checkoutService = CheckoutService.getInstance();

export default checkoutService;
