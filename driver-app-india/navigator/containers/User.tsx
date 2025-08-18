// dependencies
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// components
import {
  UserProfile,
  AddDefaultOrg,
  ProfileBusiness,
} from '@/modules/user/screens';
import {BackButtonArrow, TextButton} from '@/components';

// styles
import {commonHeaderStyles} from '@/styles';
import {businessStore} from '@/globalStore';
import {getBusinessRole} from '@/utils/general';
import {useNavigation} from '@react-navigation/native';

export type UserStackParamList = {
  'user-profile': undefined;
  'add-default-org': undefined;
  'business-profile': undefined;
};

const UserStack = createStackNavigator<UserStackParamList>();

const UserNavigator: React.FC = () => {
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const userRole = getBusinessRole(activeDeliveryOrgUser);

  return (
    <UserStack.Navigator
      initialRouteName={
        userRole === 'individual' ? 'user-profile' : 'business-profile'
      }
      screenOptions={{
        ...commonHeaderStyles,
        headerTitleAlign: 'center',
      }}>
      <UserStack.Screen
        name="user-profile"
        component={UserProfile}
        options={{
          title: '',
          headerLeft: BackButtonArrow,
        }}
      />
      <UserStack.Screen
        name="business-profile"
        component={ProfileBusiness}
        options={{
          title: '',
          headerLeft: BackButtonArrow,
          headerRight: HeaderRight,
        }}
      />
      <UserStack.Screen
        name="add-default-org"
        component={AddDefaultOrg}
        options={{
          title: '',
          headerLeft: BackButtonArrow,
        }}
      />
    </UserStack.Navigator>
  );
};

const HeaderRight: React.FC = () => {
  const navigation = useNavigation();

  return (
    <TextButton
      onPress={() => {
        navigation.navigate('user-profile');
      }}
      style={{
        backgroundColor: 'transparent',
        alignSelf: 'flex-end',
        marginRight: 10,
        marginTop: 4,
      }}>
      Edit My Profile
    </TextButton>
  );
};

export default UserNavigator;
