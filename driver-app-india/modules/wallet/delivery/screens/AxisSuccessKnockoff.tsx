// dependencies
import {View, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';

// components
import SuccessAnimation from '@/components/SucessAnimation';
import {Divider, HeaderAvoidingContainer, Text} from '@/components';

// services
import WalletService from '../../services';
import {businessStore, walletStore} from '@/globalStore';
import Toast from 'react-native-toast-message';

const IciciSuccess: React.FC = () => {
  const navigation = useNavigation();

  //   wallet recharge details
  const walletTransactionId = walletStore.use.axisWalletTransactionId();
  const axisAmount = walletStore.use.axisAmount();

  //   knockoff details
  //   const currentWallet = walletStore.use.currentWallet();
  //   const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  //   const knockoffAmount = walletStore.use.knockoffAmount();
  const selectedInvoiceCodes = walletStore.use.selectedInvoiceCodes();

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
              selectedInvoiceCodes: [],
              axisKnockoffAmount: '',
              pageVisitCount: 0,
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
          text1: 'Invoice Knockoff Successful',
        });
      }, 2000);
    };
  }, []);

  return (
    <HeaderAvoidingContainer>
      <View style={styles.container}>
        <SuccessAnimation />
        <Text weight="bold" size="xl" color="primary">
          Invoice Knockoff Successful
        </Text>
        <Divider />
        <Text weight="bold" size="sm" color="steelBlue" appearance="light">
          You will now be redirected back to your invoices
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

export default IciciSuccess;
