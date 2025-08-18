// dependencies
import React, {useEffect} from 'react';
import {View, Pressable, Platform, Dimensions} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {hasNotch} from 'react-native-device-info';
import {User, CaretCircleDown} from 'phosphor-react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {DateTime} from 'luxon';

// store
import {
  addressStore,
  businessStore,
  deliveryStore,
  homeStore,
} from '@/globalStore';

//services
import {
  AddressService,
  DeliveryService,
  HomeService,
  LocationService,
} from '@/services';
import {retrieveCoordsFromString} from '@/utils/general';

//imports
import {Text} from '..';

// types
import {FBBackground, FBColors} from '@/types/styles';
import {useNavigation} from '@react-navigation/native';

import {
  Address_Type_Enum,
  Customer_Order_Item_State_Enum,
} from '@/generated/graphql';

const SwitchProfileHeader: React.FC = () => {
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const loader = businessStore.use.loaders();
  const startLoaderDelivery = deliveryStore.use.startLoader();
  const stopLoaderDelivery = deliveryStore.use.stopLoader();
  const stopLoaderAddress = addressStore.use.stopLoader();

  const selectedShippingAddress = deliveryStore.use.selectedShippingAddress();

  const navigation = useNavigation();

  /**
   *  * Moved home page API calls here due bottom sheet behaviour
   * if a state is changing, bottom sheet opens up on it's own due to re-render of the component
   * hence moved the state inside child component ( SwitchProfileHeader )
   */

  useEffect(() => {
    if (activeDeliveryOrgUser) {
      HomeService.getLastCustomerOrder({
        organization_user_id: activeDeliveryOrgUser?.id,
      }).then(response => {
        if (response.length) {
          homeStore.setState(state => ({
            ...state,
            showRepeatOrder: true,
          }));
        } else {
          false;
        }
      });

      HomeService.fetchCustomerStatistic({
        organization_user_id: activeDeliveryOrgUser?.id,
        state: Customer_Order_Item_State_Enum.Delivered,
      });

      AddressService.getShippingAddresses({
        address_type: Address_Type_Enum.Shipping,
        organization_user_id: activeDeliveryOrgUser?.id,
      }).finally(() => {
        stopLoaderAddress('fetchAddresses');
      });

      AddressService.getBillingAddresses({
        address_type: Address_Type_Enum.Billing,
        organization_user_id: activeDeliveryOrgUser?.id,
      });
    }
  }, [activeDeliveryOrgUser, stopLoaderAddress]);

  const selectAddress = async () => {
    startLoaderDelivery('fetchDeliverySlots');
    deliveryStore.setState(state => ({
      ...state,
      fetchedDeliverySlots: [],
      slotsToDisplay: [],
      selectedDate: '',
      selectedSlot: undefined,
      selectedDateForDisplay: '',
      selectedSlotForDisplay: undefined,
    }));
    const coords = retrieveCoordsFromString(selectedShippingAddress?.location);

    /**
     * Before we can select an address, we need to check if the address is serviceable.
     * Here we call the checkServiceability method from the LocationService class.
     * This method returns the partners (if any) that are serviceable at the given location.
     * If the response is not null/undefined, we set the selectedShippingAddress in the deliveryStore.
     * This is a necessary step before we can proceed to the next step in the delivery flow.
     */
    const response = await LocationService.checkServiceability({
      latitude: coords.lat,
      longitude: coords.lng,
    });

    if (response && response?.partner_localities) {
      /**
       * If serviceable, we fetch the products of that particular partner.
       */

      DeliveryService.getProductsForDeliveryWithPrice({
        id: response.partner_localities[0]?.product_partner_localities_prices[0]
          ?.parent_id,
      });

      /**
       * Then we fetch the timeslots of that partner
       */

      DeliveryService.fetchDeliveryDatesWithSlots({
        date: DateTime.now().toISO() as string,
        latitude: coords.lat,
        longitude: coords.lng,
      }).finally(() => {
        stopLoaderDelivery('fetchDeliverySlots');
      });
    }
  };

  useEffect(() => {
    if (selectedShippingAddress) {
      selectAddress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShippingAddress]);

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Pressable
          onPress={() => navigation.navigate('settings')}
          style={styles.settingsBtn}>
          <User size={22} color={FBColors.neutral} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {paddingTop: hasNotch() ? 50 : 35, alignItems: 'flex-end'},

  settingsBtn: {
    width: 56,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: FBBackground.primary,
    borderRadius: 100,
  },

  profileName: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 0,
    maxWidth:
      Platform.OS === 'android' ? 250 : Dimensions.get('window').width - 120,
    columnGap: 8,
  },
});

export default SwitchProfileHeader;
