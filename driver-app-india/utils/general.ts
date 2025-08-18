// dependencies
import {DateTime} from 'luxon';
import {PermissionsAndroid, Platform} from 'react-native';
import {json2csv} from 'json-2-csv';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// @ts-ignore
import {centerOfMass} from '@turf/turf';
import Geocoder from 'react-native-geocoding';
import {requestMultiple, PERMISSIONS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';

// store
import {locationStore} from '@/globalStore';

// types
import {SlotDate} from '@/modules/delivery/types';
import {
  Customer_Order,
  Customer_Order_Item,
  Customer_Order_Item_Stateflow,
  Customer_Order_State_Enum,
  FetchAddressByTypeQuery,
  FetchAllOrgUsersByTypeQuery,
  Localities,
  Organization_User,
  Product_Variation_Partner_Localities_Slots,
} from '@/generated/graphql';
import {Coords, SimpleAddress} from '@/types/custom';

Geocoder.init(
  Platform.OS === 'android'
    ? 'AIzaSyCRZYvzF6ESgvhSYFPydbQqe5T4fSzch4A'
    : 'AIzaSyCfIkG3UgZi8Yqs6bJX1inU7YX40ugzNQg',
);

/**
 * This function checks if a values of sub-array exist inside another array ( in no particular order )
 * Returns true if yes. Otherwise returns false
 * @param arr - original/ parent array.
 * @param subArr - the array that is searched for inside arr
 * @returns - boolean
 * * Usage - used in select/ unselect all assets in delivery flow
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const containsAllValues = (arr: any[], subArr: any[]) => {
  return subArr.every(element => arr.includes(element));
};

/**
 * Function to return coordinates as an object containing lat lng from a string
 * @param location - string with comma seperated coordinates in (lng, lat) format
 * ? example - "(77.08429251089768,28.50154758284854)"
 */
export const retrieveCoordsFromString = (location: string) => {
  const formattedLocation = location?.replace(/\(|\)/g, '');
  const coords = formattedLocation?.split(',');
  return {
    lat: parseFloat(coords[1]),
    lng: parseFloat(coords[0]),
  };
};

/**
 * Generates an array of dates for a given number of days.
 *
 * @param days - The number of days for which to generate the dates.
 * @returns An array of SlotDate objects representing the dates.
 */
export const getDateRangeArray = (days: number) => {
  const datesArray: SlotDate[] = [];
  const today = DateTime.now();
  for (let i = 0; i < days; i++) {
    const currentDay = today.plus({days: i});
    datesArray.push({
      day: `${currentDay.toFormat('ccc')}`,
      dayOfWeek: `${currentDay.toFormat('dd')}`,
      month: `${currentDay.toFormat('MMM')}`,
      year: `${currentDay.toFormat('yyyy')}`,
      value: `${currentDay.toFormat('yyyy-MM-dd')}`,
    });
  }

  return datesArray;
};

//todo : types to be added later
/**
 * Function to find the default franchise.
 * - If is_fuelbuddy is true for a partner, treat that partner as the default franchise.
 * - If no is_fuelBuddy check franchise is found,
 * select the first franchise with associated product_partner_localities_prices.
 * @param {Partner[]} partners - Array of Partners to filter.
 * @returns {Partner | undefined} - The selected franchise or undefined if none found.
 */
export const findDefaultFranchise = (partners: any): any | undefined => {
  const isFuelBuddyFranchise = partners?.find((obj: any) => obj?.is_fuelbuddy);
  const partnerWithPriceExists = partners?.find((obj: any) => {
    return obj?.partner_localities[0]?.product_partner_localities_prices.length;
  });
  return isFuelBuddyFranchise ? isFuelBuddyFranchise : partnerWithPriceExists;
};

export const haversineDistance = (args: {
  origin: {lat: number; lng: number};
  destination: {lat: number; lng: number};
}) => {
  const R = 6371.8; // Radius of the Earth in km
  const rlat1 = args.origin.lat * (Math.PI / 180);
  const rlat2 = args.destination.lat * (Math.PI / 180);
  const difflat = rlat2 - rlat1;
  const difflon = (args.destination.lng - args.origin.lng) * (Math.PI / 180);

  const d =
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2),
      ),
    );
  return Math.round(d);
};

