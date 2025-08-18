import React from 'react';
import {View} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import {Text} from '@/components';
import {Controller} from 'react-hook-form';
import {ms, ScaledSheet} from 'react-native-size-matters';
import {CaretDown} from 'phosphor-react-native';
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';

type Props = {
  name: string;
  label: string;
  control: any;
  errors: any;
  placeholder: string;
  required?: boolean;
  inputContainerStyle?: any;
  items: any;
  setChange: (v: any) => void;
  renderObject: (i: any) => void;
  editable?: boolean;
};

const CustomSelectInput: React.FC<Props> = ({
  name,
  label,
  control,
  errors,
  placeholder,
  required,
  inputContainerStyle,
  items,
  setChange,
  renderObject,
  editable = true,
}) => {
  const styles = ScaledSheet.create({
    inputContainer: {
      marginBottom: '10@ms',
      paddingVertical: 0,
      ...inputContainerStyle,
    },
    label: {
      fontSize: '12@ms',
      fontWeight: '500',
      color: FBColors.steelBlue,
      marginBottom: '5@ms',
    },
    errorText: {
      color: 'red',
      marginVertical: '10@ms',
    },
    disabled: {
      color: FBColorPalette.disabledInputText,
    },
    iconContainer: {
      position: 'absolute',
      right: '10@ms',
      top: '50%',
      transform: [{translateY: -12}],
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: FBBorders.input,
      borderRadius: 10,
      backgroundColor: FBBackground.input,
      paddingHorizontal: 8,
      justifyContent: 'center',
      height: 40,
    },
  });

  return (
    <View style={styles.inputContainer}>
      <View style={{flexDirection: 'row'}}>
        <Text style={styles.label as any}>{label}</Text>
        {required && <Text style={{color: 'red', marginLeft: ms(2)}}>*</Text>}
      </View>
      <Controller
        name={name}
        control={control}
        render={({field: {onChange, value}}) => (
          <>
            <RNPickerSelect
              style={{
                viewContainer: styles.pickerContainer,
                inputAndroid: [
                  {color: FBColors.neutral},
                  !editable && styles.disabled,
                ],
                inputIOS: [
                  {color: FBColors.neutral},
                  !editable && styles.disabled,
                ],
                inputAndroidContainer: {
                  justifyContent: 'center',
                },
                inputIOSContainer: {
                  justifyContent: 'center',
                },
              }}
              onValueChange={v => {
                setChange(v);
                onChange(v);
              }}
              disabled={!editable}
              value={value}
              items={items.map((item: any) => renderObject(item))}
              placeholder={{
                label: `${placeholder}`,
                value: null,
                color: FBColors.placeHolderPrimary,
              }}
              Icon={() => (
                <View style={styles.iconContainer}>
                  <CaretDown size={ms(20)} color={FBColors.neutral} />
                </View>
              )}
            />
            {errors[name] && (
              <>
                {errors[name].message === 'Expected string, received null' ? (
                  <Text size="xs" style={styles.errorText as any}>
                    Required
                  </Text>
                ) : (
                  <Text size="xs" style={styles.errorText as any}>
                    {errors[name].message}
                  </Text>
                )}
              </>
            )}
          </>
        )}
      />
    </View>
  );
};

export default CustomSelectInput;
