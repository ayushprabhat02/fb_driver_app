//dependencies
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';

//components
import {
  Container,
  FocusAwareStatusBar,
  SwitchProfileHeader,
  FloatingActionButtons,
} from '@/components';
import CustomDateSelector from '../components/CustomDateSelector';
import { OrderListSkeleton } from '../components/SkeletonLoader';

// service
import { requestAppPermissions } from '@/utils/general';

// store
import {
  checkinStore,
  deliveryStore,
  homeStore,
  orderStore,
  userStore,
} from '@/globalStore';

import { Task_State_Enum } from '@/generated/graphql';
import { OrderListCard } from '@/modules/order/delivery/components';
import { UserService } from '@/services';
import { FBBackground } from '@/types/styles';
import { useFocusEffect } from '@react-navigation/native';
import OrderSummaryCard from '../components/delivery/OrderSummaryCard';
import homeService from '../services';
import userService from '@/modules/user/services';
import { setupShiftValidation } from '@/utils/shiftValidation';

const HomeLandingPage: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [checkBusinessLeadLoader, setCheckBusinessLeadLoader] =
    useState<boolean>(false);
  const selectedDate = homeStore.use.selectedDate();
  const loggedInUser = userStore.use.loggedInUser();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const driverOrders = homeStore.use.driverOrders();
  const fillupHistory = homeStore.use.fillupHistory();
  const isLoadingOrder = homeStore.use.loaders().driverCurrentOrder;
  const isLoadingFillupHistory = homeStore.use.loaders().fillupHistory;
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const currentFillupOrder = orderStore.use.currentFillupOrder();

  const allFillupsCompleted = fillupHistory?.every(
    (item: any) => item.state === 'COMPLETE' || item.state === 'REJECTED',
  );

  const startLoader = homeStore.use.startLoader();
  const stopLoader = homeStore.use.stopLoader();

  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();

  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    requestAppPermissions().then(response => {
      if (response === 'granted') {
        // fetchCurrentLocation();
      }
    });
  }, []);

  const onRefresh = React.useCallback(() => {
    resetDeliveryStore();

    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef?.current?.scrollTo({ x: 0, y: 0, animated: true });
    }, []),
  );

  // Set up periodic validation only when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const cleanup = setupShiftValidation(driverVehicleId, intervalRef);
      return cleanup;
    }, [driverVehicleId]),
  );

  // checking if user business lead exists
  useEffect(() => {
    if (loggedInUser?.length) {
      UserService.checkIfUserExists({
        phone_number: loggedInUser[0]?.phone_number,
      })
        .then(response => {
          if (response.length === 3) {
            const businessOrg = response[0]?.organization_users.filter(
              orgUser => {
                return orgUser.organization?.is_business;
              },
            );
            if (
              businessOrg?.length &&
              !businessOrg[0]?.organization?.erp_code
            ) {
              polling();
            }
          }
        })
        .catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const polling = () => {
    setCheckBusinessLeadLoader(true);
    const timerID = setInterval(async () => {
      if (loggedInUser?.length) {
        await UserService.checkIfUserExists({
          phone_number: loggedInUser[0].phone_number,
        })
          .then(res => {
            if (res.length) {
              const businessOrg = res[0]?.organization_users.filter(orgUser => {
                return orgUser.organization?.is_business;
              });

              if (
                businessOrg?.length &&
                businessOrg[0]?.organization?.erp_code
              ) {
                clearInterval(timerID);
                setCheckBusinessLeadLoader(false);
              }
            }
          })
          .catch(() => {
            clearInterval(timerID);
            setCheckBusinessLeadLoader(false);
          });
      }
    }, 5000);
  };


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
      homeService
        .fetchOrderStatsForDriver({
          object: {
            driver_vehicle_id: driverVehicleId,
          },
        })
        .finally(() => {
          stopLoader('driverOrderStats');
        });
    }
  };

  // fetch driver orders api
  const fetchCurrentOrder = async (date?: Date) => {
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

    startLoader('driverCurrentOrder');
    return homeService
      .fetchDriverOrders({
        state: [
          Task_State_Enum.Cancelled,
          Task_State_Enum.CancellationRequested,
          Task_State_Enum.Delivered,
          Task_State_Enum.Rejected,
          Task_State_Enum.Schedule,
          Task_State_Enum.Rescheduled,
          Task_State_Enum.Open,
        ],
        limit: 10,
        offset: 0,
        driver_vehicle_id: driverVehicleId,
        start_date: startDateString,
        end_date: endDateString,
      })
      .finally(() => {
        stopLoader('driverCurrentOrder');
      });
  };

  const fetchFillupHistory = async () => {
    // Check if driverVehicleId is available before making API call
    if (!driverVehicleId) {
      console.warn(
        'Driver vehicle ID not available, skipping fillup history fetch',
      );
      return;
    }

    startLoader('fillupHistory');
    homeService
      .fetchFillupHistory({
        limit: 5,
        offset: 0,
        driver_vehicle_id: driverVehicleId,
      })
      .finally(() => {
        stopLoader('fillupHistory');
      });
  };

  useEffect(() => {
    fetchOrderStats()
    fetchMyProfile()
  }, [])

  useEffect(() => {
    fetchCurrentOrder();
    fetchFillupHistory();
  }, [driverVehicleId]);

  // Handle date changes with order preservation
  const handleDateChange = async (newDate: Date) => {
    // Store current selection to restore after API call
    const selectedOrderId = currentDriverOrder?.id || currentFillupOrder?.id;
    const selectedOrderType = currentDriverOrder ? 'driver' : currentFillupOrder ? 'fillup' : null;

    // Update date in store
    homeStore.setState(state => ({ ...state, selectedDate: newDate }));

    // Fetch new data and restore selection if order still exists
    if (driverVehicleId) {
      try {
        await fetchCurrentOrder(newDate);

        if (selectedOrderId && selectedOrderType) {
          // Try to restore selection from the new data
          const newDriverOrders = homeStore.getState().driverOrders;
          const matchingOrder = newDriverOrders?.find((order: any) => order.id === selectedOrderId);

          if (matchingOrder) {
            if (selectedOrderType === 'driver') {
              orderStore.setState(state => ({
                ...state,
                currentDriverOrder: matchingOrder,
                quantityToBeDispensed: matchingOrder?.customer_order?.customer_order_items[0]?.qty || 0,
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
                quantityToBeDispensed: 0,
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

  // Removed fillup completion alert as requested

  return (
    <View style={{ flex: 1, backgroundColor: FBBackground.white }}>
      <FocusAwareStatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="dark-content"
      />

      <View style={styles.headerContainer}>
        <SwitchProfileHeader />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Container paddingHorizontal={16} style={{ position: 'relative' }}>
          <OrderSummaryCard />
          <CustomDateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            isLoading={isLoadingOrder}
            style={{ marginHorizontal: 0 }}
          />
          <View>
            {driverOrders?.map((order, index) => {
              const isFillupOrder =
                (order as any)?.fillup_requests &&
                (order as any)?.fillup_requests.length > 0;
              const shouldDisable = !allFillupsCompleted && !isFillupOrder;

              return (
                <View
                  key={index}
                  style={{
                    opacity: shouldDisable ? 0.5 : 1,
                    pointerEvents: shouldDisable ? 'none' : 'auto',
                  }}>
                  <OrderListCard order={order} />
                </View>
              );
            })}
          </View>
        </Container>
        {(isLoadingOrder || isLoadingFillupHistory) && (
          <OrderListSkeleton count={3} />
        )}
      </ScrollView>

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
