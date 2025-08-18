import React, {useMemo} from 'react';
import {formatAmountInternational} from '@/utils/general';
import {deliveryStore, walletStore} from '@/globalStore';
import {PaymentMethods} from '../../types';
import PaymentOption from './PaymentOption';

interface PaymentOptionItem {
  value: PaymentMethods;
  title: string;
  description: string;
}

const PaymentOptionList: React.FC = () => {
  const currentWallet = walletStore.use.currentWallet();
  const selectedShippingAddress = deliveryStore.use.selectedShippingAddress();
  const selectedPaymentMethod = deliveryStore.use.selectedPaymentMethod();
  const isPostpaid = deliveryStore.use.isPostpaid();
  const paymentCards = walletStore.use.paymentCards();

  // if (paymentCards?.length) {
  //   paymentCards.forEach((obj: any) => {
  //     Object.keys(obj).forEach(key => {
  //       if (obj[key] === 1) {
  //         const formattedKey = key.replace(/_/g, ' ');
  //         arr.push({
  //           title: formattedKey,
  //           value: key,
  //           description: `Pay using ${formattedKey}`,
  //         });
  //       }
  //     });
  //   });
  //   setCardsToShow(arr);
  // }

  const paymentOptionsArray: PaymentOptionItem[] = useMemo(() => {
    // only show the postpaid payment method if the user is postpaid
    let paymentMethods: PaymentOptionItem[] = [];

    if (isPostpaid) {
      return (paymentMethods = (
        selectedShippingAddress?.organization_address_payment_methods ?? []
      ).map(method => ({
        value: method.customer_payment_method?.value as PaymentMethods,
        title: method.customer_payment_method?.name ?? 'Postpaid',
        description: 'Postpaid payment method',
      })));
      // show regular payment options
    } else {
      paymentMethods = [
        {
          value: 'fb-wallet',
          title: `FB Wallet (${formatAmountInternational(
            currentWallet?.available_balance ?? 0,
          )})`,
          description: 'Pay with wallet',
        },
        {
          value: 'online',
          title: 'Pay Online',
          description: 'We accept all major credit cards.',
        },
      ];
      if (paymentCards?.length) {
        paymentCards.forEach((obj: any) => {
          Object.keys(obj).forEach(key => {
            if (obj[key] === 1 && key !== 'axis_cobranded_card') {
              const formattedKey = key.replace(/_/g, ' ');
              paymentMethods.push({
                title: formattedKey.toUpperCase(),
                value: key as PaymentMethods,
                description:
                  `Pay using ${formattedKey}` as PaymentOptionItem['description'],
              });
            }
          });
        });
      }
    }

    return paymentMethods;
  }, [
    currentWallet?.available_balance,
    isPostpaid,
    paymentCards,
    selectedShippingAddress?.organization_address_payment_methods,
  ]);

  const handlePaymentChange = (value: PaymentMethods) =>
    deliveryStore.setState(state => ({
      ...state,
      selectedPaymentMethod: value,
    }));

  return (
    <>
      {paymentOptionsArray.map(paymentOption => (
        <PaymentOption
          key={paymentOption.value}
          title={paymentOption.title}
          onPress={() => handlePaymentChange(paymentOption.value)}
          isSelected={selectedPaymentMethod === paymentOption.value}
          description={paymentOption.description}
        />
      ))}
    </>
  );
};

export default PaymentOptionList;
