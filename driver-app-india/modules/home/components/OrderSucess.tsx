// dependencies
import {View, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// components
import SuccessAnimation from '@/components/SucessAnimation';
import {Divider, HeaderAvoidingContainer, Text} from '@/components';

// services
import Toast from 'react-native-toast-message';

// store
import {homeStore, orderStore} from '@/globalStore';

type RootStackParamList = {
  home: undefined;
};

const OrderSuccess: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Centralized reset function for post-completion cleanup
  const resetOrderData = () => {
    orderStore.setState(state => ({
      ...state,
      // Clear current orders
      currentDriverOrder: null,
      currentFillupOrder: null,
      orderAssets: [],
      // Clear dispensing states
      dispenseCompletedAssets: [],
      partiallyFilledAssetsArray: [],
      assetsWithUploadedVideos: [],
      // Clear image data
      challanImageData: null,
      technicianImageData: null,
      imapImageData: null,
      challanUploadedUrl: null,
      technicianUploadedUrl: null,
      imapUploadedUrl: null,
    }));

    // Force home page refresh by clearing cached data
    homeStore.setState(state => ({
      ...state,
      driverOrders: [], // This will trigger a refresh when home page loads
    }));
  };

  useEffect(() => {
    // Show success toast after 1 second
    const toastTimer = setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: 'Order Completed',
        text2: 'Delivery challan has been submitted successfully',
      });
    }, 1000);

    // Reset order data and navigate to homeLandingPage after 3 seconds
    const navigationTimer = setTimeout(() => {
      // Centralized cleanup before navigation
      resetOrderData();

      // Navigate to the home route
      (navigation as any).navigate('home');
    }, 3000);

    return () => {
      clearTimeout(toastTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigation]);

  return (
    <HeaderAvoidingContainer>
      <View style={styles.container}>
        <SuccessAnimation />
        <Text weight="bold" size="xl" color="primary">
          Order Successful!
        </Text>
        <Divider />
        <Text weight="bold" size="sm" color="steelBlue" appearance="light">
          You will now be redirected to Homepage..
        </Text>
      </View>
    </HeaderAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderSuccess;