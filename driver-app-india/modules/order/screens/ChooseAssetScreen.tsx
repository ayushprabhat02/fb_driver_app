import React, {useState, useLayoutEffect, useEffect, useCallback} from 'react';
import {useDebounce} from 'use-debounce';
import {View, Alert, ViewStyle, FlatList, RefreshControl} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {OrderStackParamList} from '@/navigator/containers/Order';

// components
import {FocusAwareStatusBar, FullScreenLoader, Button, Text} from '@/components';
import {AssetSummaryCard, AssetSearchBar, AssetCard} from '../components';
import QuantitySummaryCard from '../components/QuantitySummaryCard';
import OrderCancellationRequest from '../components/OrderCancellationRequest';

// styles
import {FBBackground, FBColorPalette} from '@/types/styles';
import orderService from '../services';
import {orderStore, userStore} from '@/globalStore';

// utils and services
import {markOrderArrived, fetchCurrentDriverOrderState, handleMissedIntermediateActions} from '@/modules/order/utils/orderValidation';
import {startLiveLocationTracking} from '@/modules/order/utils/liveLocationTracking';

const ChooseAssetScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<OrderStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // Store selectors (using Zustand per project specification)
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const orderAssets = orderStore.use.orderAssets();
  const fuelDispensedTillNow = orderStore.use.fuelDispensedTillNow();
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();
  const partiallyFilledAssetsArray = orderStore.use.partiallyFilledAssetsArray();
  const assetsWithUploadedVideos = orderStore.use.assetsWithUploadedVideos();
  const loggedInUser = userStore.use.loggedInUser();

  // Store methods
  const stopLoader = orderStore.use.stopLoader();
  const startLoader = orderStore.use.startLoader();
  const orderLoader = orderStore.use.loaders();
  const setCurrentAssetForDispense = orderStore.use.setCurrentAssetForDispense();
  const setDispenseCompletedAssets = orderStore.use.setDispenseCompletedAssets();

  // Tower Driver Check (exclusive app - all users are tower drivers)
  const isTowerDriverUser = true;
  
  console.log('🗼 ChooseAsset - Tower Driver App - All users are tower drivers');
  console.log('🔄 Current order state:', currentDriverOrder?.state);
  console.log('📦 Assets count:', orderAssets?.length || 0);

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Choose Asset',
      headerShown: true,
    });
  }, [navigation]);

  /**
   * Handle missed intermediate page actions when jumping directly to ChooseAsset
   * This auto-handles health checks and order state transitions
   * Matches Vue.js handleMissedIntermediateActions functionality
   */
  const handleMissedIntermediateActionsLocal = useCallback(async () => {
    try {
      const currentOrder = currentDriverOrder;
      console.log('🔍 ChooseAsset handleMissedIntermediateActions called with order:', {
        id: currentOrder?.id,
        orderCode: currentOrder?.customer_order?.order_code,
        state: currentOrder?.state
      });
      
      // Safety check: Don't proceed if we don't have a valid order
      if (!currentOrder?.id) {
        console.warn('⚠️ No current order found in handleMissedIntermediateActions');
        return;
      }
      
      // Handle missed intermediate page actions only for ASSIGNED and IN_TRANSIT orders
      const currentState = currentOrder?.state;
      if (currentState === 'ASSIGNED' || currentState === 'IN_TRANSIT') {
        console.log('⚡ Calling handleMissedIntermediateActions for', currentState, 'order');
        await handleMissedIntermediateActions();
      } else {
        console.log('⏭️ Skipping handleMissedIntermediateActions for', currentState, 'order');
      }
    } catch (error) {
      console.error('Error in handleMissedIntermediateActionsLocal:', error);
      // Don't throw error, let the page continue loading
    }
  }, [currentDriverOrder]);

  /**
   * Fetch current order and assets data (matching Vue.js fetchCurrentOrderAndAssets)
   */
  const fetchCurrentOrderAndAssets = useCallback(async (skipOrderRefresh = false) => {
    setLoadingAssets(true);
    
    try {
      let order = currentDriverOrder;

      // Only fetch fresh order data if not already done
      if (!skipOrderRefresh) {
        console.log('🔄 fetchCurrentOrderAndAssets - Before fetchCurrentDriverOrderState:', {
          id: order?.id,
          orderCode: order?.customer_order?.order_code,
          state: order?.state
        });
        
        // Fetch fresh order data to get latest dispensed quantities
        await fetchCurrentDriverOrderState();
        order = orderStore.getState().currentDriverOrder;

        console.log('🔄 fetchCurrentOrderAndAssets - After fetchCurrentDriverOrderState:', {
          id: order?.id,
          orderCode: order?.customer_order?.order_code,
          state: order?.state
        });
      } else {
        console.log('⏭️ Skipping fetchCurrentDriverOrderState - already refreshed');
      }

      if (!order) {
        Alert.alert('Order Unassigned', 'No order is currently assigned.');
        navigation.goBack();
        return;
      }

      // Fetch assets for the current order
      await getCustomerOrderAssets();
      
      console.log('✅ fetchCurrentOrderAndAssets completed');
    } catch (error) {
      console.error('Error in fetchCurrentOrderAndAssets:', error);
      Alert.alert('Error', 'Failed to load order data. Please try again.');
    } finally {
      setLoadingAssets(false);
    }
  }, [currentDriverOrder, navigation]);

  /**
   * onMounted equivalent - handles initial data loading and missed actions
   * Matches Vue.js onMounted logic
   */
  useEffect(() => {
    const initializeChooseAsset = async () => {
      try {
        console.log('🚀 ChooseAsset onMounted - Initial order state:', {
          id: currentDriverOrder?.id,
          orderCode: currentDriverOrder?.customer_order?.order_code,
          state: currentDriverOrder?.state
        });
        
        // CRITICAL FIX: Always refresh order data first to ensure we have the latest state
        console.log('🔄 Refreshing order data first to prevent stale references');
        await fetchCurrentDriverOrderState();
        
        const refreshedOrder = orderStore.getState().currentDriverOrder;
        console.log('🔄 After refresh - Current order:', {
          id: refreshedOrder?.id,
          orderCode: refreshedOrder?.customer_order?.order_code,
          state: refreshedOrder?.state
        });
        
        // Handle missed intermediate page actions
        await handleMissedIntermediateActionsLocal();
        
        // Fetch order and assets data (pass true to skip redundant fetchCurrentDriverOrderState)
        await fetchCurrentOrderAndAssets(true);
        
        console.log('✅ ChooseAsset onMounted completed');
      } catch (error) {
        console.error('Error on ChooseAsset mounted:', error);
        Alert.alert('Error', 'Failed to initialize screen. Please try again.');
      }
    };

    initializeChooseAsset();
  }, []);

  // Refresh control for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCurrentOrderAndAssets(false);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCurrentOrderAndAssets]);

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
      {text: 'Cancel', style: 'cancel'},
      {text: 'Start', onPress: () => console.log('Dispense started')},
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

  const handleProceed = async () => {
    // Tower driver proceed logic (matching Vue.js proceed function)
    try {
      console.log('🚀 Tower Driver proceeding to next step');
      
      // Filter assets with dispensed fuel for the next step
      const dispensedAssets = orderAssets?.filter(
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
      setDispenseCompletedAssets(dispensedAssets);

      // Tower driver specific routing logic (matching Vue.js)
      if (currentDriverOrder?.is_enable_buddycan_flow) {
        console.log('🤖 Routing to buddy challan (BuddyCan flow)');
        navigation.navigate('buddy-challan');
      } else {
        console.log('📄 Routing to delivery challan');
        // For tower drivers, route to delivery challan
        navigation.navigate('delivery-challan');
      }
    } catch (error) {
      console.error('Error in handleProceed:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
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

    // 📊 Button Logic (matching Vue.js):
    //
    // CANCEL REQUEST BUTTON:
    // ✅ Enabled: When NO dispensing activity has started
    // ❌ Disabled: When ANY dispensing activity has started
    const isCancelRequestEnabled =
      !hasAssetWithQuantityDispensed &&
      !hasPartiallyFilledAsset &&
      !hasAssetWithUploadedVideo;

    // PROCEED BUTTON:
    // ✅ Enabled: When at least one asset has been dispensed
    // ❌ Disabled: When no assets have been dispensed yet
    const isProceedEnabled = hasAssetWithQuantityDispensed;

    // Debug information for developers
    const debugInfo = {
      hasAssetWithQuantityDispensed,
      hasPartiallyFilledAsset,
      hasAssetWithUploadedVideo,
      partiallyFilledCount: partiallyFilledAssetsArray.length,
      uploadedVideoCount: assetsWithUploadedVideos.length,
      totalAssets: orderAssets.length,
    };

    return {
      isCancelRequestEnabled,
      isProceedEnabled,
      debugInfo,
    };
  }, [orderAssets, partiallyFilledAssetsArray, assetsWithUploadedVideos]);

  // 🐛 Debug logging (can be removed in production)
  console.log('🎯 Button States:', {
    cancelEnabled: buttonStates.isCancelRequestEnabled,
    proceedEnabled: buttonStates.isProceedEnabled,
    debug: buttonStates.debugInfo,
  });

  // Memoize the renderItem function to prevent unnecessary re-renders
  const renderAssetItem = React.useCallback(
    ({item, index}: {item: any; index: number}) => {
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
    <View style={{flex: 1, backgroundColor: '#F9FAFB'}}>
      <FocusAwareStatusBar
        backgroundColor={FBBackground.primary}
        barStyle="dark-content"
      />

      {/* Professional Header */}
      <View style={styles.headerContainer as ViewStyle}>
        <View style={styles.headerContent as ViewStyle}>
          <Text size="xl" weight="600" color="neutral">
            Assets to be filled
          </Text>
          <Text size="sm" color="lightGray" style={{marginTop: 4}}>
            Order #{currentDriverOrder?.customer_order?.order_code}
          </Text>
        </View>
      </View>

      {/* Progress Summary (matching Vue.js QuantitySummaryCard) */}
      <View style={styles.progressContainer as ViewStyle}>
        <QuantitySummaryCard />
      </View>

      <View style={styles.container as ViewStyle}>
        <AssetSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Loading State */}
        {loadingAssets ? (
          <View style={styles.loadingContainer as ViewStyle}>
            <Text size="sm" color="lightGray">
              Loading assets...
            </Text>
          </View>
        ) : (
          <FlatList
            data={mappedAssets}
            keyExtractor={(item, index) =>
              `${item.id}-${item.filledQuantity}-${index}`
            }
            renderItem={renderAssetItem}
            contentContainerStyle={{paddingBottom: 100}}
            extraData={orderAssets}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyStateContainer as ViewStyle}>
                <View style={styles.emptyStateIcon as ViewStyle}>
                  <Text size="xl">📦</Text>
                </View>
                <Text size="lg" weight="600" color="neutral" style={{marginBottom: 8}}>
                  No assets found
                </Text>
                <Text size="sm" color="lightGray">
                  No assets available for this order
                </Text>
              </View>
            }
          />
        )}
      </View>

      <FullScreenLoader
        showLoader={orderLoader.orderAssets}
        loaderText="Fetching order assets"
      />
      <View style={styles.buttonContainer as ViewStyle}>
        {/* 🚫 CANCEL REQUEST BUTTON */}
        <Button
          onPress={handleCancel}
          variant="outlined"
          style={[
            {flex: 1, marginRight: 8},
            buttonStates.isCancelRequestEnabled
              ? {borderColor: FBColorPalette.error} // 🔴 Active red state
              : {borderColor: FBColorPalette.disabledInputText, opacity: 0.5}, // 🔄 Disabled gray state
          ]}
          textStyle={{
            color: buttonStates.isCancelRequestEnabled
              ? FBColorPalette.error // 🔴 Active red text
              : FBColorPalette.disabledInputText, // 🔄 Disabled gray text
          }}
          disabled={!buttonStates.isCancelRequestEnabled}>
          {getCancellationButtonText()}
        </Button>

        {/* ✅ PROCEED BUTTON */}
        <Button
          onPress={handleProceed}
          variant="solid"
          style={[
            {flex: 1, marginLeft: 8},
            buttonStates.isProceedEnabled
              ? {} // 🟢 Default green state (handled by variant="solid")
              : {
                  backgroundColor: FBColorPalette.disabledInputText,
                  opacity: 0.6,
                }, // 🔄 Disabled state
          ]}
          textStyle={{
            color: buttonStates.isProceedEnabled
              ? 'white' // 🟢 Active white text
              : FBColorPalette.disabledInputText, // 🔄 Disabled gray text
          }}
          disabled={!buttonStates.isProceedEnabled}>
          Proceed
        </Button>
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
  headerContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
  },
  progressContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '48@vs',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '48@vs',
  },
  emptyStateIcon: {
    width: '64@s',
    height: '64@s',
    backgroundColor: '#F3F4F6',
    borderRadius: '32@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16@vs',
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
