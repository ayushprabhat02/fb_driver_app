/**
 * @module Delivery
 * @description This module contains the service file for the delivery module.
 */

// dependencies
import {callQuery, callMutation} from '@/utils/client';
import {DateTime} from 'luxon';
import _ from 'lodash';

// store
import {businessStore, deliveryStore, orderStore} from '@/globalStore';

// graphql-documents
import {
  // delivery products with prices`
  FetchDeliveryProductsWithPricesDocument,
  FetchDeliveryProductsWithPricesQuery,
  FetchDeliveryProductsWithPricesQueryVariables,

  // delivery dates with slots
  FetchDeliveryDatesWithSlotsDocument,
  FetchDeliveryDatesWithSlotsQuery,
  FetchDeliveryDatesWithSlotsQueryVariables,

  // delivery fee
  FetchDeliveryFeesDocument,
  FetchDeliveryFeesQuery,
  FetchDeliveryFeesQueryVariables,

  // create delivery order
  CreateDeliveryOrderDocument,
  CreateDeliveryOrderMutation,
  CreateDeliveryOrderMutationVariables,
  Delivery_Preferences_Enum,
  FetchAddressByTypeQuery,
  Organization_User,
  Customer_Order_State_Enum,
  Order_Type_Enum,
  Delivery_Type_Enum,
  Customer_Order_Item_State_Enum,

  // get delivery order by id
  FetchDeliveryOrderByIdDocument,
  FetchDeliveryOrderByIdQuery,
  FetchDeliveryOrderByIdQueryVariables,
  FetchAddressByNameQuery,
  Order_Payment_Type_Enum,
  Order_Source_Of_Creation_Enum,
} from '@/generated/graphql';

// services
import {checkForMultipleOfNumber, isEligibleForPrepaid} from '@/utils/general';
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// types
import {PaymentMethods, Slot, SlotTime} from '../types';
import {Platform} from 'react-native';

/**
 * @class DeliveryService
 * @description This class represents the service for the address module.
 */
class DeliveryService {
  private static instance: DeliveryService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the DeliveryService class.
   * @returns {DeliveryService} The singleton instance of the DeliveryService class.
   */
  public static getInstance(): DeliveryService {
    if (!DeliveryService.instance) {
      DeliveryService.instance = new DeliveryService();
    }
    return DeliveryService.instance;
  }

  /**
   * @method getDeliveryAddresses
   * @description Retrieves the active user's delivery addresses.
   * @args AddressByTypeQueryVariables
   */

  public async getProductsForDeliveryWithPrice(
    args: FetchDeliveryProductsWithPricesQueryVariables,
  ) {
    const response: FetchDeliveryProductsWithPricesQuery = await callQuery({
      queryDocument: FetchDeliveryProductsWithPricesDocument,
      variables: {
        ...args,
      },
    });

    deliveryStore.setState(state => ({
      ...state,
      fetchedDeliveryProducts: response.product_partner_localities_price,
    }));

    return response.product_partner_localities_price;
  }

  /**
   * @method fetchDeliveryDatesWithSlots
   * @description Fetches the delivery dates with slots.
   * @args FetchDeliveryDatesWithSlotsQueryVariables
   */
  public async fetchDeliveryDatesWithSlots(
    args: FetchDeliveryDatesWithSlotsQueryVariables,
  ) {
    const response: FetchDeliveryDatesWithSlotsQuery = await callQuery({
      queryDocument: FetchDeliveryDatesWithSlotsDocument,
      variables: {
        ...args,
      },
    });

    const allSlots = response.product_variation_partner_localities_slots;

    //extracting dates
    const dates = Array.from(
      new Set(
        allSlots.map(slot => {
          return slot.day_date;
        }),
      ),
    );

    //extracting slots by date
    const offset = 0;
    const slotsByDate = dates.map(date => {
      const slots = [];
      for (let i = offset; i < allSlots.length; i++) {
        if (date === allSlots[i].day_date) {
          slots.push({
            title: `${DateTime.fromISO(allSlots[i].start_time).toFormat(
              'h:mm a',
            )} - ${DateTime.fromISO(allSlots[i].end_time).toFormat('h:mm a')}`,
            start: DateTime.fromISO(allSlots[i].start_time).toFormat('h:mm a'),
            end: DateTime.fromISO(allSlots[i].end_time).toFormat('h:mm a'),
            value: allSlots[i].id,
            date: allSlots[i].day_date,
            description: '',
            partnerId: allSlots[i]?.partner_locality?.partner_id,
            startTime: DateTime.fromISO(allSlots[i].start_time).toFormat(
              'HH:mm',
            ),
            endTime: DateTime.fromISO(allSlots[i].end_time).toFormat('HH:mm'),
            expressDelivery: allSlots[i]?.is_express_delivery_enable as boolean,
            expressDeliveryFee: allSlots[i]?.express_delivery_fee,
            is_visible: allSlots[i]?.is_visible,
            is_active: allSlots[i]?.is_active,
          });
        }
      }

      const uniqueSlots = _.uniqBy(slots, 'title');

      const amSlots = uniqueSlots.filter(x => x.end.split(' ')[1] === 'AM');
      const pmSlots = uniqueSlots.filter(x => x.end.split(' ')[1] === 'PM');

      const sortedAMSlots = amSlots.sort((a, b) => {
        return (
          parseInt(a.end.split(' ')[0], 10) - parseInt(b.end.split(' ')[0], 10)
        );
      });

      const sortedPMSlots = pmSlots.sort((a, b) => {
        return (
          parseInt(a.end.split(' ')[0], 10) - parseInt(b.end.split(' ')[0], 10)
        );
      });

      return {
        date: date,
        value: date,
        title: DateTime.fromISO(date).toFormat('ccc , LLL dd'),
        slots: [...sortedAMSlots, ...sortedPMSlots],
      };
    });

    const sortedSlots: SlotTime[] = [];

    slotsByDate.forEach(slot => {
      const slots = slot.slots.sort(this.compareByStartTime);

      sortedSlots.push({
        ...slot,
        slots: slots,
      });
    });

    deliveryStore.setState(state => ({
      ...state,
      fetchedDeliverySlots: sortedSlots,
    }));
  }

