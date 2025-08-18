// dependencies
import React from 'react';
import {View} from 'react-native';
import {ms, ScaledSheet} from 'react-native-size-matters';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {Wallet, HouseLine, FileText} from 'phosphor-react-native';

// components
import {DeliveryLandingPage} from '@/modules/home/screens';
import {WalletDelivery} from '@/modules/wallet/delivery/screens';
import {MyOrders} from '@/modules/order/delivery/screens';

//styles
import {FBBackground, FBColors} from '@/types/styles';

const TabNav = createBottomTabNavigator();

export type HomeTabsParamList = {
  'home-tab': undefined;
  'orders-tab': undefined;
  'wallet-tab': undefined;
};
export type Props = BottomTabScreenProps<HomeTabsParamList, 'home-tab'>;

type TabIconProps = {
  focused: boolean;
  color?: string;
  size?: number;
};

const WalletTabIcon: React.FC<TabIconProps> = ({focused}) => {
  return (
    <View
      style={[
        styles.tabIconContainer,
        {
          backgroundColor: focused ? FBBackground.active : FBBackground.white,
        },
      ]}>
      <Wallet
        color={focused ? FBColors.white : FBColors.neutral}
        size={ms(24)}
      />
    </View>
  );
};

const HomeTabIcon: React.FC<TabIconProps> = ({focused}) => {
  return (
    <View
      style={[
        styles.tabIconContainer,
        {
          backgroundColor: focused ? FBBackground.active : FBBackground.white,
        },
      ]}>
      <HouseLine
        color={focused ? FBColors.white : FBColors.neutral}
        size={ms(24)}
      />
    </View>
  );
};

const ReportTabIcon: React.FC<TabIconProps> = ({focused}) => {
  return (
    <View
      style={[
        styles.tabIconContainer,
        {
          backgroundColor: focused ? FBBackground.active : FBBackground.white,
        },
      ]}>
      <FileText
        color={focused ? FBColors.white : FBColors.neutral}
        size={ms(24)}
      />
    </View>
  );
};

const Home: React.FC<Props> = () => {
  return (
    <TabNav.Navigator
      initialRouteName="home-tab"
      screenOptions={{
        tabBarShowLabel: false,
        tabBarInactiveTintColor: FBColors.lightGray,
        tabBarActiveTintColor: FBColors.primary,
        tabBarStyle: styles.tabBar,
      }}>
      <TabNav.Screen
        name="wallet-tab"
        component={WalletDelivery}
        options={{
          headerShown: false,
          tabBarIcon: WalletTabIcon,
        }}
      />
      <TabNav.Screen
        name="home-tab"
        component={DeliveryLandingPage}
        options={{
          headerShown: false,
          tabBarIcon: HomeTabIcon,
        }}
      />
      <TabNav.Screen
        name="orders-tab"
        component={MyOrders}
        options={{
          title: 'My Orders',
          tabBarIcon: ReportTabIcon,
          headerTitleAlign: 'center',
          headerShown: true,
          headerTransparent: true,
          headerStyle: {
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 0,
            backgroundColor: 'transparent',
          },
          headerTintColor: FBColors.neutral,
        }}
      />
    </TabNav.Navigator>
  );
};

const styles = ScaledSheet.create({
  tabBar: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    height: 66,
    paddingBottom: 0,
    zIndex: 0,
    elevation: 1,

    // iOS shadow properties
    shadowColor: '#000', // Shadow color
    shadowOffset: {width: 0, height: 4}, // Shadow offset
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 4.65, // Shadow radius
    // elevation: 4, // Android elevation
  },

  tabIconContainer: {
    width: 56,
    height: 40,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default Home;
