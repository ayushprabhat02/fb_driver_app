// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {TouchableOpacity, Alert} from 'react-native';
import {SignOut} from 'phosphor-react-native';
import {useTranslation} from 'react-i18next';

// components
import CheckinPage from '@/modules/checkin/screens/CheckinPage';
import CheckinPageCustomer from '@/modules/checkin/screens/CheckinPageCustomer';
import {commonHeaderStyles} from '@/styles';
import {BackButtonArrow} from '@/components';

// services
import {signOut} from '@/modules/auth/services';

// types
import {FBColors} from '@/types/styles';
import {authStore} from '@/globalStore';

export type CheckInParamList = {
  'check-in': undefined;
};

const CheckInStack = createStackNavigator<CheckInParamList>();

const CheckinNavigator: React.FC = () => {
  const {t} = useTranslation();

  const userRole = authStore.use.userRole();
  console.log('🚦 CheckinNavigator rendered with userRole:', userRole);

  const CheckinComponent = userRole === 'customer' ? CheckinPageCustomer : CheckinPage;

  const handleLogout = () => {
    Alert.alert(
      t('checkin.logout'),
      t('checkin.logout_confirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('checkin.logout'),
          style: 'destructive',
          onPress: () => {
            signOut();
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <CheckInStack.Navigator
      screenOptions={{
        ...commonHeaderStyles,
      }}
      initialRouteName="check-in">
      <CheckInStack.Screen
        name="check-in"
        component={CheckinComponent}
        options={{
          headerTitle: t('checkin.check_in_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                marginRight: 16,
                padding: 8,
              }}>
              <SignOut size={24} color={FBColors.neutral} weight="regular" />
            </TouchableOpacity>
          ),
        }}
      />
    </CheckInStack.Navigator>
  );
};

export default CheckinNavigator;
