// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';
import {FBBorders} from '@/types/styles';

const AssetsAdded: React.FC = () => {
  const allCustomerAssets =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  return (
    <View>
      <Text size="lg" weight="500">
        Assets Added
      </Text>
      <Divider />
      <View style={{flexDirection: 'row', alignItems: 'center', columnGap: 10}}>
        <View style={styles.assetsContainer}>
          <Text>
            {allCustomerAssets.length > 1
              ? `${allCustomerAssets[0]?.name} + ${
                  allCustomerAssets.length - 1
                } others`
              : `${allCustomerAssets[0]?.name}`}
          </Text>
        </View>
        {/* <Button
          variant="solid"
          onPress={proceedToCheckout}
          style={{height: 42, flex: 1}}>
          Checkout
        </Button> */}
      </View>
    </View>
  );
};

export default AssetsAdded;

const styles = StyleSheet.create({
  assetsContainer: {
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    paddingVertical: 12,
    paddingLeft: 8,
    borderRadius: 10,
    flex: 2,
  },
});
