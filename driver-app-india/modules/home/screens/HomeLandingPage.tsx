//dependencies
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {RefreshControl, ScrollView, View} from 'react-native';
import {hasNotch} from 'react-native-device-info';
import {ScaledSheet} from 'react-native-size-matters';

//components
import {
  Button,
  Container,
  FocusAwareStatusBar,
  SwitchProfileHeader,
} from '@/components';
import CustomDateSelector from '../components/CustomDateSelector';
import {OrderListSkeleton} from '../components/SkeletonLoader';

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
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import OrderSummaryCard from '../components/delivery/OrderSummaryCard';
import homeService from '../services';
import {updateOrderQuantity} from '@/utils/orderUtil';

const HomeLandingPage: React.FC = () => {
  const navigation = useNavigation();
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
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentDriverOrder = orderStore.use.currentDriverOrder();

  const allFillupsCompleted = fillupHistory?.every(
    (item: any) => item.state === 'COMPLETE' || item.state === 'REJECTED',
  );

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
      scrollViewRef?.current?.scrollTo({x: 0, y: 0, animated: true});
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
        .catch(() => {});
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

  // Removed fillup completion alert as requested

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

      <ScrollView
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 10}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Container paddingHorizontal={16} style={{position: 'relative'}}>
          <OrderSummaryCard />
          <CustomDateSelector
            selectedDate={selectedDate}
            onDateChange={(date: Date) =>
              homeStore.setState(state => ({...state, selectedDate: date}))
            }
            style={{marginHorizontal: 0}}
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

      {/* Floating Buttons */}
      {(currentFillupOrder || currentDriverOrder) &&
        (allFillupsCompleted ||
          ((currentFillupOrder as any)?.fillup_requests &&
            (currentFillupOrder as any)?.fillup_requests.length > 0)) && (
          <View style={styles.floatingButtonsContainer}>
            <Button
              variant="solid"
              style={[styles.floatingButton, styles.navigationButton]}
              onPress={() => {
                // Handle navigation
                console.log('Navigation pressed');
              }}>
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
                updateOrderQuantity(currentOrder);
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
              }}>
              Start Trip
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
  startTripButton: {
    backgroundColor: '#10B981',
  },
});

export default HomeLandingPage;
