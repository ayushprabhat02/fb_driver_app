// dependencies
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {DetailsComponent} from '..';
import {Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';

const CheckoutProductWithQty: React.FC = () => {
  const selectedProducts = deliveryStore.use.selectedDeliveryProducts();

  return (
    <DetailsComponent
      title={'Product quantity'}
      cardStyle={styles.productQuantityCard as any}>
      {selectedProducts.map(product => {
        return (
          <View
            key={product.product?.variation_id}
            style={styles.detailsContainer}>
            <Text>{`${product.product.name} - ${product.product.salePrice}/litre`}</Text>
            <Text>{product.product.qty} L</Text>
          </View>
        );
      })}
    </DetailsComponent>
  );
};

export default CheckoutProductWithQty;

const styles = ScaledSheet.create({
  productQuantityCard: {
    height: '50@vs',
    marginTop: '10@vs',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  detailsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