  /**
   * Function to compare and sort time slots in increasing order
   * @param a
   * @param b
   * @returns
   */
  private compareByStartTime = (a: Slot, b: Slot) => {
    const timeA = a.startTime;
    const timeB = b.startTime;

    if (timeA < timeB) {
      return -1;
    }
    if (timeA > timeB) {
      return 1;
    }
    return 0;
  };

  /**
   * This function is used to decide whether to show a slot or not based on the slot date and slot start & end times
   * * First convert slot start & end times ( along with date ) to ISO format.
   * * Capture the current date & time in ISO format.
   * * Compare the two
   * @param slot - the slot which is to be displayed ( or not )
   * @returns - boolean. true => show slot. false => do not show slot
   */
  public includeSlot = (slot: Slot) => {
    const slotStartTime = DateTime.fromFormat(
      `${slot.date} ${slot.startTime}`,
      'yyyy-MM-dd HH:mm',
    ).toISO();

    const slotEndTime = DateTime.fromFormat(
      `${slot.date} ${slot.endTime}`,
      'yyyy-MM-dd HH:mm',
    ).toISO();

    const currentTime = DateTime.now();

    if (
      currentTime > DateTime.fromISO(slotStartTime as string).minus({hours: 1})
    ) {
      return false;
    }

    if (
      currentTime < DateTime.fromISO(slotStartTime as string) &&
      currentTime > DateTime.fromISO(slotEndTime as string)
    ) {
      return false;
    }

    return true;
  };

  /**
   * @method fetchDeliveryFee
   * @description Fetches the delivery fee.
   */
  public async fetchDeliveryFee(args: FetchDeliveryFeesQueryVariables) {
    const response: FetchDeliveryFeesQuery = await callQuery({
      queryDocument: FetchDeliveryFeesDocument,
      variables: {
        ...args,
      },
    });

    deliveryStore.setState(state => ({
      ...state,
      deliveryFee: {
        ...response.fetchDeliveryFees,
        total_amount:
          parseFloat(response.fetchDeliveryFees?.total_amount?.toFixed(2)) || 0,
      },
    }));

    return response.fetchDeliveryFees;
  }

  private getPaymentMethod = (paymentMethod: PaymentMethods) => {
    switch (paymentMethod) {
      case 'fb-wallet':
        return Order_Payment_Type_Enum.Prepaid;

      case 'icici_cobranded_card':
        return Order_Payment_Type_Enum.Credit;

      case 'COD':
        return Order_Payment_Type_Enum.Cod;

      case 'POD':
        return Order_Payment_Type_Enum.Pod;

      case 'online':
        return Order_Payment_Type_Enum.Prepaid;
    }
  };

  /**
   * @method createDeliveryOrder
   * description - creates new delivery order
   */

