import {StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';

// components
import {Text, Divider} from '@/components';

// store
import {locationStore} from '@/globalStore';

// types and styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

const PostalCode: React.FC = () => {
  const addressComponents = locationStore.use.addressComponents();

  const [activePostalCode, setActivePostalCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const postalCode = locationStore.use.postalCode();
  const regex = /^[1-9][0-9]{5}$/;

  const onChangeText = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');

    let errorMessage = '';
    if (numericText.length > 6) {
      errorMessage = 'Postal code cannot exceed 6 digits';
    } else if (numericText.length > 0 && numericText.length < 6) {
      errorMessage = 'Postal code must be exactly 6 digits';
    } else if (numericText.length === 6 && !regex.test(numericText)) {
      errorMessage = 'Invalid postal code';
    }
    setError(errorMessage);

    locationStore.setState(state => ({
      ...state,
      postalCode: numericText,
    }));
  };

  useEffect(() => {
    setActivePostalCode(addressComponents?.pinCode || '');
  }, [addressComponents]);

  return (
    <View>
      <Text size="sm" color="steelBlue" weight="600">
        Postal Code
        <Text color="error" weight="600" size="sm">
          *
        </Text>
      </Text>
      <Divider />
      <BottomSheetTextInput
        editable={!activePostalCode}
        placeholder="Enter Postal Code"
        placeholderTextColor={FBColors.placeHolderPrimary}
        maxLength={6}
        keyboardType="numeric" // Enforce numeric keyboard
        style={[
          styles.textInput,
          {
            color: activePostalCode
              ? FBColors.disabledInputText
              : FBColors.neutral,
          },
        ]}
        value={postalCode}
        onChangeText={onChangeText}
      />
      {error ? (
        <View style={styles.errorContainer}>
          <Text color="error" size="xs">
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default PostalCode;

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
  errorContainer: {
    paddingLeft: 4,
    paddingTop: 4,
  },
});
