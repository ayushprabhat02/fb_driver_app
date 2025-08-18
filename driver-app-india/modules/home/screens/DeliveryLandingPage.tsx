//dependencies
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Keyboard, RefreshControl, ScrollView, View} from 'react-native';
import {hasNotch} from 'react-native-device-info';
import {ScaledSheet} from 'react-native-size-matters';

//components
import {
  Button,
  Container,
  FocusAwareStatusBar,
  SwitchProfileHeader,
} from '@/components';

// service
import {requestAppPermissions} from '@/utils/general';

// store
import {deliveryStore, homeStore, userStore} from '@/globalStore';

import {UserService} from '@/services';
import {FBBackground} from '@/types/styles';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import CheckInBottomsheet from '../components/delivery/CheckInBottomsheet';
import OrderCard from '../components/delivery/OrderCard';
import OrderSummaryCard from '../components/delivery/OrderSummaryCard';

const DeliveryLandingPage: React.FC = () => {
  const navigatiion = useNavigation();
  const [checkBusinessLeadLoader, setCheckBusinessLeadLoader] =
    useState<boolean>(false);

  const images = [
    require('@/assets/delivery/Product-BANNER-1.jpg'),
    require('@/assets/delivery/Product-BANNER-2.jpg'),
    // require('@/assets/delivery/Product-BANNER-3.jpg'),
    require('@/assets/delivery/Product-BANNER-4.jpg'),
  ];
  const [refreshing, setRefreshing] = React.useState(false);
  const showRepeatOrder = homeStore.use.showRepeatOrder();
  const loggedInUser = userStore.use.loggedInUser();
  const deliveryStats = homeStore.use.deliveryStats();
  const selectedDate = deliveryStore.use.selectedDate();
  const selectedSlot = deliveryStore.use.selectedSlot();

  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();

  const scrollViewRef = useRef<ScrollView>(null);

  const checkInBottomSheetRef = useRef<BottomSheetModal>(null);

  const openCheckInBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    checkInBottomSheetRef.current?.present();
  }, []);

  const closeCheckInBottomSheet = useCallback(() => {
    checkInBottomSheetRef.current?.close();
  }, []);

  useEffect(() => {
    // This code runs once when the component mounts
    openCheckInBottomSheet();
  }, [openCheckInBottomSheet]);

  const scrollToOrderNow = () => {
    if (!showRepeatOrder) {
      scrollViewRef?.current?.scrollTo({x: 0, y: 100});
    } else {
      scrollViewRef?.current?.scrollTo({x: 0, y: 280});
    }
  };

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

  const handleCheckIn = () => {
    console.log('-----handleCheckIn------', handleCheckIn);
    navigatiion.navigate('checkin', {
      screen: 'check-in',
    });
    closeCheckInBottomSheet();
  };

  return (
    <View style={{flex: 1, backgroundColor: FBBackground.white}}>
      <FocusAwareStatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="dark-content"
      />

      <OrderSummaryCard />

      <View style={styles.headerContainer}>
        <SwitchProfileHeader />
      </View>
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
  button: {
    backgroundColor: FBBackground.blue,
    width: '92%',
    alignContent: 'center',
    alignSelf: 'center',
    marginBottom: '20@ms',
  },
});

export default DeliveryLandingPage;
