// dependencies
import { ScrollView, View } from 'react-native';
import React, { useCallback, useEffect } from 'react';
import { ScaledSheet } from 'react-native-size-matters';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// services
import { signOut } from '@/modules/auth/services';

// components
import { HeaderAvoidingContainer } from '@/components';
import { SettingsHeader } from '../components';
import SettingsCard from '../components/SettingsCard';

// data
import { settingsOptions } from '../data/settings';

// types
import { FBBackground, FBBorders, FBColors } from '@/types/styles';
import { UserService } from '@/services';
import userService from '@/modules/user/services';

const Settings: React.FC = () => {
  useEffect(() => {
    // UserService.getUserProfile();
  }, []);

  const navigation = useNavigation();

  type NavigateProps = {
    title: string;
    icon: string;
    module: string;
    screen?: string;
  };

  const navigateToModule = (setting: NavigateProps) => {
    if (setting?.screen) {
      // @ts-ignore
      navigation.navigate(setting.module, { screen: setting.screen });
      return;
    }

    // @ts-ignore
    navigation.navigate(setting?.module);
  };

  const handleLogout = () => {
    // @ts-ignore
    navigation.navigate('checkout', { screen: 'CheckoutPage' });
  };

  const fetchMyProfile = async () => {
    try {
      await userService.fetchMyProfile();
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchMyProfile();
  //   }, []),
  // );

  return (
    <HeaderAvoidingContainer>
      <SettingsHeader />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.settingsListContainer}>
          {settingsOptions.map(setting => (
            <SettingsCard
              key={setting.title}
              settings={setting}
              onPress={() => {
                navigateToModule(setting);
              }}
            />
          ))}
          <SettingsCard
            settings={{
              icon: 'logout',
              module: 'checkout',
              screen: 'CheckoutPage',
              title: 'Logout',
            }}
            color={FBColors.error}
            bgColor={FBBackground.shellPink}
            onPress={() => {
              signOut();
              // handleLogout()
            }} 
            borderWidth={0}
          />
        </View>
      </ScrollView>
    </HeaderAvoidingContainer>
  );
};

export default Settings;

const styles = ScaledSheet.create({
  settingsContainer: {
    paddingBottom: '6@vs',
    flex: 1,
  },

  settingsListContainer: {
    marginTop: 20,
    backgroundColor: FBBackground.white,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderColor: FBBorders.secondary,
    borderWidth: 1,
  },
});