/**
 * Validates quantity based on specified criteria for Buddy Can and Minimum Order Quantity (MOQ) enabled zones.
 * @param {Object} args - The input arguments for quantity validation.
 * @param {number} args.inputValue - The input quantity value
 * @param {boolean} args.isMultipleOf20 - Indicates whether the quantity is a multiple of 20.
 * @param {Localities} args.locality - The locality information
 * @returns {string} - An error message if validation fails, otherwise an empty string.
 */
export const handleQuantityValidation = (args: {
  inputValue: number;
  isMultipleOf20: boolean;
  locality: Localities;
}): string => {
  const MIN_BUDDY_CAN_QUANTITY = 120;
  let err = '';
  const minQty = args?.locality?.minimum_order_quantity;
  const isMOQEnabled = args?.locality?.is_minimum_order_quantity_enabled;
  const isBuddyCanEnabled = args?.locality?.is_buddycan_delivery;

  if (
    isBuddyCanEnabled &&
    args?.inputValue < MIN_BUDDY_CAN_QUANTITY &&
    !isMOQEnabled
  ) {
    err = args.isMultipleOf20 ? '' : 'Please enter multiples of 20';
  } else if (
    isMOQEnabled &&
    args.inputValue < (minQty as number) &&
    !isBuddyCanEnabled
  ) {
    err = `Min. Order Quantity ${minQty} Ltr.`;
  } else if (isBuddyCanEnabled && isMOQEnabled) {
    const dynamicMoq = minQty || 0;

    if (dynamicMoq < MIN_BUDDY_CAN_QUANTITY) {
      err =
        args?.inputValue < dynamicMoq
          ? args?.isMultipleOf20
            ? ''
            : `Min. order quantity ${dynamicMoq} Ltr.`
          : '';
    } else {
      err =
        (args?.inputValue <= MIN_BUDDY_CAN_QUANTITY && args?.isMultipleOf20) ||
        args?.inputValue >= dynamicMoq
          ? ''
          : 'Please enter a valid quantity';
    }
  }
  return err;
};

//todo : types to be added later
/**
 * This function returns the partner locality whose center of mass is nearest to the provided locations.
 * @param partners - The list of partners for which the nearest locality needs to be determined
 * @param point - Coordinates or locality from which the nearest locality is to be found.
 * @returns The partner locality with the center of mass coordinates closest to the provided coordinates.
 */
export function findNearestPolygon(partners: any, point: any): any {
  const initialResult = {
    nearestDistance: Infinity,
    nearestPolygon: undefined as string | undefined,
    nearestCentroid: [] as number[],
    nearestPartnerLocality: null as any | null,
  };

  partners.flatMap((featureCollection: any) => {
    return featureCollection.partner_localities
      .filter(
        (partnerLocality: any) =>
          partnerLocality?.locality &&
          partnerLocality?.locality?.area &&
          partnerLocality?.is_active,
      )
      .map((partnerLocality: any) => {
        const feature = partnerLocality?.locality?.area;
        const centroid = centerOfMass(feature);

        const distance = haversineDistance({
          destination: {
            lat: centroid.geometry.coordinates[1],
            lng: centroid.geometry.coordinates[0],
          },
          origin: {
            lat: point.lat,
            lng: point.lng,
          },
        });

        if (distance < initialResult.nearestDistance) {
          initialResult.nearestDistance = distance;
          initialResult.nearestPolygon = feature as string;
          initialResult.nearestCentroid = centroid?.geometry
            ?.coordinates as number[];
          initialResult.nearestPartnerLocality = partnerLocality as any;
        }

        return {
          feature,
          centroid,
          distance,
          partnerLocality,
        };
      });
  });

  return initialResult;
}

