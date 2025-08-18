import React, {useCallback, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {ShoppingCart} from 'phosphor-react-native';

// components
import {Divider, Text} from '@/components';

// store
import {deliveryStore, walletStore, businessStore} from '@/globalStore';

// services
import {DeliveryService, WalletService} from '@/services';
import {formatAmountInternational} from '@/utils/general';

// types
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {PaymentMethods} from '../../types';
import {FetchAddressByNameQuery} from '@/generated/graphql';
import {useFocusEffect} from '@react-navigation/native';

type Props = {
  openBottomSheet: () => void;
};

const CheckoutOrderSummary: React.FC<Props> = ({openBottomSheet}) => {
  const selectedProducts = deliveryStore.use.selectedDeliveryProducts();
  const shippingAddress = deliveryStore.use.selectedShippingAddress();
  const billingAddress = deliveryStore.use.selectedBillingAddress();
  const selectedProduct = deliveryStore.use.selectedDeliveryProducts();
  const selectedSlot = deliveryStore.use.selectedSlot();
  const deliveryFee = deliveryStore.use.deliveryFee();
  const grandTotal = deliveryStore.use.totalAmount();
  const isPostpaid = deliveryStore.use.isPostpaid();
  const currentWallet = walletStore.use.currentWallet();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();

  const startLoader = deliveryStore.use.startLoader();
  const stopLoader = deliveryStore.use.stopLoader();

  useEffect(() => {
    WalletService.getUserWallet({
      organization_user_id: activeDeliveryOrgUser?.id,
    });
    const postpaidAllowed = DeliveryService.isPostPaidAllowed(
      shippingAddress as FetchAddressByNameQuery['organization_address'][0],
      activeDeliveryOrgUser?.organization?.is_credit_available,
    );
    deliveryStore.setState(state => ({
      ...state,
      isPostpaid: postpaidAllowed,
      selectedPaymentMethod: isPostpaid
        ? (shippingAddress?.organization_address_payment_methods?.[0]
            ?.customer_payment_method?.value as PaymentMethods)
        : ('fb-wallet' as PaymentMethods),
    }));
  }, [shippingAddress, activeDeliveryOrgUser, isPostpaid]);

  useFocusEffect(
    useCallback(() => {
      if (billingAddress && currentWallet?.currency_id) {
        startLoader('fetchDeliveryFee');
        DeliveryService.fetchDeliveryFee({
          object: {
            organization_user_id: activeDeliveryOrgUser?.id,
            product_variation_id: selectedProduct[0]?.product?.variation_id,
            qty: `${selectedProduct[0]?.product?.qty}`,
            shipping_address_id: shippingAddress?.id,
            billing_address_state_id: billingAddress?.state?.id,
            express_delivery_fees: selectedSlot?.expressDelivery
              ? `${selectedSlot?.expressDelivery}`
              : '0',
          },
        }).then(res => {
          /**
           * After fetching the delivery fee, we need to calculate the total amount
           * we store the total amount in delivery store
           */
          const amount =
            selectedProducts[0].product?.qty *
            selectedProducts[0].product?.salePrice;

          let totalAmount = amount + parseFloat(res.total_amount as string);

          if (res.discount) {
            totalAmount = totalAmount - parseFloat(res.discount);
          }

          deliveryStore.setState(state => ({
            ...state,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
          }));

          WalletService.checkWalletAmountExist({
            object: {
              amount: totalAmount.toString(),
              currency_id: currentWallet?.currency_id,
              organization_user_id: activeDeliveryOrgUser?.id,
              shipping_address_id: shippingAddress?.id,
            },
          })
            .then(response => {
              // console.log('isPostpaid', isPostpaid);
              // console.log(
              //   'response.checkWalletAmountExits?.is_invoice_pending',
              //   response.checkWalletAmountExits?.is_invoice_pending,
              // );

              // console.log(
              //   'response?.checkWalletAmountExits?.is_amount_available',
              //   response?.checkWalletAmountExits?.is_amount_available,
              // );

              if (
                isPostpaid &&
                response.checkWalletAmountExits?.is_invoice_pending &&
                !response?.checkWalletAmountExits?.is_amount_available
              ) {
                openBottomSheet();
              }

              if (
                response.checkWalletAmountExits?.is_invoice_pending &&
                currentWallet?.is_credit_available
              ) {
                openBottomSheet();
              }
            })
            .finally(() => {
              stopLoader('fetchDeliveryFee');
            });
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billingAddress, currentWallet]),
  );

  // common function to calculate amount
  const calculateAmount = (amount: string) => {
    // console.log('amount', amount);
    return formatAmountInternational(parseFloat(amount));
  };

  const calculateDiscount = () => {
    const totalDiscount = deliveryFee?.discount;

    return calculateAmount(`${totalDiscount}`);
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', columnGap: 10, alignItems: 'center'}}>
        <ShoppingCart size={24} />
        <Text weight="600">Order Summary</Text>
      </View>
      <Divider />

      {/* qty */}
      <View>
        <View style={styles.row}>
          <Text style={styles.label}>
            Diesel Qty{' '}
            <Text size="sm" color="steelBlue" weight="300">
              (
              {selectedProduct.map(product => {
                return formatAmountInternational(product.product.salePrice);
              })}
              / ltr)
            </Text>
          </Text>

          <Text style={styles.amount}>
            {selectedProduct.map(product => {
              return product.product.qty;
            })}{' '}
            ltr
          </Text>
        </View>

        {grandTotal ? (
          <>
            {/* subtotal */}
            <View style={styles.row}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.amount}>
                {calculateAmount(
                  `${
                    selectedProducts[0].product?.qty *
                    selectedProducts[0].product?.salePrice
                  }`,
                )}
              </Text>
            </View>

            {/* delivery fee */}
            <View style={styles.row}>
              <Text style={styles.label}>Delivery Fee</Text>
              <Text style={styles.amount}>
                {calculateAmount(deliveryFee?.delivery_fees as string)}
              </Text>
            </View>

            {/* taxes */}
            <View style={[styles.row]}>
              <Text style={styles.label}>Taxes (on delivery fees)</Text>
              <Text style={styles.amount}>
                {calculateAmount(deliveryFee?.tax_amount as string)}
              </Text>
            </View>

            {/* taxes */}
            <View style={[styles.row]}>
              <Text style={styles.label}>Total Delivery Fee</Text>
              <Text style={styles.amount}>
                {calculateAmount(
                  `${
                    parseFloat(deliveryFee?.delivery_fees as string) +
                    parseFloat(deliveryFee?.tax_amount as string)
                  }`,
                )}
              </Text>
            </View>

            {/* discount */}
            {deliveryFee?.discount ? (
              <View style={[styles.row, styles.borderBottom]}>
                <Text style={styles.label}>Discount</Text>
                <Text style={styles.amount}>- {calculateDiscount()}</Text>
              </View>
            ) : null}

            {/* total amount */}
            <View style={styles.row}>
              <Text weight="700" style={{fontSize: 16}}>
                Total Amount
              </Text>
              <Text style={styles.grandTotal}>
                {calculateAmount(`${grandTotal}`)}
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: FBBackground.softBlue,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: FBColors.steelBlue,
  },

  amount: {
    fontSize: 14,
    fontWeight: '500',
  },

  promoAmount: {
    fontSize: 14,
    color: FBColors.primary,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  borderBottom: {
    paddingBottom: 10,
    borderBottomColor: FBBorders.primary,
    borderBottomWidth: 1,
  },
  modalContent: {
    backgroundColor: FBBackground.white,
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: FBBorders.primary,
  },
});

export default CheckoutOrderSummary;