  public async createDeliveryOrder() {
    const serviceableZone =
      deliveryStore.getState().deliveryPartner?.partner_localities[0]?.locality;

    const payload: CreateDeliveryOrderMutationVariables = {
      object: {
        order_source_of_creation:
          Platform.OS === 'android'
            ? Order_Source_Of_Creation_Enum.Android
            : Order_Source_Of_Creation_Enum.Ios,
        order_payment_type: this.getPaymentMethod(
          deliveryStore.getState().selectedPaymentMethod,
        ),
        amount: deliveryStore.getState().totalAmount,
        customer_purchase_order_number:
          deliveryStore.getState().purchaseOrderCode,
        amount_paid: deliveryStore.getState().totalAmount,
        amount_to_be_paid: deliveryStore.getState().totalAmount,
        delivery_fee: `${parseFloat(
          deliveryStore.getState().deliveryFee?.total_amount as string,
        ).toFixed(2)}`,
        voucher_discount: deliveryStore.getState().deliveryFee?.discount,
        is_express_delivery:
          deliveryStore.getState().selectedSlot?.expressDelivery || false,
        delivery_preference: Delivery_Preferences_Enum.Morning,
        description: 'order description app',
        is_active: true,
        is_prepaid: !isEligibleForPrepaid({
          address: deliveryStore.getState()
            .selectedShippingAddress as FetchAddressByTypeQuery['organization_address'][0],
          orgUser: businessStore.getState()
            .activeDeliveryOrgUser as Organization_User,
        }),
        name: 'fuel order',
        order_date: DateTime.now().toISO(),
        service_tax: '0',
        state: Customer_Order_State_Enum.Confirmed,
        tax: deliveryStore.getState().deliveryFee?.tax_amount,
        instruction: deliveryStore.getState().orderInstructions || '',
        category: Order_Type_Enum.Service,
        product_variation_partner_localities_slot_id:
          deliveryStore.getState().selectedSlot?.value,
        otp: deliveryStore.getState().isOtpRequired
          ? Math.floor(1000 + Math.random() * 9000) //generating random 4 digit number for OTP
          : undefined,
        is_otp_required: deliveryStore.getState().isOtpRequired,
        organization_user_id: getActiveDelOrgUserId(),
        shipping_address_id:
          deliveryStore.getState().selectedShippingAddress?.id,
        billing_address_id: deliveryStore.getState().selectedBillingAddress?.id,
        customer_order_customer_assets: {
          data: deliveryStore
            .getState()
            .selectedAssetsForDeliveryDetails.map(asset => {
              return {
                customer_asset_id: asset.id,
              };
            }),
        },

        customer_order_items: {
          data: deliveryStore
            .getState()
            .selectedDeliveryProducts.map(product => {
              const isMultipleOf20 = checkForMultipleOfNumber({
                numToBeChecked: product?.product.qty,
                multipleOf: 20,
              });

              return {
                customer_order_item_partners: {
                  data: [
                    {
                      partner_id: deliveryStore?.getState().deliveryPartner?.id,
                      product_variation_partner_localities_slot_id:
                        deliveryStore.getState().selectedSlot?.value,
                      product_partner_localities_price_id:
                        product.product.product_partner_localities_price_id,
                    },
                  ],
                },
                delivery_type:
                  isMultipleOf20 &&
                  serviceableZone?.is_buddycan_delivery &&
                  product?.product.qty <= 120
                    ? Delivery_Type_Enum?.Buddycan
                    : Delivery_Type_Enum?.Bowser,
                partner_id: deliveryStore.getState().deliveryPartner?.id,
                actual_amount: (
                  product.product.qty * product.product.salePrice
                ).toFixed(2),
                actual_delivery_date: DateTime.fromFormat(
                  deliveryStore.getState().selectedDate,
                  'yyyy-MM-dd',
                ).toISO(),
                unit_price: product.product.salePrice,
                actual_qty: product?.product.qty,
                amount: (
                  product.product.qty * product.product.salePrice
                ).toFixed(2),

                voucher_discount:
                  deliveryStore.getState().deliveryFee?.discount,
                delivery_fee:
                  deliveryStore.getState().deliveryFee?.total_amount,
                estimate_delivery_date: DateTime.fromFormat(
                  deliveryStore.getState().selectedDate,
                  'yyyy-MM-dd',
                ).toISO(),
                is_active: true,
                qty: product?.product.qty,
                service_tax: '2',
                unit: '1',
                tax: '1',
                state: Customer_Order_Item_State_Enum.Confirmed,
                product_variation_id: product.product?.variation_id,
                product_variation_partner_localities_slot_id:
                  deliveryStore.getState().selectedSlot?.value,
              };
            }),
        },
      },
    };

    const response: CreateDeliveryOrderMutation = await callMutation({
      queryDocument: CreateDeliveryOrderDocument,
      variables: {
        ...payload,
      },
      errorCallback: () => {
        deliveryStore.setState(state => ({
          ...state,
          loaders: {
            ...state.loaders,
            createDeliveryOrder: false,
          },
        }));
      },
    });

    return response;
  }

  /**
   * Function to get single delivery order details by id
   * @param args
   * @returns
   */

  public async getDeliveryOrderById(
    args: FetchDeliveryOrderByIdQueryVariables,
  ) {
    const response: FetchDeliveryOrderByIdQuery = await callQuery({
      queryDocument: FetchDeliveryOrderByIdDocument,
      variables: {
        ...args,
      },
    });

    orderStore.setState(state => ({
      ...state,
      singleOrderDetails: response.customer_order[0],
    }));

    return response;
  }

  public isPostPaidAllowed = (
    address: FetchAddressByNameQuery['organization_address'][0],
    isCreditAvailable: boolean | null | undefined,
  ): boolean => {
    const hasAddressPaymentMethods =
      address?.organization_address_payment_methods.length > 0;
    return (hasAddressPaymentMethods && isCreditAvailable) || false;
  };
}

const deliveryService = DeliveryService.getInstance();

export default deliveryService;
