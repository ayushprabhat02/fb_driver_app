// dependencies
import React, {useCallback} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import {useNavigation} from '@react-navigation/native';

// screens
import {LoginScreen, VerifyOTP, CompleteProfile} from '@/modules/auth/screens';
import {FBColorPalette} from '@/types/styles';
import {Pressable} from 'react-native';

// arrow-left-thin-circle-outline

export type AuthStackParamList = {
  login: undefined;
  'verify-otp': undefined;
  protected: undefined;
  splash: undefined;
  'complete-profile': undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const navigation = useNavigation();

  // custom header back icon
  const HeaderLeft: React.FC = useCallback(
    () => (
      <Pressable
        style={{marginLeft: 21}}
        onPress={() => {
          navigation.goBack();
        }}>
        <Icon
          name="arrow-left-circle"
          size={28}
          color={FBColorPalette.neutral}
        />
      </Pressable>
    ),
    [navigation],
  );

  return (
    <AuthStack.Navigator initialRouteName="login">
      <AuthStack.Screen
        name="login"
        component={LoginScreen}
        options={{headerShown: false}}
      />
      <AuthStack.Screen
        name="verify-otp"
        component={VerifyOTP}
        options={{
          title: 'Verify Account!',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 28,
          },
          headerShown: true,
          headerStyle: {
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 0,
            height: 100,
          },
          headerLeft: HeaderLeft,
        }}
      />
      <AuthStack.Screen
        name="complete-profile"
        component={CompleteProfile}
        options={{
          headerShown: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