/**
 * Function to get amount formatted according to the defined currency ( India in this case )
 * @param amount - amount to be formatted
 * @returns number (the formatted amount or 0)
 */
export const formatAmountInternational = (amount: number) => {
  if (amount) {
    return Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } else {
    return 0;
  }
};

/**
 * This function returns a user role within an organization
 * @param org - organization against which we want to check the role
 * @returns -
 */

export const getBusinessRole = (
  orgUser: FetchAllOrgUsersByTypeQuery['organization_user'][0] | undefined,
) => {
  if (orgUser?.is_owner && !orgUser.organization?.is_business) {
    return 'individual';
  }

  if (orgUser?.is_owner && orgUser.organization?.is_business) {
    return 'owner';
  }

  if (orgUser?.role) {
    return orgUser.role?.role;
  }
  return 'user';
};

//reverse geocoding to get address from coords
export const getAddressFromCoords = async (coords: Coords) => {
  return new Promise<SimpleAddress>((resolve, reject) => {
    // Create a promise
    Geocoder.from({
      latitude: coords.lat,
      longitude: coords.lng,
    })
      .then(json => {
        let preciseLocation: any;
        preciseLocation = json.results.find((location: any) => {
          return location.geometry.location_type === 'RANGE_INTERPOLATED';
        });

        if (!preciseLocation) {
          preciseLocation = json.results.find((location: any) => {
            return location.geometry.location_type === 'ROOFTOP';
          });
        }

        if (!preciseLocation) {
          preciseLocation = json.results.find((location: any) => {
            return location.geometry.location_type === 'GEOMETRIC_CENTER';
          });
        }

        const state = preciseLocation?.address_components.find(
          (component: any) => {
            return (
              component.types.includes('administrative_area_level_1') &&
              component.types.includes('political')
            );
          },
        );

        const city = preciseLocation?.address_components.find(
          (component: any) => {
            return (
              component.types.includes('locality') &&
              component.types.includes('political')
            );
          },
        );

        const country = preciseLocation?.address_components.find(
          (component: any) => {
            return (
              component.types.includes('country') &&
              component.types.includes('political')
            );
          },
        );
        const pinCode = json.results[0]?.address_components?.find(obj =>
          obj.types.includes('postal_code'),
        )?.long_name;

        const address = {
          formattedAddress: preciseLocation?.formatted_address || '',
          place_id: json.results[0]?.place_id,
          pinCode: pinCode as string,
          city: city?.long_name || '',
          state: state?.long_name || '',
          country: country?.long_name || '',
          countryCode: country?.short_name || '',
          coordinates: {lat: coords.lat, lng: coords.lng},
        };
        resolve(address);
      })
      .catch(error => {
        console.warn(error);
        reject(error);
      });
  });
};

/**
 * Checks if a number is a multiple of another number
 * Needed for buddy can deliveries
 * @param args - the number to be checked and the number whose multiple it should be
 * @param callback - any side effects we might want to perform
 * @returns - boolean. If multiple - true, else false
 */
export const checkForMultipleOfNumber = (
  args: {
    numToBeChecked: number;
    multipleOf: number;
  },
  callback?: () => void,
) => {
  if (
    isNaN(args.numToBeChecked) ||
    args.numToBeChecked % args.multipleOf !== 0
  ) {
    if (callback) {
      callback();
    }
    return false;
  }
  return true;
};

/**
 * Retrieves the delivered date from a list of state flows.
 *
 * @param {Customer_Order_Item_Stateflow[]} stateflows - An array of state flows to search for the delivered state.
 * @return {string} The delivered date in the format 'dd-MM-yyyy or '-' if not found.
 */
