// depdenencies
import {SafeAreaView, View, StyleSheet, ActivityIndicator} from 'react-native';
import React, {useState, useEffect} from 'react';
// import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import Modal from 'react-native-modal';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import Clipboard from '@react-native-clipboard/clipboard';
import analytics from '@react-native-firebase/analytics';

// components
import {Button, Divider, Text, TextButton} from '@/components';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

// services
import {sendOTP, verifyOTP} from '../services';

// store
import authStore from '../store';

const VerifyOTP: React.FC = () => {
  const loader = authStore.use.loaders();
  const stopLoader = authStore.use.stopLoader();
  const startLoader = authStore.use.startLoader();
  const phone = authStore.use.phone();

  const [otp, setOtp] = useState('');
  // const [confirmationResult, setConfirmationResult] =
  //   useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(300);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  // Calculate minutes and seconds from resendTimer
  const minutes = Math.floor(resendTimer / 60);
  const seconds = resendTimer % 60;

  // Format the time as 'm:ss' with zero-padding for consistent display
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const handleOTPclick = () => {
    if (isResendEnabled) {
      sendOneTimePassword(true);
    } else {
      sendOneTimePassword(false);
    }
  };
  const sendOneTimePassword = async (forceResend = false) => {
    startLoader('auth');

    sendOTP(phone, forceResend)
      .then(result => {
        // setConfirmationResult(result);
        setResendTimer(300);
        setIsResendEnabled(false);
      })
      .catch(error => {
        console.error('error sending OTP', error);
      })
      .finally(async () => {
        stopLoader('auth');
      });
  };

  const onChangeText = (code: string) => {
    setOtp(code);
  };

  const handleOTPVerify = async () => {
    startLoader('auth');
    await verifyOTP(
      // confirmationResult as FirebaseAuthTypes.ConfirmationResult,
      otp,
      () => {
        // Clear the clipboard after OTP submission
        Clipboard.setString('');
        stopLoader('auth');
      },
    );
    await analytics().logLogin({
      method: 'google',
    });
    await logVerifyOTPEvent();
  };

  useEffect(() => {
    if (phone && resendTimer === 300) {
      sendOneTimePassword(true);
    }
    return () => {
      setOtp('');
      Clipboard.setString('');
      setIsResendEnabled(false);
      setResendTimer(300);
      // setConfirmationResult(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (resendTimer > 0) {
        setResendTimer(resendTimer - 1);
      } else {
        setIsResendEnabled(true);
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [resendTimer]);

  // Log analytics event
  const logVerifyOTPEvent = async () => {
    try {
      await analytics().logEvent('Verify_Otp', {
        phone: phone,
        status: true,
        resend_attempts: Math.floor((300 - resendTimer) / 300), // Calculate resend attempts
      });
      console.log('Verify OTP analytics event logged.');
    } catch (error) {
      console.error('Error logging verify_otp event:', error);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={styles.container}>
        <Divider height={60} />
        <View style={styles.form}>
          <View style={{alignItems: 'center'}}>
            <Text size="sm" style={{textAlign: 'center'}} weight="400">
              Enter the 6 digit OTP sent to
            </Text>
            <Divider />
            <Text weight="600" size="base">
              {phone}
            </Text>
          </View>
          <View>
            <OTPInputView
              style={{width: '100%', height: 120}}
              pinCount={6}
              autoFocusOnLoad={false}
              code={otp}
              codeInputFieldStyle={styles.codeInputFieldStyle}
              keyboardType="number-pad"
              onCodeChanged={onChangeText}
            />
          </View>

          <View style={{alignItems: 'center'}}>
            <Text size="sm">Didn’t get the OTP?</Text>
            <Divider />
            <TextButton
              onPress={handleOTPclick}
              textColor={isResendEnabled ? 'primary' : 'darkGray'}
              textSize="sm"
              underline={isResendEnabled}
              disabled={!isResendEnabled}>
              {isResendEnabled ? 'Resend OTP' : `Resend in ${formattedTime}s`}
            </TextButton>
          </View>
          <Divider height={20} />
          <Button
            variant="solid"
            onPress={handleOTPVerify}
            disabled={otp.length < 6}>
            Verify OTP
          </Button>
        </View>
      </View>
      <Modal
        isVisible={loader.auth}
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={0}
        backdropOpacity={0.8}
        animationIn="fadeIn"
        animationOut="slideOutDown">
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: FBBackground.white,
              borderRadius: 8,
              height: 90,
              width: 350,
              columnGap: 12,
            }}>
            <Text size="lg">Please Wait</Text>
            <ActivityIndicator />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  codeInputFieldStyle: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    borderRadius: 8,
    color: FBColors.neutral,
    backgroundColor: FBBackground.input,
    fontWeight: '600',
    fontSize: 24,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  container: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  form: {
    width: '100%',
  },
});

export default VerifyOTP;
