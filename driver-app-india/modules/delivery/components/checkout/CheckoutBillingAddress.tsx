// dependencies
import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Briefcase} from 'phosphor-react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';

// components
import {Button, Text, TextButton, SimpleBottomSheet} from '@/components';
import AddBillingAddressList from './AddBillingAddress';
import {AddBillingNewForm} from '../address';

// services
import {AddressService} from '@/services';
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// store
import {deliveryStore, orderStore} from '@/globalStore';

// types and styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {FetchAddressByTypeQuery} from '@/generated/graphql';
import {commonBottomSheetView} from '@/styles';
import {Address_Type_Enum} from '@/generated/graphql';

const BillingAddressCheckout: React.FC = () => {
  const billingAddressView = deliveryStore.use.billingAddressView();
  const billingAddress = deliveryStore.use.selectedBillingAddress();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  useEffect(() => {
    AddressService.getBillingAddresses({
      address_type: Address_Type_Enum.Billing,
      organization_user_id: getActiveDelOrgUserId() as string,
    }).then(response => {
      const activeAddresses = response.filter(address => {
        return address.is_active;
      });

      if (activeAddresses.length) {
        deliveryStore.setState(state => ({
          ...state,
          billingAddressView: 'select',
        }));
      } else {
        deliveryStore.setState(state => ({
          ...state,
          billingAddressView: 'add',
        }));
      }
    });

    if (!billingAddress) {
      setTimeout(() => {
        openBottomSheet();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      {!billingAddress ? (
        <AddBillingAddress openBottomSheet={openBottomSheet} />
      ) : (
        <BillingAddressDetails
          billingAddress={billingAddress}
          openBottomSheet={openBottomSheet}
        />
      )}

      {/* bottom sheet to select/add billing address */}
      <SimpleBottomSheet
        ref={bottomSheetRef}
        index={0}
        closeSheet={closeBottomSheet}
        snapPoints={['96%']}>
        <BottomSheetView style={[commonBottomSheetView]}>
          {billingAddressView === 'select' ? (
            <AddBillingAddressList closeBottomSheet={closeBottomSheet} />
          ) : (
            <AddBillingNewForm closeBottomSheet={closeBottomSheet} />
          )}
        </BottomSheetView>
      </SimpleBottomSheet>
    </View>
  );
};

interface AddBillingAddressProps {
  openBottomSheet: () => void;
}

// add billing address btn
const AddBillingAddress: React.FC<AddBillingAddressProps> = ({
  openBottomSheet,
}) => {
  return (
    <View style={[styles.container, styles.billingAddressDetails]}>
      <Button
        variant="outlined"
        onPress={openBottomSheet}
        style={{
          width: '80%',
          borderRadius: 20,
          borderColor: FBBorders.error,
          backgroundColor: FBBackground.error,
        }}
        textStyle={{color: FBColors.white, fontSize: 16}}>
        Add Billing Address
      </Button>
    </View>
  );
};

interface BillingAddressDetails {
  billingAddress: FetchAddressByTypeQuery['organization_address'][0];
  openBottomSheet: () => void;
}

const BillingAddressDetails: React.FC<BillingAddressDetails> = ({
  billingAddress,
  openBottomSheet,
}) => {
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  return (
    <View style={styles.container}>
      <Briefcase size={24} />
      <View>
        <View>
          <Text weight="600">Billing at {billingAddress?.name}</Text>

          <Text
            size="sm"
            weight="400"
            appearance="light"
            style={{marginTop: 10, maxWidth: '92%'}}
            lines={1}>
            {billingAddress?.address_line1}
          </Text>
        </View>
        {!isUpComingOrderVerify && (
          <TextButton
            onPress={openBottomSheet}
            underline
            textSize="sm"
            weight="400"
            style={{marginTop: 10}}>
            Change Billing Address
          </TextButton>
        )}
      </View>
    </View>
  );
};

export default BillingAddressCheckout;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    columnGap: 10,
    borderBottomWidth: 1,
    borderColor: FBBorders.secondary,
    paddingBottom: 16,
  },
  billingAddressDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
