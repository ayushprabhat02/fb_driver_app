// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';

// components
import {Divider, Text} from '@/components';

// store
import {locationStore} from '@/globalStore';

// types and styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

const AddressLine: React.FC = () => {
  const addressLine = locationStore.use.addressLine();

  const onChangeText = (text: string) => {
    locationStore.setState(state => ({
      ...state,
      addressLine: text,
    }));
  };

  return (
    <View>
      <Text size="sm" color="steelBlue" weight="600">
        Address Line
        <Text color="error" weight="600" size="sm">
          *
        </Text>
      </Text>
      <Divider />
      <BottomSheetTextInput
        placeholder="Enter plot/building address"
        placeholderTextColor={FBColors.placeHolderPrimary}
        textAlignVertical="top"
        multiline={true}
        numberOfLines={2}
        maxLength={129}
        style={[
          styles.textInput,
          {
            height: 60,
            justifyContent: 'flex-start',
            paddingTop: 4,
            alignItems: 'flex-start',
            // backgroundColor: 'red',
          },
        ]}
        value={addressLine}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default AddressLine;

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    height: 36,
    backgroundColor: FBBackground.input,
    borderRadius: 6,
    paddingVertical: 0,
    paddingLeft: 10,
    color: FBColors.steelBlue,
  },
});
