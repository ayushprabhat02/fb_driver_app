// dependencies
import {callQuery} from '@/utils/client';
import {DateTime} from 'luxon';

// store
import reportStore from '../store';

// utils
import {
  getDeliveredDate,
  getOrderStatus,
  getDeliveredQuantity,
  getDeliverySlot,
  getFormattedDeliveryFee,
  getFormattedDiscount,
  getFormattedTotalAmount,
  getNetTotalWithoutGst,
  replaceNullValueInString,
} from '@/utils/general';

// graphql-documents
import {
  FetchCustomerOrganizationOrdersDocument,
  FetchCustomerOrganizationOrdersQueryVariables,
  FetchCustomerOrganizationOrdersQuery,
  CustomerOrderReportIndividualDocument,
  CustomerOrderReportIndividualQuery,
  CustomerOrderReportIndividualQueryVariables,
  Customer_Order,
  Customer_Order_Item,
  Customer_Order_Item_Stateflow,
  Product_Variation_Partner_Localities_Slots,
  FetchReportByIdQueryVariables,
  FetchReportByIdDocument,
} from '@/generated/graphql';

/**
 * @class ReportService
 * @description This class represents the service for the report module.
 */
class ReportService {
  private static instance: ReportService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the ReportService class.
   * @returns {ReportService} The singleton instance of the ReportService class.
   */
  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  public deliveryOrderReports = (args: {
    customerOrderItems:
      | FetchCustomerOrganizationOrdersQuery['fetchCustomerOrganizationOrders']['data']
      | [];
  }) => {
    return args.customerOrderItems.map((data: any) => {
      return {
        'Order Date': DateTime.fromISO(
          data?.customer_order?.order_date,
        ).toFormat('dd-MM-yyyy'),
        // 'Order Time': DateTime.fromISO(
        //   data?.customer_order?.order_date,
        // ).toFormat('hh:mm:ss a'),
        'Delivery Date': DateTime.fromISO(data?.estimate_delivery_date, {
          zone: 'utc',
        })
          ?.setZone('Asia/Kolkata')
          ?.toFormat('dd-MM-yyyy'),
        'Selected Slot': getDeliverySlot(
          data?.product_variation_partner_localities_slot as Product_Variation_Partner_Localities_Slots,
        ),

        'Delivered Date': getDeliveredDate(
          data?.customer_order_item_stateflows as Customer_Order_Item_Stateflow[],
        ),
        // 'Delivery Time': getDeliveredTime(
        //   data?.customer_order_item_stateflows as Customer_Order_Item_Stateflow[],
        // ),
        'ERP Code': data?.customer_order?.erp_code || '',
        'App Code': data?.customer_order?.order_code || '',
        'Order Status': getOrderStatus(data?.customer_order?.state) as string,
        'User Name': replaceNullValueInString(
          `${data?.customer_order?.organization_user?.user?.first_name} ${data?.customer_order?.organization_user?.user?.last_name}`,
        ),
        'Shipping Address': replaceNullValueInString(
          data?.customer_order?.organizationAddressByShippingAddressId
            ?.address_line1 as string,
        ),
        'Billing Address': replaceNullValueInString(
          data?.customer_order?.organization_address?.address_line1 as string,
        ),

        'Ordered QTY (Litres)': `${data?.actual_qty?.toFixed(2)}`,
        'Delivered QTY': getDeliveredQuantity(data as Customer_Order_Item),
        'Diesel Total(without Gst)': getNetTotalWithoutGst(
          data?.customer_order as Customer_Order,
        ),
        'Delivery Fee + GST':
          getFormattedDeliveryFee(data?.customer_order as Customer_Order) ||
          '0',
        Discount: (() => {
          // const {task} = data;
          // const {task_values} = task;

          // const challanValue = task_values?.find(
          //   (tv: any) => tv.key === 'CHALLAN',
          // )?.quantity_dispensed;

          // const totalDiscount =
          //   parseFloat(challanValue) *
          //   parseFloat(`${data?.customer_order?.voucher_discount}`);

          // data?.customer_order?.voucher_discount || '0';
          return `${data?.customer_order?.invoices[0]?.discount_amount || 0}`;
        })(),

        // getFormattedDiscount(
        //   data?.customer_order?.voucher_discount as Customer_Order,
        // ),
        'Total Amount': getFormattedTotalAmount(
          data?.customer_order as Customer_Order,
          data?.actual_amount,
        ),
        'Purchase Order Code':
          data?.customer_order?.customer_purchase_order_number || '',
      };
    });
  };

  /**
   * @method getCustomerOrderReport
   * @description Retrieves the customer order report based on the provided variables.
   * @args CustomerOrderReportQueryVariables
   */
  public async getCustomerOrderReport(
    args: FetchCustomerOrganizationOrdersQueryVariables,
  ) {
    try {
      const response: FetchCustomerOrganizationOrdersQuery = await callQuery({
        queryDocument: FetchCustomerOrganizationOrdersDocument,
        variables: {...args},
      });

      reportStore.setState(state => ({
        ...state,
        customerOrderReportData:
          response.fetchCustomerOrganizationOrders?.data?.orders,
      }));

      return response.fetchCustomerOrganizationOrders;
    } catch (error) {
      console.error('Error fetching customer order report:', error);
      throw error;
    }
  }

  /**
   * individual reports
   */
  public async getCustomerOrderReportIndividual(
    args: CustomerOrderReportIndividualQueryVariables,
  ) {
    const response: CustomerOrderReportIndividualQuery = await callQuery({
      queryDocument: CustomerOrderReportIndividualDocument,
      variables: {
        ...args,
      },
    });

    reportStore.setState(state => ({
      ...state,
      customerOrderReportDataIndividual: response.customer_order_item.sort(
        (a, b) => {
          return (
            new Date(b.customer_order?.order_date).getTime() -
            new Date(a.customer_order?.order_date).getTime()
          );
        },
      ),
    }));
  }

  public async fetchReportById(args: FetchReportByIdQueryVariables) {
    try {
      const response = await callQuery({
        queryDocument: FetchReportByIdDocument,
        variables: {...args},
      });
      return response.customer_order[0];
    } catch (error) {
      console.error('Error fetching customer order by id', error);
      throw error;
    }
  }
}

const reportService = ReportService.getInstance();

export default reportService;
