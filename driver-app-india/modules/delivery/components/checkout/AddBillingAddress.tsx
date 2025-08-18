//dependencies
import React, {useEffect, useState} from 'react';
import {View, FlatList} from 'react-native';
import analytics from '@react-native-firebase/analytics';

//imports
import {Button, Divider, Text} from '@/components';
import {AddressCard} from '@/modules/address/components';

//stores
import {deliveryStore, addressStore, businessStore} from '@/globalStore';

//types
import {FetchAddressByTypeQuery} from '@/generated/graphql';
import {DeliveryService} from '@/services';

interface AddBillingAddressProps {
  closeBottomSheet: () => void;
}

const AddBillingAddress: React.FC<AddBillingAddressProps> = ({
  closeBottomSheet,
}) => {
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const billingAddressList = addressStore.use.billingAddresses();
  const startLoader = deliveryStore.use.startLoader();
  const shippingAddress = deliveryStore.use.selectedShippingAddress();
  const selectedProduct = deliveryStore.use.selectedDeliveryProducts();
  const selectedSlot = deliveryStore.use.selectedSlot();
  const stopLoader = deliveryStore.use.stopLoader();

  const [sortedBillingAddresses, setSortedBillingAddresses] = useState<
    FetchAddressByTypeQuery['organization_address']
  >([]);

  useEffect(() => {
    const sortedAddresses = [];
    const activeAddresses = billingAddressList.filter(address => {
      return address?.is_active;
    });

    const billingAddressWithGST = activeAddresses.filter(address => {
      return address?.gst_number;
    });

    sortedAddresses.push(...billingAddressWithGST);

    const billingAddressWithoutGST = activeAddresses.filter(address => {
      return !address?.gst_number;
    });

    sortedAddresses.push(...billingAddressWithoutGST);

    setSortedBillingAddresses(sortedAddresses);
  }, [billingAddressList]);

  //to add billing address
  const selectBillingAddress = async (
    address: FetchAddressByTypeQuery['organization_address'][0],
  ) => {
    deliveryStore.setState(state => ({
      ...state,
      selectedBillingAddress: address,
    }));
    startLoader('fetchDeliveryFee');

    DeliveryService.fetchDeliveryFee({
      object: {
        organization_user_id: activeDeliveryOrgUser?.id,
        product_variation_id: selectedProduct[0]?.product?.variation_id,
        qty: `${selectedProduct[0]?.product?.qty}`,
        shipping_address_id: shippingAddress?.id,
        billing_address_state_id: address?.state?.id,
        express_delivery_fees: selectedSlot?.expressDelivery
          ? `${selectedSlot?.expressDelivery}`
          : '0',
      },
    }).then(res => {
      /**
       * After fetching the delivery fee, we need to calculate the total amount
       * we store the total amount in delivery store
       */
      const amount =
        selectedProduct[0].product?.qty * selectedProduct[0].product?.salePrice;

      const totalAmount = amount + parseFloat(res.total_amount as string);

      deliveryStore.setState(state => ({
        ...state,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
      }));
    });
    // .finally(() => {
    //   stopLoader('fetchDeliveryFee');
    // });

    // Log Firebase Analytics event for selecting a billing address
    try {
      await analytics().logEvent('Billing_Address_Selected_Event', {
        addressId: address?.id,
        addressState: address?.state?.name, // You can add other details as needed
        addressGST: address?.gst_number ? 'With GST' : 'Without GST',
      });
      console.log('---Billing_Address_Selected_Event-----');
    } catch (error) {
      console.error('--Error-Billing_Address_Selected_Event----', error);
    }

    closeBottomSheet();
  };

  const changeView = () => {
    deliveryStore.setState(state => ({
      ...state,
      billingAddressView: 'add',
    }));
  };

  return (
    <View style={{flex: 1}}>
      <View>
        <Text size="lg" weight="500">
          Select Billing Address
        </Text>
        <Divider height={16} />
        <Text size="sm" color="complementary" style={{maxWidth: '90%'}}>
          Select billing address to your FuelBuddy profile is essential for
          efficient order placement.
        </Text>
      </View>
      <Divider height={16} />
      <View style={{flex: 5}}>
        {sortedBillingAddresses.length ? (
          <>
            <View style={{flex: 1}}>
              <Divider height={16} />
              <FlatList
                data={sortedBillingAddresses}
                ListEmptyComponent={null}
                style={{flex: 1}}
                contentContainerStyle={{paddingBottom: 10}}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={Divider}
                renderItem={({item}) => (
                  <AddressCard
                    address={item}
                    onPress={() => {
                      selectBillingAddress(item);
                    }}
                    disabled={false}
                  />
                )}
              />
            </View>
          </>
        ) : null}
        <Divider />
      </View>
      <View style={{flex: 1, paddingHorizontal: 16}}>
        <Button variant="outlined" onPress={changeView}>
          Add New Address
        </Button>
      </View>
    </View>
  );
};

export default AddBillingAddress;
