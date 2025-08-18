// dependencies
import {Pressable, StyleSheet, View} from 'react-native';
import React, {useRef} from 'react';
import {ClipboardText, CaretRight} from 'phosphor-react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

// components
import {Divider, SimpleBottomSheet, Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';

// services
// import {DeliveryService} from '@/services';
import {formatAmountInternational} from '@/utils/general';

// styles and types
import {FBBorders} from '@/types/styles';
import {commonBottomSheetView} from '@/styles';

const CheckoutBill: React.FC = () => {
  const selectedProducts = deliveryStore.use.selectedDeliveryProducts();
  const billingAddress = deliveryStore.use.selectedBillingAddress();
  const deliveryFee = deliveryStore.use.deliveryFee();
  const grandTotal = deliveryStore.use.totalAmount();
  const loaders = deliveryStore.use.loaders();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    if (grandTotal) {
      bottomSheetModalRef?.current?.present();
    }
  };

  const closeBottomSheet = () => {
    bottomSheetModalRef?.current?.close();
  };

  // common function to calculate amount
  const calculateAmount = (amount: string) => {
    return formatAmountInternational(parseFloat(amount));
  };

  return (
    <Pressable style={styles.container} onPress={openBottomSheet}>
      {billingAddress ? (
        <CaretRight
          style={{position: 'absolute', right: 0, top: 10}}
          size={16}
          weight="bold"
        />
      ) : null}
      <ClipboardText size={24} weight="light" />
      {billingAddress ? (
        !loaders.fetchDeliveryFee ? (
          <View>
            <View>
              <Text weight="300">
                Total Bill,{' '}
                <Text weight="600">{calculateAmount(`${grandTotal}`)}</Text>
              </Text>

              <Text
                size="sm"
                weight="400"
                style={{marginTop: 10}}
                lines={1}
                appearance="light">
                Inclusive of taxes and charges
              </Text>
            </View>
          </View>
        ) : (
          <SkeletonPlaceholder>
            <>
              <SkeletonPlaceholder.Item
                width={180}
                height={18}
                borderRadius={6}
              />
              <SkeletonPlaceholder.Item
                width={200}
                height={18}
                borderRadius={6}
                marginTop={10}
              />
            </>
          </SkeletonPlaceholder>
        )
      ) : (
        <View>
          <View>
            <Text weight="300">Add billing address</Text>
            <Text
              size="sm"
              weight="400"
              style={{marginTop: 10, maxWidth: '90%'}}
              appearance="light">
              Billing address is needed to calculate total amount
            </Text>
          </View>
        </View>
      )}

      <SimpleBottomSheet
        ref={bottomSheetModalRef}
        snapPoints={['50%']}
        closeSheet={closeBottomSheet}>
        <BottomSheetView style={commonBottomSheetView}>
          <View>
            <Text size="lg" weight="600">
              Order Summary
            </Text>
            <Divider height={32} />
            <View
              style={{
                borderWidth: 1,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderColor: FBBorders.secondary,
                borderRadius: 16,
              }}>
              <View style={styles.row}>
                <Text size="sm" appearance="light" weight="600">
                  Item(s) total
                </Text>
                <Text size="sm" weight="600">
                  {selectedProducts.map(product => {
                    return calculateAmount(
                      (product.product.qty * product.product.salePrice).toFixed(
                        2,
                      ),
                    );
                  })}
                </Text>
              </View>
              <View style={styles.row}>
                <Text size="sm" appearance="light" weight="600">
                  Delivery Fee
                </Text>
                <Text size="sm" weight="600">
                  {deliveryFee
                    ? calculateAmount(deliveryFee?.delivery_fees as string)
                    : 'FREE'}
                </Text>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <Text size="sm" appearance="light" weight="600">
                  Taxes & Charges
                </Text>
                <Text size="sm" weight="600">
                  {calculateAmount(deliveryFee?.tax_amount as string)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text size="sm" appearance="light" weight="600">
                  Balance to pay
                </Text>
                <Text color="complementary" size="sm" weight="600">
                  {calculateAmount(`${grandTotal}`)}
                </Text>
              </View>
            </View>
          </View>
        </BottomSheetView>
      </SimpleBottomSheet>
    </Pressable>
  );
};

export default CheckoutBill;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    columnGap: 10,
    borderBottomWidth: 1,
    borderColor: FBBorders.secondary,
    paddingBottom: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  amount: {
    fontSize: 14,
  },

  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  borderBottom: {
    paddingBottom: 10,
    borderBottomColor: FBBorders.primary,
    borderBottomWidth: 1,
  },
});
