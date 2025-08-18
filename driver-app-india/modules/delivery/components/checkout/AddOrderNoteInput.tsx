// depenedencies
import {View} from 'react-native';
import React, {useState} from 'react';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';

// components
import {Button, Divider, Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';

// styles
import {commonInputStyles} from '@/styles';

interface Props {
  closeBottomSheet: () => void;
}

const AddOrderNoteInput: React.FC<Props> = ({closeBottomSheet}) => {
  const instruction = deliveryStore.use.orderInstructions();

  const [orderInstructions, setOrderInstructions] =
    useState<string>(instruction);

  const addNote = () => {
    deliveryStore.setState(state => ({
      ...state,
      orderInstructions: orderInstructions,
    }));
    closeBottomSheet();
  };

  return (
    <>
      <Text size="lg" weight="600">
        Add order note
      </Text>
      <Divider height={24} />
      <View>
        <BottomSheetTextInput
          placeholder="Provide the name and contact number of the delivery recipient in the order note"
          placeholderTextColor={'darkgray'}
          onChangeText={val => setOrderInstructions(val)}
          value={orderInstructions}
          multiline={true}
          numberOfLines={4}
          style={[
            commonInputStyles,
            {
              minHeight: 100,
              marginTop: 10,
              paddingTop: 10,
              borderWidth: 1,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              textAlignVertical: 'top',
            },
          ]}
        />
      </View>
      <Divider height={36} />
      <Button variant="solid" onPress={addNote}>
        Proceed
      </Button>
    </>
  );
};

export default AddOrderNoteInput;
