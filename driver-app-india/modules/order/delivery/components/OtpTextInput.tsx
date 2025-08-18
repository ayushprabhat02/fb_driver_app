import {Button, Divider, Text, TextButton} from '@/components';
import {deliveryStore, orderStore} from '@/globalStore';
import {FBBorders, FBColors, FBBackground} from '@/types/styles';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import React, {useState, useRef, useEffect} from 'react';
import {View, TextInput, StyleSheet, Alert, Platform} from 'react-native';

interface OtpInputProps {
  onSuccess: (otp: string) => void;
  onTimeUp: () => void; // new prop
}

const OtpTextInput: React.FC<OtpInputProps> = ({onSuccess, onTimeUp}) => {
  const navigation = useNavigation();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const placeOrderOtp = orderStore.use.placeOrderOtp();
  const loaders = orderStore.use.loaders();
  const [timer, setTimer] = useState<number>(300); // ⏱ 5-minute countdown
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  const bottomSheetRefOtp = orderStore.use.bottomSheetRefOtp();

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the full 6-digit OTP');
      return;
    }
    onSuccess(finalOtp);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      onTimeUp(); // 👈 call onTimeUp when timer hits 0
    }

    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const onRefresh = React.useCallback(() => {
    resetDeliveryStore();

    // setTimeout(() => {
    //   setRefreshing(false);
    // }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearOtpInput = () => {
    setOtp(['', '', '', '', '', '']);
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
            Enter the OTP to confirm order
          </Text>
          {/* <Divider /> */}
          {/* <Text size="sm" color="complementary">
            Enter the OTP to confirm your order
          </Text> */}
          <Divider />
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text
              onPress={() => {
                // close the otp bottom sheet
                // bottomSheetRefOtp?.current?.close();
                Alert.alert(
                  'Are you sure you want to return to the home screen?',
                  '',
                  [
                    {
                      text: 'Yes',
                      onPress: () => {
                        bottomSheetRefOtp?.current?.close();
                        navigation.navigate('home-tab');
                        onRefresh();
                      },
                    },
                    {
                      text: 'No',
                      style: 'cancel',
                    },
                  ],
                  {cancelable: false},
                );
              }}
              size="sm"
              color="complementary"
              weight="bold"
              style={{marginBottom: 0, textAlign: 'center'}}>
              Go Home
            </Text>
            <Text
              size="sm"
              color="complementary"
              weight="bold"
              style={{marginBottom: 0, textAlign: 'center'}}>
              OTP expires in {formatTime(timer)}
            </Text>
          </View>
        </View>
      </View>

      <View style={{padding: 20}}>
        {/* Timer shown here */}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text color="darkGray" size="sx" style={{paddingBottom: 20}}>
            Please enter 6 digit OTP to continue
          </Text>
          <TextButton
            onPress={clearOtpInput}
            underline
            textSize="sm"
            weight="400"
            style={{marginTop: -20}}>
            Clear
          </TextButton>
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
          loading={loaders.verifyPlacedOrderOtp}
          variant="solid"
          onPress={handleSubmit}
          style={{width: '70%', alignSelf: 'center'}}>
          <Text color="white" weight="600">
            Confirm Order
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
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    marginHorizontal: 5,
    color: 'black',
  },
});

export default OtpTextInput;
