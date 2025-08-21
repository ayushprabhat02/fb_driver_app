//dependencies
import React from 'react';
import {SafeAreaView, ScrollView, TextInput} from 'react-native';
import {Container, Button, Text, SimpleBottomSheet} from '@/components';
import {ScaledSheet} from 'react-native-size-matters';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';

// conmponents
import {AddShippingAddressForm} from '../components';

//imports
import {FBColorPalette, FBColors} from '@/types/styles';
import {headerTransparentContainer} from '@/styles';

const AddShippingAddress = () => {
  const [addressNote, setAddressNote] = React.useState('');
  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  // variables
  const snapPoints = React.useMemo(() => ['50%'], []);
  // callbacks
  const openAddNoteModal = React.useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const closeModal = React.useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <ScrollView style={styles.body}>
        <Container>
          <AddShippingAddressForm
            addressNote={addressNote}
            onAddNoteButtonPress={() => openAddNoteModal()}
            serviceabilityPartner={undefined}
          />
          <SimpleBottomSheet
            ref={bottomSheetModalRef}
            snapPoints={snapPoints}
            closeSheet={closeModal}>
            <BottomSheetView style={styles.modalContainer}>
              <Text size="xl" weight="bold">
                Add Address Note
              </Text>
              <TextInput
                value={addressNote}
                style={styles.addressNoteInput}
                placeholder="if you like to provide further instructions please let us know."
                placeholderTextColor={FBColors.placeHolderPrimary}
                onChangeText={e => setAddressNote(e)}
              />
              <Button
                variant="solid"
                style={{width: '80%', alignSelf: 'center'}}
                onPress={() => {
                  setAddressNote(addressNote);
                  closeModal();
                }}>
                Add Note
              </Button>
            </BottomSheetView>
          </SimpleBottomSheet>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  body: {
    flex: 1,
    width: '100%',
    position: 'relative',
    ...headerTransparentContainer,
  },
  modalContainer: {
    flexDirection: 'column',
    backgroundColor: 'white',
    paddingVertical: '10@ms',
    paddingHorizontal: '20@ms',
  },
  addressNoteInput: {
    height: '180@vs',
    backgroundColor: FBColorPalette.input,
    borderRadius: '20@ms',
    borderColor: FBColorPalette.inputBorder,
    borderWidth: 1,
    marginVertical: '15@ms',
    textAlignVertical: 'top',
    padding: '15@ms',
  },
});

export default AddShippingAddress;
