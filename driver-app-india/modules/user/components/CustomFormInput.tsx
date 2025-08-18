// dependencies
import React from 'react';
import {View, TextInput} from 'react-native';
import {Controller} from 'react-hook-form';
import {ms, ScaledSheet} from 'react-native-size-matters';

// components
import {Text} from '@/components';

// types
import {FBBorders, FBColorPalette, FBColors} from '@/types/styles';

type Props = {
  name: string;
  label: string;
  control: any;
  errors: any;
  placeholder: string;
  required?: boolean;
  textInputStyle?: any;
  inputContainerStyle?: any;
  editable?: boolean;
  keyboardType?: any;
  maxLength?: number;
};
const CustomBottomFormInput: React.FC<Props> = ({
  name,
  label,
  control,
  errors,
  placeholder,
  required,
  textInputStyle,
  inputContainerStyle,
  editable = true,
  keyboardType = 'default',
  maxLength = 129,
}) => {
  const styles = ScaledSheet.create({
    inputContainer: {
      ...inputContainerStyle,
      position: 'relative',
      zIndex: 1,
    },

    textInput: {
      backgroundColor: FBColorPalette.input,
      color: editable ? FBColors.neutral : FBColorPalette.disabledInputText,
      borderWidth: 1,
      borderColor: FBBorders.input, // Replace with the image border color
      borderRadius: '8@ms', // Adjust if corners are rounded
      padding: '10@ms',
      height: 40,
      ...textInputStyle,
    },
    errorText: {
      color: 'red',
      marginVertical: '10@ms',
    },
  });

  return (
    <View style={styles.inputContainer}>
      <View style={{flexDirection: 'row'}}>
        <Text
          style={{marginBottom: ms(5)}}
          weight="500"
          color="steelBlue"
          lines={1}
          size="sm">
          {label}
        </Text>
        {required && <Text style={{color: 'red', marginLeft: ms(2)}}>*</Text>}
      </View>
      <Controller
        control={control}
        name={name}
        render={({field: {onChange, value, onBlur}}) => (
          <TextInput
            maxLength={maxLength}
            keyboardType={keyboardType}
            style={styles.textInput}
            onChangeText={onChange}
            autoCapitalize={name === 'pan' ? 'characters' : 'none'}
            onBlur={onBlur}
            value={value}
            autoCorrect={false}
            placeholder={placeholder}
            editable={editable}
            placeholderTextColor={FBColors.placeHolderPrimary}
          />
        )}
      />
      {errors[name] && (
        <Text size="xs" style={styles.errorText as any}>
          {errors[name].message}
        </Text>
      )}
    </View>
  );
};

export default CustomBottomFormInput;
