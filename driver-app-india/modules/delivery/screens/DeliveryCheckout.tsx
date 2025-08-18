//dependenceis
import React, {useCallback, useEffect, useRef} from 'react';
// import {ScrollView} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// services
import {WalletService} from '@/services';

// store
import {businessStore, deliveryStore, orderStore} from '@/globalStore';

// components
import {
  Button,
  Divider,
  FullScreenLoader,
  HeaderAvoidingContainer,
  Text,
  TextButton,
} from '@/components';
import {FBBackground} from '@/types/styles';
import {getBusinessRole} from '@/utils/general';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {
  CheckoutDateAndTime,
  CheckoutOrderSummary,
  DeliveryDetails,
  OTPRequiredCheckBox,
  PaymentSummary,
  PurchaseOrderCode,
} from '../components/checkout';

const DeliveryCheckout: React.FC = () => {
  const navigation = useNavigation();

  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const isOwner =
    getBusinessRole(activeDeliveryOrgUser) === 'owner' ||
    getBusinessRole(activeDeliveryOrgUser) === 'individual';
  const stopLoader = deliveryStore.use.stopLoader();

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const loaders = deliveryStore.use.loaders();

  const scrollToBillingAddress = () => {
    scrollViewRef?.current?.scrollToPosition(0, 0);
  };

  const bottomSheetRefInvoices = useRef<BottomSheet>(null);
  const openBottomSheetInvoices = () => {
    bottomSheetRefInvoices.current?.expand();
  };
  const closeBottomSheetInvoices = () => {
    bottomSheetRefInvoices.current?.close();
  };

  /**
   * Effect to fetch billing addresses and user wallet
   */
  useEffect(() => {
    stopLoader('fetchCustomerAssets');

    WalletService.fetchPaymentCardsByOrgUserId({
      organization_user_id: activeDeliveryOrgUser?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      WalletService.getUserWallet({
        organization_user_id: activeDeliveryOrgUser?.id,
      }).then(() => {
        WalletService.fetchPendingInvoice({
          object: {
            organization_id: activeDeliveryOrgUser?.organization_id,
          },
        });
      });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    orderStore.setState(state => ({
      ...state,
      upcomingOrdersVerify: undefined,
    }));
  }, []);

  return (
    <HeaderAvoidingContainer paddingHorizontal={24}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 10}}>
        {/* delivery details */}
        <DeliveryDetails />

        {/* datetime details */}
        <Divider height={24} />
        <CheckoutDateAndTime />

        {/* order summary */}
        <Divider height={24} />
        <CheckoutOrderSummary openBottomSheet={openBottomSheetInvoices} />

        {/* purchase order code */}
        <Divider height={24} />
        <PurchaseOrderCode />

        {/* otp checkbox */}
        <Divider height={24} />
        <OTPRequiredCheckBox />

        {/* payment summary */}
        <Divider height={24} />
        <PaymentSummary scrollToBillingAddress={scrollToBillingAddress} />
      </KeyboardAwareScrollView>

      <FullScreenLoader
        showLoader={loaders.fetchDeliveryFee}
        loaderText="Calculating..."
      />
      <FullScreenLoader
        showLoader={loaders.paymentSuccess}
        loaderText="Payment under processing..."
      />

      <BottomSheet
        ref={bottomSheetRefInvoices}
        snapPoints={['30%']}
        index={-1}
        handleComponent={null}
        backdropComponent={BackDrop}>
        <BottomSheetView
          style={{
            flex: 1,
            backgroundColor: FBBackground.white,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}>
          {isOwner ? (
            <TextButton
              textColor="mediumGray"
              style={{position: 'absolute', top: 16, right: 16, zIndex: 1000}}
              onPress={() => {
                closeBottomSheetInvoices();
                navigation.goBack();
              }}>
              Go back
            </TextButton>
          ) : null}
          <Text size="lg" weight="600">
            Pending Overdues
          </Text>
          <Divider />
          <Text color="steelBlue" size="sm">
            {isOwner
              ? ' Please clear pending invoices before proceeding'
              : ' Please ask the organisation owner to clear pending invoices before proceeding'}
          </Text>
          {isOwner ? (
            <Button
              variant="solid"
              style={{marginTop: 20}}
              onPress={() => {
                closeBottomSheetInvoices();
                navigation.navigate('wallet', {screen: 'wallet-delivery'});
              }}>
              Go to wallet
            </Button>
          ) : (
            <Button
              variant="solid"
              style={{marginTop: 20}}
              onPress={() => {
                closeBottomSheetInvoices();
                navigation.goBack();
              }}>
              Go Back
            </Button>
          )}
        </BottomSheetView>
      </BottomSheet>
    </HeaderAvoidingContainer>
  );
};

const BackDrop: React.FC<BottomSheetBackdropProps> = props => (
  <BottomSheetBackdrop
    style={{zIndex: 100}}
    pressBehavior="none"
    appearsOnIndex={0}
    {...props}
    disappearsOnIndex={-1}
  />
);

const styles = ScaledSheet.create({
  body: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
});

export default DeliveryCheckout;
