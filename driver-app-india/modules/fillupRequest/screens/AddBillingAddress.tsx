//dependencies
import React from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
// conmponents
import {BillingAddressForm} from '@/modules/fillupRequest/components';

//imports
import {FBColorPalette} from '@/types/styles';
import {headerTransparentContainer} from '@/styles';

const AddBillingAddress = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <ScrollView style={styles.body}>
        <BillingAddressForm
          onPress={() => {
            navigation.navigate('my-address');
          }}
        />
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

export default AddBillingAddress;
