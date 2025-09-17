//dependencies
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View, Alert, TouchableOpacity, Text } from 'react-native';
import { hasNotch } from 'react-native-device-info';
import { ScaledSheet } from 'react-native-size-matters';

//components
import {
  Button,
  Container,
  FocusAwareStatusBar,
  SwitchProfileHeader,
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

// order validation utilities
import {
  canSelectOrderTowerDriver,
  hasDispensingOrder,
  hasFillupOrder,
  formatDate,
  getStateColor,
  updateOrderQuantity,
  getPaymentInfo,
  calculateTotalQuantityDispensed,
  getCompletedDispensedAssets,
} from '@/modules/order/utils/orderValidation';

// live location tracking
import { startLiveLocationTracking } from '@/modules/order/utils/liveLocationTracking';

import { Task_State_Enum } from '@/generated/graphql';
import { OrderListCard } from '@/modules/order/delivery/components';
import { UserService } from '@/services';
import { FBBackground } from '@/types/styles';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import OrderSummaryCard from '../components/delivery/OrderSummaryCard';
import homeService from '../services';

const HomeLandingPage: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [checkBusinessLeadLoader, setCheckBusinessLeadLoader] = useState<boolean>(false);

  // State management hooks (using Zustand selectors per specification)
  const selectedDate = homeStore.use.selectedDate();
  const loggedInUser = userStore.use.loggedInUser();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const driverOrders = homeStore.use.driverOrders();
  const fillupHistory = homeStore.use.fillupHistory();
  const isLoadingOrder = homeStore.use.loaders().driverCurrentOrder;
  const isLoadingFillupHistory = homeStore.use.loaders().fillupHistory;
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentDriverOrder = orderStore.use.currentDriverOrder();

  // Order management state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [navigationLoading, setNavigationLoading] = useState<boolean>(false);
  const [continueOrderLoading, setContinueOrderLoading] = useState<boolean>(false);
  const [startTripLoading, setStartTripLoading] = useState<boolean>(false);

  // Get order store methods (using Zustand selectors)
  const setCurrentDriverOrder = orderStore.use.setCurrentDriverOrder();
  const setAllDriverOrders = orderStore.use.setAllDriverOrders();
  const setQuantityToBeDispensed = orderStore.use.setQuantityToBeDispensed();
  const setFuelDispensedTillNow = orderStore.use.setFuelDispensedTillNow();
  const setDispenseCompletedAssets = orderStore.use.setDispenseCompletedAssets();
  const markOrderInTransit = orderStore.use.markOrderInTransit();

  // Tower Driver App - All users are tower drivers
  console.log('🗼 Tower Driver App - All users are tower drivers');
  console.log('📝 Can select any order');
  console.log('🌍 Live location tracking enabled');
  console.log('🎥 Live streaming mode for dispensing');

  // Computed values
  const allFillupsCompleted = fillupHistory?.every(
    (item: any) => item.state === 'COMPLETE' || item.state === 'REJECTED',
  );

  const hasIncompleteFillupHistory = !allFillupsCompleted;
  const hasDispensingOrderValue = hasDispensingOrder(driverOrders || []);
  const hasFillupOrderValue = hasFillupOrder(driverOrders || []);

  const startLoader = homeStore.use.startLoader();
  const stopLoader = homeStore.use.stopLoader();
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  const scrollViewRef = useRef<ScrollView>(null);

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
      return;
    }

    const targetDate = date || selectedDate;
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    startLoader('driverCurrentOrder');
    homeService
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
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
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
    fetchOrderStats();
    fetchCurrentOrder();
    fetchFillupHistory();
  }, [driverVehicleId]);

  // Refetch orders when date changes
  useEffect(() => {
    if (driverVehicleId) {
      fetchCurrentOrder(selectedDate);
    }
  }, [selectedDate]);

  // Order selection logic (tower driver app - can select any order)
  const selectOrder = async (order: any) => {
    // Use tower driver validation (can select any order)
    const canSelect = canSelectOrderTowerDriver(order, driverOrders || [], navigationLoading, continueOrderLoading, refreshing, startTripLoading);

    if (!canSelect) {
      Alert.alert('Cannot Select Order', 'This order cannot be selected at this time.');
      return;
    }

    setSelectedOrder(order);
    setCurrentDriverOrder(order);

    // Update quantity based on order type
    updateOrderQuantity(order, orderStore);

    // Update store with calculated values
    const assets = order?.customer_order?.customer_order_customer_assets || [];
    const totalQuantityDispensed = calculateTotalQuantityDispensed(assets);
    const completedAssets = getCompletedDispensedAssets(assets);

    setFuelDispensedTillNow(totalQuantityDispensed);
    setDispenseCompletedAssets(completedAssets);

    console.log('🎯 Selected order:', order.id, 'Category:', order.category, 'State:', order.state);
  };

  // Start Navigation
  const startNavigation = async () => {
    if (!selectedOrder || !canSelectOrderTowerDriver(selectedOrder, driverOrders || [], navigationLoading, continueOrderLoading, refreshing, startTripLoading)) {
      return;
    }

    setNavigationLoading(true);

    try {
      setCurrentDriverOrder(selectedOrder);
      updateOrderQuantity(selectedOrder, orderStore);

      // Navigate to appropriate screen
      // @ts-ignore
      navigation.navigate('order', {
        screen: 'navigation',
      });
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setNavigationLoading(false);
    }
  };

  // Continue Order
  const continueOrder = async () => {
    const order = selectedOrder;
    if (!order || order.state !== 'DISPENSING') {
      return;
    }

    setContinueOrderLoading(true);

    try {
      setCurrentDriverOrder(order);
      updateOrderQuantity(order, orderStore);

      // Tower drivers always go to live streaming for dispensing
      // @ts-ignore
      navigation.navigate('order', { screen: 'live-stream' });
    } catch (error) {
      console.error('Continue order error:', error);
    } finally {
      setContinueOrderLoading(false);
    }
  };

  // Start Trip (tower driver logic)
  const startTrip = async () => {
    const order = selectedOrder || currentDriverOrder;
    if (!order) {
      return;
    }

    const estimatedDeliveryDate = order?.customer_order?.customer_order_items[0]?.estimate_delivery_date;

    // Start live location tracking for today's orders
    if (estimatedDeliveryDate) {
      const today = new Date().toISOString().split('T')[0];
      const orderDate = new Date(estimatedDeliveryDate).toISOString().split('T')[0];

      if (orderDate === today) {
        console.log('🌍 Starting live location tracking');
        try {
          await startLiveLocationTracking();
        } catch (error) {
          console.error('❌ Failed to start live location tracking:', error);
        }
      }
    }

    setStartTripLoading(true);

    try {
      // Ensure currentDriverOrder is set in store before routing
      setCurrentDriverOrder(order);

      // Update quantity to be dispensed based on selected order
      updateOrderQuantity(order, orderStore);

      // Update order state if needed
      const isAssigned = order.state === 'ASSIGNED';
      if (isAssigned) {
        const success = await markOrderInTransit(order.id);
        if (!success) {
          Alert.alert('Error', 'Unable to update order state to In Transit');
          return;
        }
      }

      // Route based on order category and state
      handleOrderNavigation(order);
    } catch (error) {
      console.error('Start trip error:', error);
      Alert.alert('Error', 'Unable to start trip');
    } finally {
      setStartTripLoading(false);
    }
  };

  // Handle order navigation (tower driver specific)
  const handleOrderNavigation = async (order: any) => {
    try {
      const { state, category } = order;

      if (category === 'DELIVERY') {
        if (state === 'DISPENSING') {
          // Tower drivers always go to live streaming for dispensing
          // @ts-ignore
          navigation.navigate('order', { screen: 'live-stream' });
          return;
        }

        // For delivery orders, always route to choose asset (customer tests exempted)
        // @ts-ignore
        navigation.navigate('order', { screen: 'choose-asset' });
      } else if (category === 'FILL_UP') {
        if (state === 'DISPENSING' || state === 'ARRIVED') {
          // @ts-ignore
          navigation.navigate('address', { screen: 'fill-asset' });
          return;
        }

        // @ts-ignore
        navigation.navigate('address', { screen: 'health-checks-fillup' });
      }
    } catch (error) {
      console.error('Order navigation error:', error);
      // Fallback navigation
      if (order.category === 'DELIVERY') {
        // @ts-ignore
        navigation.navigate('order', { screen: 'choose-asset' });
      } else {
        // @ts-ignore
        navigation.navigate('address', { screen: 'health-checks-fillup' });
      }
    }
  };

  // Refetch orders when date changes

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
        {/* Tower Driver App Indicator */}
        <View style={{
          backgroundColor: '#8B5CF6',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          alignSelf: 'center',
          marginTop: 8,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            🗼 TOWER DRIVER APP
          </Text>
        </View>
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
            onDateChange={(date: Date) =>
              homeStore.setState(state => ({ ...state, selectedDate: date }))
            }
            style={{ marginHorizontal: 0 }}
          />
          <View>
            {driverOrders?.map((order, index) => {
              // Use tower driver validation
              const canSelect = canSelectOrderTowerDriver(order, driverOrders || [], navigationLoading, continueOrderLoading, refreshing, startTripLoading);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <TouchableOpacity
                  key={index}
                  style={{
                    opacity: !canSelect ? 0.5 : 1,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? '#8B5CF6' : 'transparent', // Purple theme
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: isSelected ? '#F3F4F6' : 'transparent',
                  }}
                  onPress={() => canSelect && selectOrder(order)}
                  disabled={!canSelect}>
                  <OrderListCard order={order} />
                  {/* Selected indicator */}
                  {isSelected && (
                    <View style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: '#8B5CF6',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>SELECTED</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Container>
        {(isLoadingOrder || isLoadingFillupHistory) && (
          <OrderListSkeleton count={3} />
        )}
      </ScrollView>

      {/* Action Buttons */}
      {selectedOrder && canSelectOrderTowerDriver(selectedOrder, driverOrders || [], navigationLoading, continueOrderLoading, refreshing, startTripLoading) && (
        <View style={styles.floatingButtonsContainer}>
          {/* Navigation Button */}
          <Button
            variant="solid"
            style={[styles.floatingButton, styles.navigationButton]}
            onPress={startNavigation}
            disabled={navigationLoading || startTripLoading}>
            {navigationLoading ? 'Loading...' : 'Navigation'}
          </Button>

          {/* Start Trip or Continue Order Button */}
          {selectedOrder.state === 'DISPENSING' ? (
            <Button
              variant="solid"
              style={[styles.floatingButton, styles.dispensingButton]}
              onPress={continueOrder}
              disabled={continueOrderLoading || startTripLoading}>
              {continueOrderLoading ? 'Loading...' : 'Live Stream'}
            </Button>
          ) : (
            <Button
              variant="solid"
              style={[styles.floatingButton, styles.startTripButton]}
              onPress={startTrip}
              disabled={startTripLoading || navigationLoading}>
              {startTripLoading ? 'Loading...' : 'Start Trip'}
            </Button>
          )}
        </View>
      )}

      {/* Fallback buttons for current orders (if no order selected) */}
      {!selectedOrder && (currentFillupOrder || currentDriverOrder) && (
        <View style={styles.floatingButtonsContainer}>
          <Button
            variant="solid"
            style={[styles.floatingButton, styles.navigationButton]}
            onPress={() => {
              console.log('Navigation pressed for current order');
            }}
            disabled={startTripLoading}>
            Navigation
          </Button>
          <Button
            variant="solid"
            style={[styles.floatingButton, styles.startTripButton]}
            onPress={() => {
              const currentOrder = currentFillupOrder || currentDriverOrder;
              const isFillupOrder =
                (currentFillupOrder as any)?.fillup_requests &&
                (currentFillupOrder as any)?.fillup_requests.length > 0;
              // update dispense quantity
              updateOrderQuantity(currentOrder, orderStore);
              if (isFillupOrder) {
                // @ts-ignore
                navigation.navigate('address', {
                  screen: 'fill-asset',
                });
              } else {
                // @ts-ignore
                navigation.navigate('order', {
                  screen: 'choose-asset',
                });
              }
            }}
            disabled={startTripLoading}>
            {startTripLoading ? 'Loading...' : 'Start Trip'}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  body: {},

  headerContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 10,
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
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: '20@vs',
    left: '20@s',
    right: '20@s',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  floatingButton: {
    flex: 1,
    marginHorizontal: '5@s',
    borderRadius: '25@s',
    paddingVertical: '12@vs',
  },
  navigationButton: {
    backgroundColor: '#3B82F6',
  },
  dispensingButton: {
    backgroundColor: '#8B5CF6', // Purple for dispensing/live stream
  },
  startTripButton: {
    backgroundColor: '#10B981',
  },
});

export default HomeLandingPage;