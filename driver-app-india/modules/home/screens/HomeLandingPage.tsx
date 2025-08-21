//dependencies
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import {hasNotch} from 'react-native-device-info';
import {ScaledSheet} from 'react-native-size-matters';

//components
import {
  Container,
  FocusAwareStatusBar,
  FullScreenLoader,
  SwitchProfileHeader,
  Button,
} from '@/components';

// service
import {requestAppPermissions} from '@/utils/general';

// store
import {
  checkinStore,
  deliveryStore,
  homeStore,
  userStore,
  orderStore,
} from '@/globalStore';

import {UserService} from '@/services';
import {FBBackground} from '@/types/styles';
import {useFocusEffect} from '@react-navigation/native';
import homeService from '../services';
import {Task_State_Enum} from '@/generated/graphql';
import OrderSummaryCard from '../components/delivery/OrderSummaryCard';
import {OrderListCard} from '@/modules/order/delivery/components';

const HomeLandingPage: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [checkBusinessLeadLoader, setCheckBusinessLeadLoader] =
    useState<boolean>(false);
  const loggedInUser = userStore.use.loggedInUser();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const driverOrders = homeStore.use.driverOrders();
  const fillupHistory = homeStore.use.fillupHistory();
  const isLoadingOrder = homeStore.use.loaders().driverCurrentOrder;
  const isLoadingFillupHistory = homeStore.use.loaders().fillupHistory;
  const selectedOrder = orderStore.use.selectedOrder();

  console.log('----selectedOrder------', selectedOrder);

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
  const fetchCurrentOrder = async () => {
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
        start_date: new Date('2025-08-18').toISOString(),
        end_date: new Date('2025-08-20').toISOString(),
      })
      .finally(() => {
        stopLoader('driverCurrentOrder');
      });
  };

  const fetchFillupRequest = async () => {
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
    fetchFillupRequest();
  }, [driverVehicleId]);

  useEffect(() => {
    if (fillupHistory?.length > 0 && !allFillupsCompleted) {
      Alert.alert('Warning', 'Please complete fillup first');
    }
  }, [fillupHistory, allFillupsCompleted]);

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
        <Container paddingHorizontal={10} style={{position: 'relative'}}>
          <OrderSummaryCard />
          <View
            style={{
              opacity: allFillupsCompleted ? 1 : 0.5,
              pointerEvents: allFillupsCompleted ? 'auto' : 'none',
            }}>
            {driverOrders?.map((order, index) => (
              <OrderListCard key={index} order={order} />
            ))}
          </View>
        </Container>
        <FullScreenLoader
          showLoader={isLoadingOrder || isLoadingFillupHistory}
        />
      </ScrollView>

      {/* Floating Buttons */}
      {selectedOrder && allFillupsCompleted && (
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
              // Handle start trip
              console.log('Start trip pressed');
            }}>
            Start Trip
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  body: {
    flex: '1@mvs',
    width: '100%',
    position: 'relative',
    marginTop: hasNotch() ? 115 : 100,
  },

  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 0,
    width: '100%',
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
