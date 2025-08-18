// dependencies
import React, {useRef} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Truck} from 'phosphor-react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {PencilSimpleLine} from 'phosphor-react-native';

// components
import {SimpleBottomSheet, Text, TextButton} from '@/components';

// store
import {deliveryStore, orderStore} from '@/globalStore';
import {FBBorders, FBColors} from '@/types/styles';
import {commonBottomSheetView} from '@/styles';
import AddOrderNoteInput from './AddOrderNoteInput';

const ShippingAddressCheckout: React.FC = () => {
  const shippingAddress = deliveryStore.use.selectedShippingAddress();
  const orderInstructions = deliveryStore.use.orderInstructions(); //todo: to be used later
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetModalRef.current?.close();
  };

  return (
    <View style={styles.container}>
      <Truck size={24} />
      <View>
        <View>
          <Text weight="600" lines={1} style={{maxWidth: '95%'}}>
            Delivery at {shippingAddress?.name}
          </Text>

          <Text
            size="sm"
            weight="400"
            appearance="light"
            style={{marginTop: 10, maxWidth: '92%'}}
            lines={1}>
            {shippingAddress?.address_line1}
          </Text>
        </View>
        {orderInstructions ? (
          <View
            style={{
              position: 'relative',
              marginTop: 10,
            }}>
            <Text
              size="sm"
              color="complementary"
              style={{width: '85%', maxWidth: '85%'}}
              lines={1}>
              Order Note - {orderInstructions}
            </Text>
            <Pressable
              onPress={openBottomSheet}
              style={{position: 'absolute', right: 4, top: 0}}>
              <PencilSimpleLine size={20} color={FBColors.complementary} />
            </Pressable>
          </View>
        ) : (
          !isUpComingOrderVerify && (
            <TextButton
              onPress={openBottomSheet}
              underline
              textSize="sm"
              weight="400"
              style={{marginTop: 10}}>
              Add order note
            </TextButton>
          )
        )}
      </View>
      <SimpleBottomSheet
        ref={bottomSheetModalRef}
        snapPoints={['50%']}
        closeSheet={closeBottomSheet}>
        <BottomSheetView style={commonBottomSheetView}>
          <AddOrderNoteInput closeBottomSheet={closeBottomSheet} />
        </BottomSheetView>
      </SimpleBottomSheet>
    </View>
  );
};

export default ShippingAddressCheckout;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 10,
    borderBottomWidth: 1,
    borderColor: FBBorders.secondary,
    paddingBottom: 16,
  },
});
