// dependencies
import React, {useEffect, useState} from 'react';
import {Alert, View} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';

// components
import {Button, Divider, Text} from '@/components';
import PaymentOption from '@/modules/delivery/components/checkout/PaymentOption';

// actions
import {formatAmountInternational} from '@/utils/general';
import {WalletService} from '@/services';

// store
import walletStore from '../store';

// styles & types
import {FBColors} from '@/types/styles';
import {FetchSingleUserWalletQuery} from '@/generated/graphql';
import {commonInputStyles} from '@/styles';
import {businessStore} from '@/globalStore';
import PaymentHelper from '@/modules/delivery/components/axis/PaymentHelper';

interface WalletInputProps {
  currentWallet: FetchSingleUserWalletQuery['checkWalletBalance'];
  onClose: () => void;
  receivedAmount?: string;
  callback?: () => void;
}

interface CardToShow {
  title: string;
  value: string;
  description: string;
}

const WalletInput: React.FC<WalletInputProps> = ({
  currentWallet,
  onClose,
  receivedAmount,
  callback,
}) => {
  const navigation = useNavigation();

  const paymentCards = walletStore.use.paymentCards();

  const [amount, setAmount] = useState<string>(receivedAmount || '');
  const [cardsToShow, setCardsToShow] = useState<CardToShow[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('default');
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const [processing, setProcessing] = useState<boolean>(false); // Add processing state

  const loaders = walletStore.use.loaders();
  const startLoader = walletStore.use.startLoader();
  const stopLoader = walletStore.use.stopLoader();

  const isPaymentDisabled = () => {
    if (receivedAmount) {
      if (parseFloat(amount) < parseFloat(receivedAmount)) {
        return true;
      }
    } else {
      return !amount || parseInt(amount, 10) <= 0;
    }
  };

  const handlePayment = () => {
    if (parseInt(amount, 10) <= 0) {
      return;
    }

    if (currentWallet?.wallet_id && amount) {
      // as we click on add money button, initiate payment and close the add money modal
      startLoader('initiatePayment');

      switch (selectedCard) {
        case 'default':
          WalletService.initiatePayment({
            activeDeliveryOrgUser: activeDeliveryOrgUser,
            amount: amount,
            walletId: currentWallet.wallet_id,
            selectedInvoiceCodes: [],
          })
            .then(() => {
              if (callback) {
                callback();
              }
            })
            .finally(() => {
              onClose();
              setTimeout(() => {
                stopLoader('initiatePayment');
              }, 800);
            });
          break;

        case 'icici_cobranded_card':
          walletStore.setState(state => ({
            ...state,
            iciciAmount: amount,
          }));
          WalletService.initiateIciciCobrandedCardPayment({
            object: {
              amount: parseFloat(amount),
              wallet_id: currentWallet.wallet_id,
              failure_callback_url: 'https://app.fuelbuddy.in/icici-failure',
              success_callback_url: 'https://app.fuelbuddy.in/icici-success',
            },
          })
            .then(() => {
              navigation.navigate('wallet', {screen: 'icici-payments'});
            })
            .finally(() => {
              onClose();
              setTimeout(() => {
                stopLoader('initiatePayment');
              }, 800);
            });
          break;

        case 'axis_cobranded_card':
          if (processing) return; // Prevent multiple clicks
          setProcessing(true); // Set processing to true
          // if (parseFloat(amount) < 500) {
          //   Alert.alert(
          //     'Minimum transaction amount for Axis Co-branded Card is ₹500',
          //   );
          //   stopLoader('initiatePayment');
          //   return; // Prevent further execution if the amount is less than 500
          // }
          walletStore.setState(state => ({
            ...state,
            axisAmount: amount,
          }));
          WalletService.initiateAxisCobrandedCardPayment({
            object: {
              amount: parseFloat(amount),
              wallet_id: currentWallet?.wallet_id,
              failure_callback_url: 'https://app.fuelbuddy.in/axis-failure',
              success_callback_url: 'https://app.fuelbuddy.in/axis-success',
            },
          })
            .then(walletResponse => {
              const merchantDetails = {
                merchantId: walletResponse?.axisBankPayment?.transaction_id,
                custEmailId: walletResponse?.axisBankPayment?.email || '',
                custMobileNumber:
                  walletResponse?.axisBankPayment?.phone_number?.replace(
                    '+91',
                    '',
                  ) || '',
                amount: amount || '',
              };

              const callbackReturnUrl = walletResponse?.axisBankPayment
                ?.call_back_url as string;
              const atomTokenId =
                walletResponse?.axisBankPayment?.atom_token_id;

              if (atomTokenId) {
                stopLoader('initiatePayment');
                setProcessing(false);
                initNDPSTransaction(
                  atomTokenId,
                  merchantDetails,
                  callbackReturnUrl,
                );
              }
            })
            .finally(() => {
              onClose();
              setTimeout(() => {
                stopLoader('initiatePayment');
                setProcessing(false); // Reset processing state
              }, 800);
            });

          const initNDPSTransaction = async (
            atomTokenId: string,
            merchantDetails: any,
            callbackReturnUrl: string,
          ) => {
            try {
              const ndps = new PaymentHelper();
              const aipayContent = ndps.openAipayPopUp(
                atomTokenId,
                merchantDetails,
                callbackReturnUrl,
              );
              navigation.navigate('wallet', {
                screen: 'axis-payments',
                params: {
                  htmlPage: aipayContent,
                  merchantDetails: merchantDetails,
                },
              });
            } catch (e) {
              console.error('Error in transaction:', e);
              setProcessing(false);
            }
          };

          break;

        default:
          setProcessing(false); // Reset processing state for unsupported cases
          break;
      }
    }
  };

  useEffect(() => {
    const arr: CardToShow[] = [
      {
        title: 'Easebuzz',
        value: 'default',
        description: '',
      },
    ];

    if (paymentCards?.length) {
      paymentCards.forEach((obj: any) => {
        Object.keys(obj).forEach(key => {
          if (obj[key] === 1 && key !== 'axis_cobranded_card') {
            const formattedKey = key.replace(/_/g, ' ');
            arr.push({
              title: formattedKey,
              value: key,
              description: `Pay using ${formattedKey}`,
            });
          }
        });
      });
      setCardsToShow(arr);
    }
  }, [paymentCards]);

  return (
    <>
      <Text size="lg" weight="600">
        Add money
      </Text>
      <Divider height={10} />
      <BottomSheetTextInput
        placeholder="Enter wallet recharge amount"
        placeholderTextColor={FBColors.placeHolderPrimary}
        keyboardType="numeric"
        style={[commonInputStyles, {height: 40}]}
        onChangeText={text => {
          setAmount(text);
        }}
        value={amount}
      />
      <Divider height={20} />
      <View>
        {cardsToShow.length > 1
          ? cardsToShow.map(card => (
              <PaymentOption
                key={card.value}
                title={card.title.toUpperCase()}
                description={card.description}
                isSelected={selectedCard === card.value}
                onPress={() => {
                  setSelectedCard(card.value);
                }}
              />
            ))
          : null}
      </View>

      <Divider height={40} />

      <Button
        variant="solid"
        onPress={handlePayment}
        disabled={isPaymentDisabled()}
        loading={loaders.initiatePayment || processing}>
        {parseInt(amount, 10) <= 0
          ? 'Amount should be more than 0'
          : parseInt(amount, 10) > 0
          ? `Add ${formatAmountInternational(parseFloat(amount))}`
          : 'Enter Amount'}
      </Button>
    </>
  );
};

export default WalletInput;
