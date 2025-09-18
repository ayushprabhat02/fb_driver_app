import React, { useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { View, Alert, ViewStyle, FlatList } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { OrderStackParamList } from '@/navigator/containers/Order';

// components
import { FocusAwareStatusBar, FullScreenLoader, Button } from '@/components';
import { AssetSummaryCard, AssetSearchBar, AssetCard, OrderInfoCard } from '../components';
import OrderCancellationRequest from '../components/OrderCancellationRequest';

// styles
import { FBBackground, FBColorPalette } from '@/types/styles';
import orderService from '../services';
import { orderStore } from '@/globalStore';
import { getAssetIdsWithUploadedVideosForTask, getAssetIdsWithInterruptedRecording } from '@/utils/streamStorage';

const ChooseAssetScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<OrderStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const orderAssets = orderStore.use.orderAssets();
  const fuelDispensedTillNow = orderStore.use.fuelDispensedTillNow();
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();

  const stopLoader = orderStore.use.stopLoader();
  const startLoader = orderStore.use.startLoader();
  const orderLoader = orderStore.use.loaders();

  // Get partially filled assets and assets with uploaded videos from store
  const partiallyFilledAssetsArray =
    orderStore.use.partiallyFilledAssetsArray();
  const assetsWithUploadedVideos = orderStore.use.assetsWithUploadedVideos();

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Choose Asset',
      headerShown: true,
    });
  }, [navigation]);

  // Map orderAssets to the expected format for AssetCard
  // Use useMemo to ensure this recalculates when orderAssets changes
  const mappedAssets = React.useMemo(() => {
    return (orderAssets || []).map((orderAsset: any) => ({
      id: orderAsset.customer_asset?.id || '',
      name: orderAsset.customer_asset?.name || '',
      code: orderAsset.customer_asset?.description,
      requestedQuantity: orderAsset.quantity_requested || 0,
      filledQuantity: orderAsset.quantity_dispensed || 0,
    }));
  }, [orderAssets]);

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
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => console.log('Dispense started') },
    ]);
  };

  const handleStartDispense = (asset: any) => {
    // Get the selected order (fillup order takes priority)
    const selectedOrder = currentFillupOrder || currentDriverOrder;

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
    const assetId =
      asset.customer_asset?.id || asset.id || asset.customer_asset_id;

    if (!assetId) {
      Alert.alert('Error', 'Asset ID is missing. Please try again.');
      return;
    }

    // Set the current asset for dispense in the store with proper structure
    const assetForDispense = {
      id: assetId,
      customer_asset: asset.customer_asset || asset,
      ...asset,
    };

    orderStore.setState(state => ({
      ...state,
      currentAssetForDispense: assetForDispense,
    }));

    // Navigate to live stream screen
    navigation.navigate('live-stream');
  };

  const handleProceed = () => {
    // Filter assets with dispensed fuel for the next step
    const dispensedAssets =
      orderAssets?.filter(
        (asset: any) => (asset.quantity_dispensed || 0) > 0,
      ) || [];

    if (dispensedAssets.length === 0) {
      Alert.alert(
        'No Fuel Dispensed',
        'Please dispense fuel to at least one asset before proceeding.',
      );
      return;
    }

    // Store dispensed assets in the order store for the delivery challan
    orderStore.setState(state => ({
      ...state,
      dispenseCompletedAssets: dispensedAssets,
    }));

    // Check if buddy challan flow is enabled
    if (currentDriverOrder?.is_enable_buddycan_flow) {
      navigation.navigate('buddy-challan');
    } else {
      navigation.navigate('delivery-challan');
    }
  };

  // 🚫 CANCELLATION FUNCTIONALITY - Using simplified components
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const handleCancel = () => {
    setShowCancellationModal(true);
  };

  const handleCancellationSuccess = () => {
    // Navigate back to previous screen after successful cancellation
    navigation.goBack();
  };

  const restoreAssetsWithUploadedVideos = useCallback(async () => {
    const selectedOrder = currentFillupOrder || currentDriverOrder;
    if (!selectedOrder?.id) return;

    try {
      // Get persisted asset IDs with uploaded videos
      const persistedAssetIds = await getAssetIdsWithUploadedVideosForTask(selectedOrder.id);
      
      if (persistedAssetIds.length > 0) {
        // Update store with persisted asset IDs
        orderStore.setState(state => ({
          ...state,
          assetsWithUploadedVideos: [...new Set([...state.assetsWithUploadedVideos, ...persistedAssetIds])],
        }));
      }
    } catch (error) {
      console.error('Failed to restore assets with uploaded videos:', error);
    }
  }, [currentFillupOrder, currentDriverOrder]);

  const restoreInterruptedRecordingSessions = useCallback(async () => {
    const selectedOrder = currentFillupOrder || currentDriverOrder;
    if (!selectedOrder?.id) {
      console.log('No selected order for interrupted recording restoration');
      return;
    }

    try {
      console.log('Restoring interrupted recording sessions for order:', selectedOrder.id);
      const interruptedAssetIds = await getAssetIdsWithInterruptedRecording(selectedOrder.id);
      
      console.log('Found interrupted asset IDs:', interruptedAssetIds);
      
      if (interruptedAssetIds.length > 0) {
        orderStore.setState(state => ({
          ...state,
          assetsWithInterruptedRecording: [...new Set([...state.assetsWithInterruptedRecording, ...interruptedAssetIds])],
        }));
        console.log('Updated store with interrupted recording assets:', interruptedAssetIds);
      }
    } catch (error) {
      console.error('Failed to restore interrupted recording sessions:', error);
    }
  }, [currentFillupOrder, currentDriverOrder]);

  const getCustomerOrderAssets = useCallback(async () => {
    // Get the selected order (fillup order takes priority)
    const selectedOrder = currentFillupOrder || currentDriverOrder;

    // Check if selectedOrder is available before making API call
    if (!selectedOrder) {
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
      return;
    }

    // Use search query or default to '%%' for all results
    const searchKey = debouncedSearchQuery ? `%${debouncedSearchQuery}%` : '%%';

    startLoader('chooseAsset');
    try {
      await orderService.getAllCustomerOrderedAssets({
        custOrderId: customerOrderId,
        searchKey: searchKey,
      });
      
      // Restore assets with uploaded videos after fetching assets
      await restoreAssetsWithUploadedVideos();
      // Restore interrupted recording sessions
      await restoreInterruptedRecordingSessions();
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      stopLoader('chooseAsset');
    }
  }, [
    currentFillupOrder,
    currentDriverOrder,
    debouncedSearchQuery,
    startLoader,
    stopLoader,
    restoreAssetsWithUploadedVideos,
    restoreInterruptedRecordingSessions,
  ]);

  useEffect(() => {
    getCustomerOrderAssets();
  }, [getCustomerOrderAssets]);

  // Refresh data when screen comes into focus (e.g., after navigation from LiveStream)
  useFocusEffect(
    useCallback(() => {
      getCustomerOrderAssets();
    }, [getCustomerOrderAssets]),
  );

  // Function to check if any asset has fill remaining status
  const getAssetIdFromAsset = (asset: any) => {
    return (
      asset?.customer_asset?.id || asset?.id || asset?.customer_asset_id || ''
    );
  };

  const hasAnyAssetWithFillRemaining = React.useMemo(() => {
    if (!orderAssets) return false;

    return orderAssets.some((asset: any) => {
      const assetId = getAssetIdFromAsset(asset);
      return (
        partiallyFilledAssetsArray.includes(assetId) ||
        assetsWithUploadedVideos.includes(assetId)
      );
    });
  }, [orderAssets, partiallyFilledAssetsArray, assetsWithUploadedVideos]);

  // Function to check if a specific asset has fill remaining (for current asset exclusion)
  const assetHasFillRemaining = React.useCallback(
    (asset: any) => {
      const assetId = getAssetIdFromAsset(asset);
      return (
        partiallyFilledAssetsArray.includes(assetId) ||
        assetsWithUploadedVideos.includes(assetId)
      );
    },
    [partiallyFilledAssetsArray, assetsWithUploadedVideos],
  );

  /**
   * 🎯 CENTRALIZED BUTTON STATE MANAGEMENT
   *
   * This function determines the state of both Cancel Request and Proceed buttons
   * based on the current order assets and their dispensing status.
   *
   * Logic matches Vue.js ChooseAsset.vue implementation:
   * - Cancel Request: Only enabled when NO dispensing activity has started
   * - Proceed: Only enabled when AT LEAST ONE asset has been dispensed
   */
  const buttonStates = React.useMemo(() => {
    // Default state when no assets are loaded
    if (!orderAssets || orderAssets.length === 0) {
      return {
        isCancelRequestEnabled: true,
        isProceedEnabled: false,
        debugInfo: 'No assets loaded',
      };
    }

    // 1️⃣ Check if ANY asset has been dispensed (has quantity > 0)
    const hasAssetWithQuantityDispensed = orderAssets.some((asset: any) => {
      const quantity = asset.quantity_dispensed;
      return quantity !== null && quantity !== undefined && quantity > 0;
    });

    // 2️⃣ Check if ANY asset is in partially filled state
    const hasPartiallyFilledAsset = partiallyFilledAssetsArray.length > 0;

    // 3️⃣ Check if ANY asset has uploaded video (streaming done but no quantity entered yet)
    const hasAssetWithUploadedVideo = assetsWithUploadedVideos.length > 0;

    // 📊 Simplified Button Logic:
    //
    // Show CANCEL REQUEST when: NO dispensing activity has started
    // Show PROCEED when: ANY dispensing activity has started
    const hasAnyDispensingActivity =
      hasAssetWithQuantityDispensed ||
      hasPartiallyFilledAsset ||
      hasAssetWithUploadedVideo;

    const showCancelRequest = !hasAnyDispensingActivity;
    const showProceed = hasAnyDispensingActivity;

    // PROCEED BUTTON enabled when: at least one asset dispensed AND no pending fill remaining
    const isProceedEnabled = hasAssetWithQuantityDispensed && !hasAssetWithUploadedVideo;

    // Debug information for developers
    const debugInfo = {
      hasAssetWithQuantityDispensed,
      hasPartiallyFilledAsset,
      hasAssetWithUploadedVideo,
      hasAnyDispensingActivity,
      partiallyFilledCount: partiallyFilledAssetsArray.length,
      uploadedVideoCount: assetsWithUploadedVideos.length,
      totalAssets: orderAssets.length,
    };

    return {
      showCancelRequest,
      showProceed,
      isProceedEnabled,
      debugInfo,
    };
  }, [orderAssets, partiallyFilledAssetsArray, assetsWithUploadedVideos]);

  // 🐛 Debug logging (can be removed in production)
  console.log('🎯 Button States:', {
    showCancel: buttonStates.showCancelRequest,
    showProceed: buttonStates.showProceed,
    proceedEnabled: buttonStates.isProceedEnabled,
    debug: buttonStates.debugInfo,
  });

  // Memoize the renderItem function to prevent unnecessary re-renders
  const renderAssetItem = React.useCallback(
    ({ item, index }: { item: any; index: number }) => {
      // Find the original asset data
      const originalAsset = orderAssets?.[index];
      if (!originalAsset) return null;

      // Check if this specific asset has fill remaining status
      const currentAssetHasFillRemaining = assetHasFillRemaining(originalAsset);

      // Determine if other assets have fill remaining (exclude current asset)
      const hasOtherAssetWithFillRemaining =
        hasAnyAssetWithFillRemaining && !currentAssetHasFillRemaining;

      return (
        <AssetCard
          assetName={item.name}
          assetCode={item.code}
          requestedQuantity={item.requestedQuantity}
          filledQuantity={item.filledQuantity}
          onDispense={() => handleDispense(item.id)}
          asset={originalAsset} // Pass the full asset object
          onStartDispense={() => handleStartDispense(originalAsset)} // Pass the original asset with full data
          hasOtherFillRemaining={hasOtherAssetWithFillRemaining} // Pass the new prop
        />
      );
    },
    [orderAssets, hasAnyAssetWithFillRemaining, assetHasFillRemaining],
  );

  // Get data from store for cancellation reason logic
  const orderAssetsForCancellation = orderStore.use.orderAssets();
  const partiallyFilledAssetsArrayForCancellation =
    orderStore.use.partiallyFilledAssetsArray();
  const assetsWithUploadedVideosForCancellation =
    orderStore.use.assetsWithUploadedVideos();

  // Get context-aware button text
  const getCancellationButtonText = useCallback(() => {
    const hasDispenseStarted = orderAssetsForCancellation?.some(
      (asset: any) =>
        asset.quantity_dispensed > 0 ||
        partiallyFilledAssetsArrayForCancellation.includes(
          asset?.customer_asset?.id,
        ) ||
        assetsWithUploadedVideosForCancellation.includes(
          asset?.customer_asset?.id,
        ),
    );

    return hasDispenseStarted ? 'Report Issue' : 'Cancel Request';
  }, [
    orderAssetsForCancellation,
    partiallyFilledAssetsArrayForCancellation,
    assetsWithUploadedVideosForCancellation,
  ]);

  return (
    <View style={{ flex: 1 }}>
      <FocusAwareStatusBar
        backgroundColor={FBBackground.primary}
        barStyle="dark-content"
      />

      <View style={styles.container as ViewStyle}>
        <OrderInfoCard />

        <AssetSummaryCard />

        <AssetSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <FlatList
          data={mappedAssets}
          keyExtractor={(item, index) =>
            `${item.id}-${item.filledQuantity}-${index}`
          } // Include filledQuantity in key to force re-render
          renderItem={renderAssetItem}
          contentContainerStyle={{ paddingBottom: 100 }} // 👈 ensures space for buttons
          extraData={orderAssets} // Force re-render when orderAssets changes
        />
      </View>

      <FullScreenLoader
        showLoader={orderLoader.orderAssets}
        loaderText="Fetching order assets"
      />
      <View style={styles.buttonContainer as ViewStyle}>
        {buttonStates.showCancelRequest ? (
          <Button
            onPress={handleCancel}
            variant="outlined"
            style={[
              { flex: 1 },
              { borderColor: FBColorPalette.error }
            ]}
            textStyle={{
              color: FBColorPalette.error
            }}>
            Cancel Request
          </Button>
        ) : (
          <Button
            onPress={handleProceed}
            variant="solid"
            style={[
              { flex: 1 },
              buttonStates.isProceedEnabled
                ? {}
                : {
                  backgroundColor: FBColorPalette.disabledInputText,
                  opacity: 0.6,
                }
            ]}
            textStyle={{
              color: buttonStates.isProceedEnabled
                ? 'white'
                : FBColorPalette.disabledInputText
            }}
            disabled={!buttonStates.isProceedEnabled}>
            Proceed
          </Button>
        )}
      </View>

      {/* 🚫 ORDER CANCELLATION REQUEST COMPONENT */}
      <OrderCancellationRequest
        isVisible={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onSuccess={handleCancellationSuccess}
      />

      {/* FullScreen Loader */}
      <FullScreenLoader showLoader={orderLoader.chooseAsset} loaderText="Loading assets..." />
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

export default ChooseAssetScreen;
