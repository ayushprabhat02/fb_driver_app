// dependencies
import {View} from 'react-native';
import React, {useEffect, useState} from 'react';

// store
import deliveryStore from '../../store';

// components
import DetailsComponent from '../DetailsComponent';
import {Text, Input} from '@/components';
import {FBColorPalette} from '@/types/styles';

// types
import {FetchDeliveryProductsWithPricesQuery} from '@/generated/graphql';

const AddProducts: React.FC = () => {
  const deliveryProducts = deliveryStore.use.fetchedDeliveryProducts();

  return (
    <DetailsComponent
      title="Product Quantity"
      cardStyle={{marginTop: 12, minHeight: 48, justifyContent: 'center'}}>
      {deliveryProducts.length ? (
        deliveryProducts.map(product => {
          return <ProductInput product={product} key={product.id} />;
        })
      ) : (
        <View style={{justifyContent: 'center'}}>
          <Text color="lightGray">Please select address first</Text>
        </View>
      )}
    </DetailsComponent>
  );
};

interface ProductInputProps {
  product: FetchDeliveryProductsWithPricesQuery['product_partner_localities_price'][0];
}

const ProductInput: React.FC<ProductInputProps> = ({product}) => {
  const [quantity, setQuantity] = useState<string>('');
  const deliveryPartner = deliveryStore.use.deliveryPartner();

  const [error, setError] = useState<string>('');

  const minOrderQty =
    deliveryPartner?.partner_localities[0]?.locality?.minimum_order_quantity;

  const changeQty = (value: string) => {
    setQuantity(value);
  };

  useEffect(() => {
    if (!quantity) {
      setError('');
    }
    /**
     * todo: this logic is incomplete as of now and needs to be updated
     * currently we are replacing the exisitng qty with the new qty
     * correction that needs to be applied - check if product already exists in the array
     * if product exists then update the qty
     * else add the product to the array
     * keep existing products in the array as it is
     * * Refer to customer app pwa for the logic
     */
    if (parseInt(quantity, 10) < (minOrderQty as number)) {
      setError(` Min Order Qty.
      ${deliveryPartner?.partner_localities[0]?.locality?.minimum_order_quantity}`);
    } else {
      setError('');
      deliveryStore.setState(state => ({
        ...state,
        selectedDeliveryProducts: [
          {
            product: {
              name: product?.product_variation?.product.name,
              qty: parseInt(quantity, 10),
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
      <Text size="sm">
        {product?.product_variation?.product.name} - Rs. {product?.sale_price}
        /Ltr
      </Text>
      <View>
        <Input
          type="numeric"
          value={quantity}
          onChangeText={changeQty}
          height={36}
          width={100}
          textSize="xs"
          style={{borderColor: FBColorPalette.primary}}
        />
        {error && (
          <Text size="xs" style={{marginTop: 10}} color="error">
            Min Order Qty.
            {
              deliveryPartner?.partner_localities[0]?.locality
                ?.minimum_order_quantity
            }
          </Text>
        )}
      </View>
    </View>
  );
};

export default AddProducts;
