import React, {useState, useLayoutEffect, useEffect, useCallback} from 'react';
import {useDebounce} from 'use-debounce';
import {ScrollView, View, Alert, ViewStyle, FlatList} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {OrderStackParamList} from '@/navigator/containers/Order';

// components
import {
  HeaderAvoidingContainer,
  FocusAwareStatusBar,
  FullScreenLoader,
  Button,
} from '@/components';
import {
  AssetSummaryCard,
  AssetSearchBar,
  AssetCard,
  AssetActionButtons,
} from '../components';

// styles
import {FBBackground, FBColorPalette} from '@/types/styles';
import orderService from '../services';
import {orderStore} from '@/globalStore';

const ChooseAsset: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<OrderStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentCustomerOrder = orderStore.use.currentCustomerOrder();
  const orderAssets = orderStore.use.orderAssets();

  const stopLoader = orderStore.use.stopLoader();
  const startLoader = orderStore.use.startLoader();
  const orderLoader = orderStore.use.loaders();

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Choose Asset',
      headerShown: true,
    });
  }, [navigation]);

  // Map orderAssets to the expected format for AssetCard
  const mappedAssets = (orderAssets || []).map((orderAsset: any) => ({
    id: orderAsset.customer_asset?.id || '',
    name: orderAsset.customer_asset?.name || '',
    code: orderAsset.customer_asset?.description,
    requestedQuantity: orderAsset.quantity_requested || 0,
    filledQuantity: orderAsset.quantity_dispensed || 0,
  }));

  console.log('mappedAssets:', mappedAssets);

  // Calculate totals
  const totalQuantity = mappedAssets.reduce(
    (sum, asset) => sum + asset.requestedQuantity,
    0,
  );
  const filledQuantity = mappedAssets.reduce(
    (sum, asset) => sum + asset.filledQuantity,
    0,
  );
  const pendingQuantity = totalQuantity - filledQuantity;

  const handleDispense = (assetId: string) => {
    Alert.alert('Start Dispense', `Start dispensing for asset ${assetId}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Start', onPress: () => console.log('Dispense started')},
    ]);
  };
  
  const handleStartDispense = (asset: any) => {
    console.log('Starting dispense for asset:', JSON.stringify(asset, null, 2));
    
    // Get the selected order (fillup order takes priority)
    const selectedOrder = currentFillupOrder || currentCustomerOrder;
    console.log('Selected order:', selectedOrder);
    
    // Ensure the selectedOrder is available for the live stream screen
    if (!selectedOrder) {
      Alert.alert('Error', 'No order selected. Please try again.');
      return;
    }
    
    // Ensure asset has the required data
    if (!asset) {
      Alert.alert('Error', 'No asset data available. Please try again.');
      return;
    }
    
    // Extract the asset ID - check multiple possible locations
    const assetId = asset.customer_asset?.id || asset.id || asset.customer_asset_id;
    
    if (!assetId) {
      console.error('Asset ID not found in asset object:', asset);
      Alert.alert('Error', 'Asset ID is missing. Please try again.');
      return;
    }
    
    console.log('Using asset ID:', assetId);
    
    // Set the current asset for dispense in the store with proper structure
    const assetForDispense = {
      id: assetId,
      customer_asset: asset.customer_asset || asset,
      ...asset
    };
    
    orderStore.setState(state => ({
      ...state,
      currentAssetForDispense: assetForDispense,
    }));
    
    console.log('Set currentAssetForDispense:', assetForDispense);
    
    // Navigate to live stream screen
    navigation.navigate('live-stream');
  };

  const handleProceed = () => {
    Alert.alert('Proceed', 'Proceeding with the order...');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes', style: 'destructive', onPress: () => navigation.goBack()},
      ],
    );
  };

  console.log('------selectedOrder-----', JSON.stringify(currentFillupOrder || currentCustomerOrder));

  const getCustomerOrderAssets = useCallback(async () => {
    // Get the selected order (fillup order takes priority)
    const selectedOrder = currentFillupOrder || currentCustomerOrder;
    
    // Check if selectedOrder is available before making API call
    if (!selectedOrder) {
      console.warn('No selectedOrder available for fetching assets');
      return;
    }

    // Extract customer order ID based on order type
    // For fillup orders (task objects), use customer_order.id
    // For regular orders, use id directly
    const customerOrderId =
      'customer_order' in selectedOrder && selectedOrder.customer_order
        ? selectedOrder.customer_order.id
        : selectedOrder.id;

    if (!customerOrderId) {
      console.warn('No customer order ID available for fetching assets');
      return;
    }

    // Use search query or default to '%%' for all results
    const searchKey = debouncedSearchQuery ? `%${debouncedSearchQuery}%` : '%%';
    console.log('Searching with key:', searchKey);

    startLoader('orderAssets');
    try {
      await orderService.getAllCustomerOrderedAssets({
        custOrderId: customerOrderId,
        searchKey: searchKey,
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      stopLoader('orderAssets');
    }
  }, [currentFillupOrder, currentCustomerOrder, debouncedSearchQuery, startLoader, stopLoader]);

  useEffect(() => {
    getCustomerOrderAssets();
  }, [getCustomerOrderAssets]);

  return (
    <View style={{flex: 1}}>
      <FocusAwareStatusBar
        backgroundColor={FBBackground.primary}
        barStyle="dark-content"
      />

      <View style={styles.container as ViewStyle}>
        <AssetSummaryCard />

        <AssetSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <FlatList
          data={mappedAssets}
          keyExtractor={item => item.id.toString()}
          renderItem={({item, index}) => {
            // Find the original asset data
            const originalAsset = orderAssets[index];
            return (
              <AssetCard
                assetName={item.name}
                assetCode={item.code}
                requestedQuantity={item.requestedQuantity}
                filledQuantity={item.filledQuantity}
                onDispense={() => handleDispense(item.id)}
                asset={originalAsset} // Pass the full asset object
                onStartDispense={() => handleStartDispense(originalAsset)} // Pass the original asset with full data
              />
            );
          }}
          contentContainerStyle={{paddingBottom: 100}} // 👈 ensures space for buttons
        />
      </View>

      <FullScreenLoader
        showLoader={orderLoader.orderAssets}
        loaderText="Fetching order assets"
      />
      <View style={styles.buttonContainer as ViewStyle}>
        <Button
          onPress={handleCancel}
          variant="outlined"
          style={{flex: 1, marginRight: 8, borderColor: FBColorPalette.error}}
          textStyle={{color: FBColorPalette.error}}>
          Cancel Request
        </Button>
        <Button
          onPress={handleProceed}
          variant="solid"
          style={{flex: 1, marginLeft: 8}}>
          Proceed
        </Button>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: '16@s',
    paddingTop: '16@vs',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

export default ChooseAsset;
