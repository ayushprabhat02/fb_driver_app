// dependencies
import {View} from 'react-native';
import React, {useEffect} from 'react';

// components
import {Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';

// types
import {FBColors} from '@/types/styles';
import {
  FetchDeliveryProductsWithPricesQuery,
  Localities,
} from '@/generated/graphql';
import {TextInput} from 'react-native-gesture-handler';
import {commonInputStyles} from '@/styles';
import {
  checkForMultipleOfNumber,
  handleQuantityValidation,
} from '@/utils/general';

interface ProductInputProps {
  product: FetchDeliveryProductsWithPricesQuery['product_partner_localities_price'][0];
  scrollToPosition: () => void;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const ProductInput: React.FC<ProductInputProps> = ({
  product,
  scrollToPosition,
  error,
  setError,
}) => {
  const quantity = deliveryStore.use.quantity();
  const deliveryPartner = deliveryStore.use.deliveryPartner();

  const changeQty = (value: string) => {
    deliveryStore.setState(state => ({
      ...state,
      quantity: value,
    }));

    // setQuantity(value);
  };

  useEffect(() => {
    if (!quantity) {
      setError('');
    }
    const inputQty = parseFloat(quantity) || 0;
    const serviceableZone = deliveryPartner?.partner_localities[0]?.locality;
    const isMultipleOf20 = checkForMultipleOfNumber({
      numToBeChecked: inputQty,
      multipleOf: 20,
    });
    const validationError = handleQuantityValidation({
      inputValue: inputQty,
      isMultipleOf20: isMultipleOf20,
      locality: serviceableZone as Localities,
    });

    setError(validationError);

    if (!validationError) {
      deliveryStore.setState(state => ({
        ...state,
        selectedDeliveryProducts: [
          {
            product: {
              name: product?.product_variation?.product.name,
              qty: inputQty,
              variation_id: product?.product_variation_id,
              salePrice: product.sale_price,
              product_partner_localities_price_id: product.id,
            },
          },
        ],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <View>
        <View>
          <TextInput
            onFocus={scrollToPosition}
            keyboardType="numeric"
            value={quantity}
            onChangeText={text => {
              const numericText = text.replace(/[^0-9]/g, '');
              changeQty(numericText);
            }}
            maxLength={7}
            style={[
              commonInputStyles,
              {
                height: 36,
                width: 160,
                fontSize: 14,
                color: FBColors.steelBlue,
                paddingVertical: 0,
                flex: 1,
                marginRight: 5,
              },
            ]}
          />
          <Text
            color="steelBlue"
            weight="300"
            style={{
              position: 'absolute',
              right: 20,
              bottom: 4,
            }}>
            Litre.
          </Text>
        </View>
        {error && (
          <Text size="xs" style={{marginTop: 10, marginLeft: 4}} color="error">
            {error}
          </Text>
        )}
      </View>
    </View>
  );
};

export default ProductInput;
