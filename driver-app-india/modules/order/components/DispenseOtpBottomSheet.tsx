import {Button, Divider, Text} from '@/components';
import {orderStore} from '@/globalStore';
import {FBBorders} from '@/types/styles';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import React, {useState, useRef} from 'react';
import {View, StyleSheet, Alert} from 'react-native';

interface DispenseOtpBottomSheetProps {
  onVerifySuccess: (otp: string) => void;
}

const DispenseOtpBottomSheet: React.FC<DispenseOtpBottomSheetProps> = ({
  onVerifySuccess,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const inputsRef = useRef<any[]>([]);
  const loaders = orderStore.use.loaders();

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index] !== '') {
        // If current field has value, clear it
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // If current field is empty, move to previous field and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the full 4-digit OTP');
      return;
    }
    onVerifySuccess(finalOtp);
  };

  const clearOtpInput = () => {
    setOtp(['', '', '', '']);
    inputsRef.current[0]?.focus();
  };

  return (
    <>
      <View style={{paddingHorizontal: 8, paddingTop: 16}}>
        <View
          style={{
            paddingHorizontal: 13,
            borderBottomWidth: 1,
            borderBottomColor: FBBorders.secondary,
            paddingBottom: 16,
          }}>
          <Text size="lg" weight="600">
            Verify OTP
          </Text>
          <Divider height={8} />
          <Text size="sm" color="complementary">
            Enter the OTP for this orde
          </Text>
        </View>
      </View>

      <View style={{padding: 20}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text color="darkGray" size="sm" style={{paddingBottom: 20}}>
            Please enter 4 digit OTP to continue
          </Text>
          <Text
            onPress={clearOtpInput}
            color="primary"
            size="sm"
            weight="600"
            style={{marginTop: -20, textDecorationLine: 'underline'}}>
            Clear
          </Text>
        </View>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <BottomSheetTextInput
              key={index}
              ref={ref => (inputsRef.current[index] = ref)}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
            />
          ))}
        </View>
        <Button
          loading={loaders.verifyDispenseOtp}
          variant="solid"
          onPress={handleSubmit}
          style={{width: '70%', alignSelf: 'center'}}>
          <Text color="white" weight="600">
            Verify
          </Text>
        </Button>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  input: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
    color: 'black',
  },
});

export default DispenseOtpBottomSheet;
