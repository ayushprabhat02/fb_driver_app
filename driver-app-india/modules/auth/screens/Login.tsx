// dependencies
import {Dimensions, StyleSheet, Image} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
// import LottieView from 'lottie-react-native';
import FuelBuddyLogo from '@/assets/branding/fuelbuddy-full.svg';

//components
import {LoginForm} from '../components';

// stores
import {
  addressStore,
  assetStore,
  authStore,
  businessStore,
  deliveryStore,
  homeStore,
  orderStore,
  userStore,
  walletStore,
  checkinStore,
} from '@/globalStore';

// types
import {AuthStackParamList} from '../navigator';
import {View} from 'react-native';
import {FBBorders} from '@/types/styles';
import {FocusAwareStatusBar} from '@/components';

export type Props = StackScreenProps<AuthStackParamList, 'login'>;

const Login: React.FC<Props> = ({navigation}: Props) => {
  const resetFillupStore = addressStore.use.resetFillupStore();
  const resetAuthStore = authStore.use.resetAuthStore();
  const resetAssetStore = assetStore.use.resetAssetStore();
  const resetBusinessStore = businessStore.use.resetBusinessStore();
  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  const resetHomeStore = homeStore.use.resetHomeStore();
  const resetOrderStore = orderStore.use.resetOrderStore();
  const resetUserStore = userStore.use.resetUserStore();
  const resetWalletStore = walletStore.use.resetWalletStore();
  const resetCheckinStore = checkinStore.use.resetCheckinStore();
  // import second from '@/assets/auth/login-banner.png'
  useEffect(() => {
    // need to reset all stores before user logs in
    resetFillupStore();
    resetAuthStore();
    resetAssetStore();
    resetBusinessStore();
    resetDeliveryStore();
    resetHomeStore();
    resetOrderStore();
    resetUserStore();
    resetWalletStore();
    resetCheckinStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <View style={{flex: 1, position: 'relative', alignItems: 'center'}}>
      <FocusAwareStatusBar barStyle={'light-content'} />
      <View
        style={{
          width: 200,
          height: 200,
          justifyContent: 'center',
          alignItems: 'center',
          // backgroundColor: 'green',
        }}>
        {/* <Image
          source={require('@/assets/branding/fuelbuddy-full.svg')}
          resizeMode="stretch"
        /> */}
        <FuelBuddyLogo width={200} height={200} />
      </View>

      <LoginForm
      // navigation={navigation}
      // route={{name: 'login', key: '_login'}}
      />
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  sheetBackground: {
    borderColor: FBBorders.primary,
    borderWidth: 0,
    borderRadius: 0,
  },
});
