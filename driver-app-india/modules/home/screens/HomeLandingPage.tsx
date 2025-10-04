//dependencies
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  FlatList,
  ListRenderItem,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

//components
import {
  Container,
  FocusAwareStatusBar,
  SwitchProfileHeader,
  FloatingActionButtons,
  Text,
} from '@/components';
import CustomDateSelector from '../components/CustomDateSelector';
import {OrderListSkeleton} from '../components/SkeletonLoader';
import OrderValidationAlert from '../components/OrderValidationAlert';
import {getOrderValidationState} from '@/utils/orderValidation';

// service
import {requestAppPermissions} from '@/utils/general';

// store
import {
  checkinStore,
  deliveryStore,
  homeStore,
  orderStore,
  userStore,
} from '@/globalStore';

import {Task_State_Enum} from '@/generated/graphql';
import {OrderListCard} from '@/modules/order/delivery/components';
import {UserService} from '@/services';
import {FBBackground} from '@/types/styles';
import {useFocusEffect} from '@react-navigation/native';
import OrderSummaryCard from '../components/delivery/OrderSummaryCard';
import homeService from '../services';
import userService from '@/modules/user/services';
import fillupService from '@/modules/fillupRequest/services';
import fillupStore from '@/modules/fillupRequest/store';

const HomeLandingPage: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const selectedDate = homeStore.use.selectedDate();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const driverOrders = homeStore.use.driverOrders();
  const fillupHistory = fillupStore.use.activeFillupHistory();
  const isLoadingOrder = homeStore.use.loaders().driverCurrentOrder;
  const isLoadingFillupHistory =
    fillupStore.use.loaders().fetchActiveFillupHistory;
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const currentFillupOrder = orderStore.use.currentFillupOrder();

  const allFillupsCompleted = fillupHistory?.every(
    (item: any) => item.state === 'COMPLETE' || item.state === 'REJECTED',
  );

  const startLoader = homeStore.use.startLoader();
  const stopLoader = homeStore.use.stopLoader();
  const startFillupLoader = fillupStore.use.startLoader();
  const stopFillupLoader = fillupStore.use.stopLoader();

  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    requestAppPermissions().then(response => {
      if (response === 'granted') {
        // fetchCurrentLocation();
      }
    });
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setCurrentOffset(0);
    setHasMoreData(true);
    resetDeliveryStore();

    try {
      if (driverVehicleId) {
        await fetchCurrentOrder(selectedDate, 0, false);
        await fetchActiveFillupCheck();
        await fetchOrderStats();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverVehicleId, selectedDate]);

  const loadMoreOrders = async () => {
    if (isLoadingMore || !hasMoreData || !driverVehicleId) {
      return;
    }

    const newOffset = currentOffset + 5;
    try {
      await fetchCurrentOrder(selectedDate, newOffset, true);
      setCurrentOffset(newOffset);
    } catch (error) {
      console.error('Error loading more orders:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      flatListRef?.current?.scrollToOffset({offset: 0, animated: true});
    }, []),
  );


  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshDataOnFocus = async () => {
        if (driverVehicleId) {
          try {
            // Call APIs when screen focuses - reject old fillup requests first
            // await rejectOldFillupRequests();

            // Call remaining APIs in parallel
            await Promise.all([
              fetchCurrentOrder(selectedDate, 0, false),
              fetchActiveFillupCheck(),
              fetchOrderStats(),
            ]);
          } catch (error) {
            console.error('Error refreshing data on focus:', error);
          }
        }
      };

      refreshDataOnFocus();
    }, [driverVehicleId, selectedDate]),
  );

  const fetchMyProfile = async () => {
    try {
      await userService.fetchMyProfile();
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  /**
   * @description: fetch order stats for driver
   */
  const fetchOrderStats = async () => {
    if (driverVehicleId) {
      startLoader('driverOrderStats');
      // Create start and end dates for the full day in UTC
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();

      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0)); // 00:00:00.000 UTC
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999)); // 23:59:59.999 UTC

      homeService
        .fetchOrderStatsForDriverV3({
          driver_vehicle_id: driverVehicleId,
          start_date: startOfDay.toISOString(),
          end_date: endOfDay.toISOString(),
        })
        .finally(() => {
          stopLoader('driverOrderStats');
        });
    }
  };

  // fetch driver orders api
  const fetchCurrentOrder = async (
    date?: Date,
    offset: number = 0,
    isLoadMore: boolean = false,
  ) => {
    // Check if driverVehicleId is available before making API call
    if (!driverVehicleId) {
      console.warn('Driver vehicle ID not available, skipping order fetch');
      return Promise.resolve();
    }

    const targetDate = date || selectedDate;

    // Format dates without timezone conversion (matching Vue.js implementation)
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    const startDateString = `${year}-${month}-${day}T00:00:00`;
    const endDateString = `${year}-${month}-${day}T23:59:59`;

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      startLoader('driverCurrentOrder');
    }

    try {
      const response = await homeService.fetchDriverOrders({
        state: [
          Task_State_Enum.Cancelled,
          Task_State_Enum.CancellationRequested,
          Task_State_Enum.Delivered,
          Task_State_Enum.Rejected,
          Task_State_Enum.Schedule,
          Task_State_Enum.Rescheduled,
          Task_State_Enum.Open,
        ],
        limit: 5,
        offset: offset,
        driver_vehicle_id: driverVehicleId,
        start_date: startDateString,
        end_date: endDateString,
      });

      // Check if we have more data
      if (response && Array.isArray(response) && response.length < 5) {
        setHasMoreData(false);
      } else {
        setHasMoreData(true);
      }

      return response;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        stopLoader('driverCurrentOrder');
      }
    }
  };

  const rejectOldFillupRequests = async () => {
    try {
      // Calculate cutoff time (24 hours ago)
      const cutoffTime = new Date();
      cutoffTime.setTime(cutoffTime.getTime() - 24 * 60 * 60 * 1000);

      // Format as local timestamp for API (YYYY-MM-DD HH:MM:SS)
      const year = cutoffTime.getFullYear();
      const month = String(cutoffTime.getMonth() + 1).padStart(2, '0');
      const day = String(cutoffTime.getDate()).padStart(2, '0');
      const hours = String(cutoffTime.getHours()).padStart(2, '0');
      const minutes = String(cutoffTime.getMinutes()).padStart(2, '0');
      const seconds = String(cutoffTime.getSeconds()).padStart(2, '0');

      const localTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      await fillupService.rejectOldFillupRequests({
        cutoff_time: localTimestamp,
      });
    } catch (error) {
      console.error('Error rejecting old fillup requests:', error);
    }
  };

  const fetchActiveFillupCheck = async () => {
    // Check if driverVehicleId is available before making API call
    if (!driverVehicleId) {
      console.warn(
        'Driver vehicle ID not available, skipping active fillup check',
      );
      return;
    }

    startFillupLoader('fetchActiveFillupHistory');
    fillupService
      .fetchActiveFillupCheck({
        limit: 5,
        offset: 0,
        driver_vehicle_id: driverVehicleId,
      })
      .finally(() => {
        stopFillupLoader('fetchActiveFillupHistory');
      });
  };

  useEffect(() => {
    fetchMyProfile();
    rejectOldFillupRequests();
  }, []);

  // useEffect(() => {
  //   const initializeDashboard = async () => {
  //     await fetchCurrentOrder();
  //     await fetchActiveFillupCheck();
  //   };

  //   initializeDashboard();
  // }, [driverVehicleId]);

  // Handle date changes with order preservation
  const handleDateChange = async (newDate: Date) => {
    // Store current selection to restore after API call
    const selectedOrderId = currentDriverOrder?.id || currentFillupOrder?.id;
    const selectedOrderType = currentDriverOrder
      ? 'driver'
      : currentFillupOrder
      ? 'fillup'
      : null;

    // Reset pagination state
    setCurrentOffset(0);
    setHasMoreData(true);

    // Update date in store
    homeStore.setState(state => ({...state, selectedDate: newDate}));

    // Fetch new data and restore selection if order still exists
    if (driverVehicleId) {
      try {
        await fetchCurrentOrder(newDate, 0, false);

        if (selectedOrderId && selectedOrderType) {
          // Try to restore selection from the new data
          const newDriverOrders = homeStore.getState().driverOrders;
          const matchingOrder = newDriverOrders?.find(
            (order: any) => order.id === selectedOrderId,
          );

          if (matchingOrder) {
            if (selectedOrderType === 'driver') {
              orderStore.setState(state => ({
                ...state,
                currentDriverOrder: matchingOrder,
              }));
            } else if (selectedOrderType === 'fillup') {
              orderStore.setState(state => ({
                ...state,
                currentFillupOrder: matchingOrder,
              }));
            }
          } else {
            // Order not found in new date, clear selection
            if (selectedOrderType === 'driver') {
              orderStore.setState(state => ({
                ...state,
                currentDriverOrder: null,
              }));
            } else if (selectedOrderType === 'fillup') {
              orderStore.setState(state => ({
                ...state,
                currentFillupOrder: null,
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    }
  };

  // Render order item for FlatList
  const renderOrderItem: ListRenderItem<any> = ({item: order}) => {
    const isFillupOrder =
      (order as any)?.fillup_requests &&
      (order as any)?.fillup_requests.length > 0;
    const shouldDisable = !allFillupsCompleted && !isFillupOrder;

    // Create a refresh callback that calls fetchCurrentOrder with current selectedDate
    const handleRefreshOrders = async () => {
      await fetchCurrentOrder(selectedDate, 0, false);
      await fetchOrderStats();
    };

    return (
      <Container paddingHorizontal={16}>
        <View
          style={{
            opacity: shouldDisable ? 0.5 : 1,
            pointerEvents: shouldDisable ? 'none' : 'auto',
          }}>
          <OrderListCard order={order} onRefreshOrders={handleRefreshOrders} />
        </View>
      </Container>
    );
  };

  // Render FlatList header (empty since we moved static content out)
  const renderHeader = () => null;

  // Render FlatList footer
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={{padding: 20, alignItems: 'center'}}>
          <Text>Loading more orders...</Text>
        </View>
      );
    }
    if (!hasMoreData && driverOrders?.length > 0) {
      return (
        <View style={{padding: 20, alignItems: 'center'}}>
          <Text>No more orders to load</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={{flex: 1, backgroundColor: FBBackground.white}}>
      <FocusAwareStatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="dark-content"
      />

      <View style={styles.headerContainer}>
        <SwitchProfileHeader />
      </View>

      {/* Static Content - OrderSummary and DateSelector */}
      <Container paddingHorizontal={16} style={{position: 'relative'}}>
        <OrderSummaryCard />
        <CustomDateSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          isLoading={isLoadingOrder}
          style={{marginHorizontal: 0}}
        />
      </Container>

      {/* Order Validation Alerts */}
      {driverOrders && driverOrders.length > 0 && (
        <OrderValidationAlert
          {...getOrderValidationState(driverOrders, fillupHistory || [])}
        />
      )}

      {/* Orders FlatList */}
      {(isLoadingOrder || isLoadingFillupHistory || refreshing) && (
        <Container paddingHorizontal={16}>
          <OrderListSkeleton count={3} />
        </Container>
      )}

      <FlatList
        ref={flatListRef}
        data={
          isLoadingOrder || isLoadingFillupHistory || refreshing
            ? []
            : driverOrders || []
        }
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 100}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <Container paddingHorizontal={16}>
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text>No orders found for this date</Text>
            </View>
          </Container>
        )}
        style={{flex: 1}}
      />

      {/* Floating Action Buttons */}
      <FloatingActionButtons />
    </View>
  );
};

const styles = ScaledSheet.create({
  body: {},

  headerContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 10,
    // top: 0,
    // left: 0,
    // paddingHorizontal: 16,
    // paddingTop: 10,
    // zIndex: 0,
    // width: '100%',
  },
  image: {
    width: '310@s',
    height: '120@ms',
    marginVertical: '5@vs',
    borderRadius: '10@ms',
  },
  containerCenter: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default HomeLandingPage;
