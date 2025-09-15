// dependencies
import {View, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';

// components
import SuccessAnimation from '@/components/SucessAnimation';
import {Divider, HeaderAvoidingContainer, Text} from '@/components';

// services

import Toast from 'react-native-toast-message';

const OrderSuccess: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Show success toast after 1 second
    const toastTimer = setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: 'Order Completed',
        text2: 'Delivery challan has been submitted successfully',
      });
    }, 1000);

    // Navigate to homeLandingPage after 3 seconds
    const navigationTimer = setTimeout(() => {
      (navigation as any).reset({
        index: 0,
        routes: [{name: 'homeLandingPage'}],
      });
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