export const getDeliveredDate = (
  stateflows: Customer_Order_Item_Stateflow[],
): string => {
  const deliveredState = stateflows?.find(({state}) => state === 'DELIVERED');

  if (deliveredState?.created_at) {
    return DateTime.fromISO(deliveredState.created_at, {zone: 'utc'})
      ?.setZone('Asia/Kolkata')
      ?.toFormat('dd-MM-yyyy');
  }
  return '-';
};
export const getDeliveredTime = (
  stateflows: Customer_Order_Item_Stateflow[],
): string => {
  const deliveredState = stateflows?.find(({state}) => state === 'DELIVERED');

  if (deliveredState?.created_at) {
    return DateTime.fromISO(deliveredState.created_at, {zone: 'utc'})
      ?.setZone('Asia/Kolkata')
      ?.toFormat('hh:mm a');
  }
  return '-';
};

/**
 * This function removes null values from a string.
 * @param data - The input string from which null values need to be removed.
 * @returns A string without null values.
 */
export const replaceNullValueInString = (data: string) => {
  return data.replace(/\bnull\b/g, '');
};

/**
 * Retrieves the delivered quantity from a custom order item.
 *
 * @param {Customer_Order_Item} customOrderItem - The custom order item to retrieve the delivered quantity from.
 * @return {string} The delivered quantity as a string, or '-' if not found.
 */
export const getDeliveredQuantity = (
  customOrderItem: Customer_Order_Item,
): string => {
  const {task} = customOrderItem || {};
  const {task_values} = task || {};

  const challanValue = task_values?.find(
    tv => tv.key === 'CHALLAN',
  )?.quantity_dispensed;

  return challanValue ? parseFloat(challanValue.toString()).toFixed(2) : '-';
};

/**
 * Calculates the net total of a customer order without GST.
 *
 * @param {Customer_Order} customer_order - The customer order to calculate the net total for.
 * @return {string | number} The net total without GST as a string or number, or '-' if the order is not delivered or has no invoices.
 */
export const getNetTotalWithoutGst = (
  customer_order: Customer_Order,
): string | number => {
  if (
    customer_order?.state === Customer_Order_State_Enum.Delivered &&
    customer_order?.invoices?.[0]
  ) {
    const {amount, delivery_fee} = customer_order.invoices[0];
    const netTotal = (amount as number) - parseFloat(delivery_fee || '0');
    return netTotal.toFixed(2);
  }
  return '-';
};

/**
 * Retrieves the formatted delivery fee for a customer order.
 *
 * @param {Customer_Order} customerOrder - The customer order to retrieve the delivery fee for.
 * @return {number | string} The formatted delivery fee as a number or string. If the delivery fee is present in the invoices array of the customer order, it is formatted using the `formatAmountInternational` function. Otherwise, the `delivery_fee` property of the customer order is formatted using the `formatAmountInternational` function.
 */
export const getFormattedDeliveryFee = (
  customerOrder: Customer_Order,
): number | string => {
  if (customerOrder?.invoices?.length) {
    return `${customerOrder?.invoices[0]?.delivery_fee || 0}`;
  }
  const deliveryFee = customerOrder?.delivery_fee || '0';

  if (deliveryFee) {
    return deliveryFee;
  } else {
    return `${(customerOrder?.delivery_fee as number) || 0}`;
  }
};

export const getFormattedDiscount = (customerOrder: Customer_Order): string => {
  const invoiceDiscount = customerOrder?.invoices?.[0]?.discount_amount;
  return `${
    invoiceDiscount
      ? formatAmountInternational(invoiceDiscount)
      : customerOrder?.voucher_discount || 0
  }`;
};

export const getFormattedTotalAmount = (
  customerOrder: Customer_Order,
  amt: string,
): number | string => {
  const amount =
    customerOrder?.state === Customer_Order_State_Enum.Delivered
      ? customerOrder?.invoices?.[0]?.amount
      : parseFloat(`${amt}`) -
        parseFloat(`${customerOrder?.voucher_discount}` || '0');
  return parseFloat(`${amount}`).toFixed(2);
};

/**
 * Retrieves the delivery time slot from the given slot object.
 *
 * @param {Product_Variation_Partner_Localities_Slots} slot - The slot object containing start and end times.
 * @return {string} The formatted delivery time slot in the format 'start time - end time'.
 */
