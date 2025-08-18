import {View, FlatList, ScrollView, RefreshControl} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {DateTime} from 'luxon';

// services
import OrderService from '../../services';
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// store
import orderStore from '../../store';

// components
import {
  Divider,
  FocusAwareStatusBar,
  FullScreenLoader,
  HeaderAvoidingContainer,
} from '@/components';
import {
  OrderFilter,
  OrderListCard,
  OrderListCardSkeleton,
  OrderSearchBar,
} from '../components';
import {NoStats} from '@/modules/home/components/delivery';

// data
import {deliveryOrderFilter, DeliveryOrderFilterTypes} from '../data';
import {businessStore, deliveryStore} from '@/globalStore';
import {getBusinessRole} from '@/utils/general';
import OrderListCardUpcoming from '../components/OrderListCardUpcoming';

const MyOrders: React.FC = () => {
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [orderCode, setOrderCode] = useState<string>('');
  const currentOrdersInView = orderStore.use.currentOrdersInView();
  const currentOrdersInViewOffset = orderStore.use.currentOrdersInViewOffset();
  const allOrdersCount = orderStore.use.allOrdersCount();
  const currentOrdersInViewHasMoreOrders =
    orderStore.use.currentOrdersInViewHasMoreOrders();
  const resetOrderPagination = orderStore.use.resetOrderPagination();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const loaders = orderStore.use.loaders();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();
  const upComingOrders = orderStore.use.upcomingOrders();
  const [currentFilterState, setCurrentFilterState] = useState<string>();
  const isOwner = activeDeliveryOrgUser?.is_owner;
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isUpcomingOrdersLoading, setIsUpcomingOrdersLoading] = useState(false);
  const shouldShowUpcomingInitially =
    isOwner &&
    activeDeliveryOrgUser?.organization?.is_otp_required_placed_order;
  const [activeFilter, setActiveFilter] = useState<DeliveryOrderFilterTypes>(
    shouldShowUpcomingInitially ? 'UPCOMING' : 'ALL',
  );
  const [fetching, setFetching] = useState(false);

  const changeFilter = async (filter: DeliveryOrderFilterTypes) => {
    setOrderCode('');
    resetOrderPagination();
    setActiveFilter(filter);
    if (filter !== 'UPCOMING') {
      fetchOrders(filter);
    } else {
      fetchUpcomingOrders();
    }
  };

  const hasNextPage = () => {
    if (
      !currentOrdersInViewHasMoreOrders ||
      fetching ||
      activeFilter === 'UPCOMING'
    ) {
      return;
    }
    setFetching(true);
    const updatedOffset = currentOrdersInViewOffset + 10;
    orderStore.setState(state => ({
      ...state,
      currentOrdersInViewOffset: updatedOffset,
    }));
    fetchOrders(activeFilter);
  };

  const fetchOrders = useCallback(
    (filter: DeliveryOrderFilterTypes = 'ALL') => {
      if (filter === 'UPCOMING') {
        return;
      }
      startLoader('currentOrdersInView');
      deliveryStore.setState(state => ({
        ...state,
        isError: [],
      }));

      setCurrentFilterState(
        deliveryOrderFilter?.find(item => item.value === filter)?.states,
      );

      OrderService.getDeliveryOrdersByState({
        limit: 10,
        offset: currentOrdersInViewOffset,
        organization_user_id: getActiveDelOrgUserId(),
        state: deliveryOrderFilter.find(item => item.value === filter)?.states,
      })
        .then(response => {
          if (filter === 'ALL') {
            orderStore.setState(state => ({
              ...state,
              allOrdersCount:
                response.customer_order_aggregate.aggregate?.count,
            }));
          }
        })
        .finally(() => {
          stopLoader('currentOrdersInView');
          setFetching(false);
        });
    },
    [currentOrdersInViewOffset],
  );

  const fetchUpcomingOrders = async () => {
    if (activeFilter !== 'UPCOMING') {
      return;
    }
    try {
      setIsUpcomingOrdersLoading(true);
      await OrderService.fetchOrganizationUpcomingOrders({
        organization_id: activeDeliveryOrgUser?.organization_id,
      });
    } catch (error) {
      console.error('Error fetching upcoming orders:', error);
    } finally {
      setIsUpcomingOrdersLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeFilter !== 'UPCOMING') {
        resetOrderPagination();
        fetchOrders(activeFilter);
      } else {
        fetchUpcomingOrders();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setOrderCode('');
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    resetOrderPagination();
    if (activeFilter !== 'UPCOMING') {
      fetchOrders(activeFilter);
    } else {
      fetchUpcomingOrders();
    }
    setRefreshing(false);
  }, [activeFilter]);

  const filteredDeliveryOrderFilters = useMemo(() => {
    const showUpcoming =
      isOwner &&
      activeDeliveryOrgUser?.organization?.is_otp_required_placed_order;

    const baseFilters = deliveryOrderFilter.filter(filter =>
      showUpcoming ? true : filter.value !== 'UPCOMING',
    );

    if (showUpcoming) {
      const upcomingFilter = baseFilters.find(f => f.value === 'UPCOMING');
      const allFilterIndex = baseFilters.findIndex(f => f.value === 'ALL');
      const filtersWithoutAll = baseFilters.filter(f => f.value !== 'ALL');

      const newFilters = [];
      if (allFilterIndex !== -1) {
        newFilters.push(baseFilters[allFilterIndex]);
      }
      if (upcomingFilter) {
        newFilters.push(upcomingFilter);
      }
      newFilters.push(...filtersWithoutAll);

      return newFilters.filter(
        (filter, index, self) =>
          index === self.findIndex(f => f.value === filter.value),
      );
    }

    return baseFilters;
  }, [isOwner, activeDeliveryOrgUser]);

  useEffect(() => {
    if (
      isOwner &&
      activeDeliveryOrgUser?.organization?.is_otp_required_placed_order &&
      activeFilter === 'UPCOMING'
    ) {
      fetchUpcomingOrders();
    }
  }, [isOwner, activeDeliveryOrgUser, activeFilter]);

  // const filteredUpcomingOrdersBeforeExpire = useMemo(() => {
  //   const now = DateTime.now().setZone('Asia/Kolkata');
  //   return upComingOrders?.filter(order => {
  //     const orderTime = DateTime.fromISO(order?.order_date).setZone(
  //       'Asia/Kolkata',
  //     );
  //     return orderTime.diffNow('minutes').minutes >= -5;
  //   });
  // }, [upComingOrders]);

  const filteredUpcomingOrdersBeforeExpire = useMemo(() => {
    const now = DateTime.now().setZone('Asia/Kolkata');
    return upComingOrders
      ?.filter(order => {
        const orderTime = DateTime.fromISO(order?.order_date).setZone(
          'Asia/Kolkata',
        );
        return orderTime.diffNow('minutes').minutes >= -5;
      })
      .sort((a, b) => {
        // Sort in descending order (most recent first)
        return (
          DateTime.fromISO(b.order_date).toMillis() -
          DateTime.fromISO(a.order_date).toMillis()
        );
      });
  }, [upComingOrders]);

  return (
    <HeaderAvoidingContainer>
      <FocusAwareStatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="dark-content"
      />

      <View style={{flex: 1, paddingBottom: 4}}>
        <View>
          {/* filters */}
          <OrderFilter
            filters={filteredDeliveryOrderFilters}
            activeFilter={activeFilter}
            changeFilter={changeFilter}
          />
        </View>

        {allOrdersCount > 0 && activeFilter !== 'UPCOMING' ? (
          <OrderSearchBar orderCode={orderCode} setOrderCode={setOrderCode} />
        ) : null}

        {/* Orders list */}
        {loaders.currentOrdersInView || isUpcomingOrdersLoading ? (
          <OrderListCardSkeleton />
        ) : (allOrdersCount > 0 && activeFilter !== 'UPCOMING') ||
          (activeFilter === 'UPCOMING' &&
            filteredUpcomingOrdersBeforeExpire?.length > 0) ? (
          <View style={{flex: 1}}>
            <Divider height={10} />
            <FlatList
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
              data={
                activeFilter === 'UPCOMING'
                  ? filteredUpcomingOrdersBeforeExpire
                  : currentOrdersInView
              }
              onEndReached={hasNextPage}
              renderItem={({item}) =>
                activeFilter === 'UPCOMING' ? (
                  <OrderListCardUpcoming order={item} />
                ) : (
                  <OrderListCard order={item} />
                )
              }
              keyExtractor={item => item?.id || item?.order_id}
              ItemSeparatorComponent={Divider}
              ListFooterComponent={
                loaders.currentOrdersInView && activeFilter !== 'UPCOMING' ? (
                  <OrderListCardSkeleton />
                ) : null
              }
            />
          </View>
        ) : (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            }}>
            <ScrollView
              style={{height: '60%', marginTop: 20}}
              showsVerticalScrollIndicator={false}>
              <NoStats
                onOrderNow={() => {
                  navigation.navigate('home', {screen: 'home-tab'});
                }}
              />
            </ScrollView>
          </View>
        )}
      </View>
      <FullScreenLoader
        showLoader={loaders.currentOrdersInView || isUpcomingOrdersLoading}
        loaderText={
          loaders.currentOrdersInView
            ? 'Fetching your orders'
            : isUpcomingOrdersLoading
            ? 'Fetching upcoming orders'
            : 'Loading'
        }
      />
    </HeaderAvoidingContainer>
  );
};

export default MyOrders;
