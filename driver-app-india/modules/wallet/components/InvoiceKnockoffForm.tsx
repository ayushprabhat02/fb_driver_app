// dependencies
import React, {useEffect, useState} from 'react';
import {Alert, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

// components
import {Button, Divider, Text} from '@/components';
import PaymentOption from '@/modules/delivery/components/checkout/PaymentOption';

// actions
import {formatAmountInternational} from '@/utils/general';

// store
import walletStore from '../store';

// styles & types
import {FetchSingleUserWalletQuery} from '@/generated/graphql';
import {commonInputStyles} from '@/styles';
import {businessStore} from '@/globalStore';
import {WalletService} from '@/services';
import PaymentHelper from '@/modules/delivery/components/axis/PaymentHelper';
const selectedInvoiceCodes = walletStore.use.selectedInvoiceCodes();

interface InvoiceKnockoffFormProps {
  currentWallet: FetchSingleUserWalletQuery['checkWalletBalance'];
  onClose: () => void;
  receivedAmount: number;
  callback?: () => void;
}

interface CardToShow {
  title: string;
  value: string;
  description: string;
}

const InvoiceKnockoffForm: React.FC<InvoiceKnockoffFormProps> = ({
  currentWallet,
  onClose,
  receivedAmount,
  callback,
}) => {
  const navigation = useNavigation();

  const paymentCards = walletStore.use.paymentCards();

  const [cardsToShow, setCardsToShow] = useState<CardToShow[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('default');
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const [processing, setProcessing] = useState<boolean>(false);

  const loaders = walletStore.use.loaders();
  const startLoader = walletStore.use.startLoader();
  const stopLoader = walletStore.use.stopLoader();

  const handlePayment = () => {
    if (currentWallet?.wallet_id && receivedAmount) {
      // as we click on add money button, initiate payment and close the add money modal
      startLoader('initiatePayment');
      switch (selectedCard) {
        case 'default':
          WalletService.initiatePayment({
            activeDeliveryOrgUser: activeDeliveryOrgUser,
            amount: `${receivedAmount}`,
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
            iciciAmount: receivedAmount.toFixed(2),
            knockoffAmount: receivedAmount.toFixed(2),
          }));

          WalletService.initiateIciciCobrandedCardPayment({
            object: {
              amount: receivedAmount,
              wallet_id: currentWallet.wallet_id,
              failure_callback_url: 'https://app.fuelbuddy.in/icici-failure',
              success_callback_url: 'https://app.fuelbuddy.in/icici-success',
            },
          })
            .then(() => {
              navigation.navigate('wallet', {
                screen: 'icici-payments-knockoff',
              });
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
          // if (receivedAmount < 500) {
          //   stopLoader('initiatePayment');
          //   Alert.alert('The minimum amount for Axis payments is 500.');
          //   return;
          // }
          let merchantDetails: {
            merchantId: string | null | undefined;
            custEmailId: string;
            custMobileNumber: string;
            amount: any;
          }; // Declare merchantDetails in the parent scope
          let callbackReturnUrl: any;
          // Set Axis Payment Data in State
          walletStore.setState(state => ({
            ...state,
            axisAmount: receivedAmount.toFixed(2),
            axisKnockoffAmount: receivedAmount.toFixed(2),
          }));

          WalletService.initiateAxisCobrandedCardPayment({
            object: {
              amount: receivedAmount,
              wallet_id: currentWallet?.wallet_id,
              sales_invoice: selectedInvoiceCodes,
              failure_callback_url: 'https://app.fuelbuddy.in/axis-failure',
              success_callback_url: 'https://app.fuelbuddy.in/axis-success',
            },
          })
            .then(walletResponse => {
              merchantDetails = {
                merchantId: walletResponse?.axisBankPayment?.transaction_id,
                custEmailId: walletResponse?.axisBankPayment?.email || '',
                custMobileNumber:
                  walletResponse?.axisBankPayment?.phone_number?.replace(
                    '+91',
                    '',
                  ) || '',
                amount: receivedAmount || '',
              };

              callbackReturnUrl = walletResponse?.axisBankPayment
                ?.call_back_url as string;

              // console.log('Final merchantDetails:', merchantDetails);

              const atomTokenId =
                walletResponse?.axisBankPayment?.atom_token_id;
              if (atomTokenId) {
                stopLoader('initiatePayment');
                setProcessing(false); // Reset processing after successful setup
                initNDPSTransaction(atomTokenId);
              }
            })
            .finally(() => {
              onClose();
              setTimeout(() => {
                stopLoader('initiatePayment');
                setProcessing(false); // Reset processing state
              }, 800);
            });
          const initNDPSTransaction = async (atomTokenId: string) => {
            try {
              const ndps = new PaymentHelper();
              let aipayContent = ndps.openAipayPopUp(
                atomTokenId,
                merchantDetails,
                callbackReturnUrl,
              );
              navigation.navigate('wallet', {
                screen: 'axis-payments-knockoff',
                params: {
                  htmlPage: aipayContent,
                  merchantDetails: merchantDetails,
                },
              });
            } catch (e) {
              console.error('Error in transaction:', e);
              setProcessing(false); // Reset processing if the transaction fails
            }
          };

          break;
        default:
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
        Invoice Settlement
      </Text>
      <Divider height={24} />
      <View
        style={[
          commonInputStyles,
          {
            height: 40,
            justifyContent: 'center',
          },
        ]}>
        <Text size="lg" weight="600">
          {formatAmountInternational(receivedAmount)}
        </Text>
      </View>
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

      <Divider height={20} />

      <Button
        variant="solid"
        onPress={handlePayment}
        disabled={!receivedAmount || processing}
        textStyle={{fontSize: 20}}
        loading={loaders.initiatePayment}>
        Pay
      </Button>
    </>
  );
};

export default InvoiceKnockoffForm;