export const getDeliverySlot = (
  slot: Product_Variation_Partner_Localities_Slots,
): string => {
  const formattedStartTime = slot?.start_time
    ? DateTime.fromFormat(slot.start_time, 'HH:mm:ssZZ').toFormat('hh:mm a')
    : '';

  const formattedEndTime = slot?.end_time
    ? DateTime.fromFormat(slot.end_time, 'HH:mm:ssZZ').toFormat('hh:mm a')
    : '';

  return `${formattedStartTime} - ${formattedEndTime}`;
};

/**
 * Maps a customer's order state to a status string.
 * @param {Customer_Order_State_Enum} state - The order state.
 * @returns {string} The corresponding status ('In Progress', 'Delivered', 'Cancelled').
 */
export const getOrderStatus = (state: Customer_Order_State_Enum): string => {
  switch (state) {
    case Customer_Order_State_Enum.Paid:
    case Customer_Order_State_Enum.PayLater:
      return 'In Progress';
    case Customer_Order_State_Enum.Delivered:
      return 'Delivered';
    case Customer_Order_State_Enum.Cancelled:
      return 'Cancelled';
    default:
      return state;
  }
};

export const requestExternalStoragePermission = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'This app needs access to your storage to download the file',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Error requesting storage permission:', error);
    return false;
  }
};
export const generateAndShareCSV = async (jsonData: any, filename: string) => {
  try {
    const currencyFixedData = jsonData.map((item: any) => ({
      ...item,
      // 'Total Amount': `${item['Total Amount']}`.replace(/₹/g, 'Rs'),
    }));
    const csv = json2csv(currencyFixedData);
    const tempFilePath = `${RNFS.DocumentDirectoryPath}/${filename}.csv`;

    // Write CSV file
    await RNFS.writeFile(tempFilePath, csv, 'utf8');

    // Share options using the direct file path
    const shareOptions = {
      title: 'CSV Report',
      message: '',
      url: `file://${tempFilePath}`, // Use the direct file path
      type: 'text/csv',
    };

    // Share the CSV
    await Share.open(shareOptions);

    // Delete the temporary file
    await RNFS.unlink(tempFilePath);
  } catch (error) {
    console.error(`Error while sharing ${filename}:`, error);
  }
};
/**
 * Checks whether an order is a postpaid order based on the organization user being postpaid
 * and customer payment methods exists at the specified address.
 * @param args - An object containing the address and organization user information.
 * @param args.address - The organization address to check for payment methods.
 * @param args.orgUser - The modified organization user to check for postpaid status.
 *
 * @returns {boolean} - Returns true if the address has associated payment methods
 * and the organization user is postpaid; otherwise, returns false.
 */
export const isEligibleForPrepaid = (args: {
  address: FetchAddressByTypeQuery['organization_address'][0];
  orgUser: Organization_User;
}): boolean => {
  const hasAddressPaymentMethods =
    args?.address?.organization_address_payment_methods?.length;
  const isCreditAvailable = args?.orgUser?.organization?.is_credit_available;

  return (hasAddressPaymentMethods && isCreditAvailable) || false;
};

export const requestAppPermissions = async () => {
  if (Platform.OS === 'ios') {
    try {
      const permissionResponse = await requestMultiple([
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      ]);

      return permissionResponse['ios.permission.LOCATION_WHEN_IN_USE'];
    } catch (error) {
      throw new Error('Location permission denied');
    }
  }

  if (Platform.OS === 'android') {
    try {
      const permissionResponse = await requestMultiple([
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      return permissionResponse['android.permission.ACCESS_FINE_LOCATION'];
    } catch (error) {
      throw new Error('Location permission denied');
    }
  }
};

export const fetchCurrentLocation = () => {
  return new Promise<Coords | null>(resolve => {
    try {
      Geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          locationStore.setState(state => ({
            ...state,
            currentCoords: coords,
          }));

          resolve(coords);
        },
        () => {
          resolve(null);
        },
      );
    } catch (err) {
      throw new Error(
        'Failed to fetch current location. Make sure location permission is enabled',
      );
    }
  });
};
