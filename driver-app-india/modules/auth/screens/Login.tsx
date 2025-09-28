// dependencies
import {Dimensions, Image} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
// import LottieView from 'lottie-react-native';
import FuelBuddyVueLogo from '@/assets/branding/fuelbuddy-vue-logo.svg';

//components
import {LoginForm} from '../components';

// stores
import {
  addressStore,
  // assetStore, // Asset module deleted
  authStore,
  deliveryStore,
  homeStore,
  orderStore,
  userStore,
  checkinStore,
} from '@/globalStore';

// types
import {AuthStackParamList} from '../navigator';
import {View} from 'react-native';
import {FocusAwareStatusBar} from '@/components';

export type Props = StackScreenProps<AuthStackParamList, 'login'>;

const Login: React.FC<Props> = ({navigation}: Props) => {
  const resetFillupStore = addressStore.use.resetFillupStore();
  const resetAuthStore = authStore.use.resetAuthStore();
  // const resetAssetStore = assetStore.use.resetAssetStore(); // Asset module deleted
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  const resetHomeStore = homeStore.use.resetHomeStore();
  const resetOrderStore = orderStore.use.resetOrderStore();
  const resetUserStore = userStore.use.resetUserStore();
  const resetCheckinStore = checkinStore.use.resetCheckinStore();
  // import second from '@/assets/auth/login-banner.png'
  useEffect(() => {
    // need to reset all stores before user logs in
    resetFillupStore();
    resetAuthStore();
    // resetAssetStore(); // Asset module deleted
    resetDeliveryStore();
    resetHomeStore();
    resetOrderStore();
    resetUserStore();
    resetCheckinStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <View style={{flex: 1, position: 'relative', alignItems: 'center'}}>
      <FocusAwareStatusBar barStyle={'light-content'} />
      <View
        style={{
          width: 300,
          height: 120,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 80,
        }}>
        <FuelBuddyVueLogo width={200} height={200} />
      </View>

      <LoginForm
      // navigation={navigation}
      // route={{name: 'login', key: '_login'}}
      />
    </View>
  );
};

export default Login;
