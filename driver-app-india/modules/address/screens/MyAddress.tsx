import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Text} from 'react-native';
import {ScaledSheet, ms} from 'react-native-size-matters';
import {useFocusEffect} from '@react-navigation/native';

// components
import {Chip, FullScreenLoader, HeaderAvoidingContainer} from '@/components';
import {ToggleAddressCard} from '@/modules/address/components';

// services
import {AddressService} from '@/services';

// actions, utils
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// styles
import {headerTransparentContainer} from '@/styles';

// types
import {Address_Type_Enum} from '@/generated/graphql';

type AddressType = 'SHIPPING' | 'BILLING';
type Address = {
  label: string;
  value: AddressType;
};

const addressTypes: Address[] = [
  {
    label: 'Shipping',
    value: 'SHIPPING',
  },
  {
    label: 'Billing',
    value: 'BILLING',
  },
];

const MyAddress: React.FC = () => {
  const [activeAddressType, setActiveAddressType] =
    useState<AddressType>('SHIPPING');
  const [allDeliveryAddressesInView, setAllDeliveryAddressesInView] =
    useState<any>();
  const [loading, setLoading] = useState(true);

  const fetchAllDeliveryAddress = async () => {
    setLoading(true);
    if (activeAddressType === 'SHIPPING') {
      const address = await AddressService.getShippingAddresses({
        address_type: Address_Type_Enum.Shipping,
        organization_user_id: getActiveDelOrgUserId(),
      });
      setAllDeliveryAddressesInView(address);
    } else {
      const address = await AddressService.getShippingAddresses({
        address_type: Address_Type_Enum.Billing,
        organization_user_id: getActiveDelOrgUserId(),
      });
      setAllDeliveryAddressesInView(address);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllDeliveryAddress();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAddressType]),
  );

  useEffect(() => {
    return () => {
      AddressService.getShippingAddresses({
        address_type: Address_Type_Enum.Shipping,
        organization_user_id: getActiveDelOrgUserId(),
      });
    };
  }, []);

  return (
    <HeaderAvoidingContainer>
      <View>
        <View style={{flexDirection: 'row'}}>
          {addressTypes.map(address => (
            <Chip
              key={address.label}
              active={activeAddressType === address.value}
              label={address.label}
              onPress={() => setActiveAddressType(address.value)}
              shape="rounded"
              style={styles.chipContainer}
            />
          ))}
        </View>
        {/* null check */}
        {!loading && allDeliveryAddressesInView.length === 0 && (
          <Text style={{paddingTop: 20, marginLeft: 20, fontSize: 15}}>
            No {activeAddressType.toLowerCase()} address found.
          </Text>
        )}
        <FlatList
          data={allDeliveryAddressesInView}
          keyExtractor={(address: any) => address.id}
          renderItem={({item}: {item: any}) => (
            <ToggleAddressCard
              addressDetails={item}
              callbackOnToggle={fetchAllDeliveryAddress}
            />
          )}
          windowSize={10}
          style={{
            height: '85%',
            marginTop: ms(20),
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FullScreenLoader
        showLoader={loading}
        loaderText={`Fetching ${activeAddressType.toLowerCase()} addresses`}
      />
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  chipContainer: {
    width: '120@s',
    height: '40@vs',
  },
  containerTop: {
    ...headerTransparentContainer,
  },
});

export default MyAddress;
