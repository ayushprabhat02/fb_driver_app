// dependencies
import React, {useMemo, useRef, useCallback, useState} from 'react';
import {vs} from 'react-native-size-matters';
import {
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';

// components
import DetailsComponent from '../DetailsComponent';
import {Text, SimpleBottomSheet, Button} from '@/components';

// store
import deliveryStore from '../../store';

// styles
import {commonInputStyles} from '@/styles';

const OrderInstructions: React.FC = () => {
  const instructions = deliveryStore.use.orderInstructions();

  const [orderInstructions, setOrderInstructions] = useState('');

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // variables
  const snapPoints = useMemo(() => ['40%'], []);

  // callbacks
  const openOrderInstructions = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const closeOrderInstructions = useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  const onBtnPress = () => {
    deliveryStore.setState(state => ({
      ...state,
      orderInstructions: orderInstructions,
    }));

    bottomSheetModalRef.current?.close();
  };

  return (
    <>
      <DetailsComponent
        showAddBtn
        onPress={openOrderInstructions}
        title="Order Instructions"
        cardStyle={{marginTop: vs(10), minHeight: 10, position: 'relative'}}>
        <Text>{instructions || 'No order instructions added'}</Text>
      </DetailsComponent>
      <SimpleBottomSheet
        snapPoints={snapPoints}
        ref={bottomSheetModalRef}
        closeSheet={closeOrderInstructions}>
        <BottomSheetView style={{padding: 16}}>
          <Text size="sm" weight="500">
            Add Order Instructions
          </Text>
          <BottomSheetTextInput
            onChangeText={val => setOrderInstructions(val)}
            value={orderInstructions}
            multiline={true}
            numberOfLines={4}
            style={[
              commonInputStyles,
              {
                minHeight: 80,
                marginTop: 10,
                paddingTop: 10,
                borderWidth: 1,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                textAlignVertical: 'top',
              },
            ]}
          />
          <Button onPress={onBtnPress} variant="solid" style={{marginTop: 40}}>
            Add comment
          </Button>
        </BottomSheetView>
      </SimpleBottomSheet>
    </>
  );
};

export default OrderInstructions;

// const styles = StyleSheet.create({});
