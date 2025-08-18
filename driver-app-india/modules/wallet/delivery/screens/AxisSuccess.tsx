// dependencies
import {View, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';

// components
import SuccessAnimation from '@/components/SucessAnimation';
import {Divider, HeaderAvoidingContainer, Text} from '@/components';

// services
import WalletService from '../../services';
import {walletStore} from '@/globalStore';
import Toast from 'react-native-toast-message';

const AxisSuccess: React.FC = () => {
  const navigation = useNavigation();

  const walletTransactionId = walletStore.use.axisWalletTransactionId();
  const axisAmount = walletStore.use.axisAmount();

  useEffect(() => {
    if (walletTransactionId) {
      setTimeout(() => {
        WalletService.verifyAxisCobrandedCardPayment({
          object: {
            wallet_transaction_id: walletTransactionId,
          },
        })
          .then(() => {
            walletStore.setState(state => ({
              ...state,
              axisWalletTransactionId: '',
              axisAmount: '',
            }));
          })
          .finally(() => {
            navigation.goBack();
          });
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Wallet Topup Successful',
          text2: 'Amount added to your wallet',
        });
      }, 2000);
    };
  }, []);

  return (
    <HeaderAvoidingContainer>
      <View style={styles.container}>
        <SuccessAnimation />
        <Text weight="bold" size="xl" color="primary">
          Payment Successful!
        </Text>
        <Divider />
        <Text weight="bold" size="sm" color="steelBlue" appearance="light">
          You will now be redirected to your wallet
        </Text>
      </View>
    </HeaderAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AxisSuccess;
