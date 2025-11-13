// dependencies
import {View, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// components
import {Divider, HeaderAvoidingContainer, Text, Button} from '@/components';

// services
import Toast from 'react-native-toast-message';

// Types
import {OrderStackParamList} from '@/navigator/containers/Order';

type OrderFailureRouteProp = RouteProp<OrderStackParamList, 'OrderFailure'>;

type RootStackParamList = {
  home: undefined;
};

const OrderFailure: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderFailureRouteProp>();
  const {errorMessage, canRetry} = route.params || {};

  useEffect(() => {
    // Show error toast after 500ms
    const toastTimer = setTimeout(() => {
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: errorMessage || 'Failed to complete order',
      });
    }, 500);

    return () => {
      clearTimeout(toastTimer);
    };
  }, [errorMessage]);

  const handleRetry = () => {
    // Go back to the previous screen to retry
    navigation.goBack();
  };

  const handleGoHome = () => {
    // Navigate to home
    (navigation as any).navigate('home');
  };

  return (
    <HeaderAvoidingContainer>
      <View style={styles.container}>
        <View style={styles.errorIcon}>
          <Text size="xxxl" weight="bold" color="error">
            ✕
          </Text>
        </View>
        <Divider height={20} />
        <Text weight="bold" size="xl" color="error">
          Order Failed
        </Text>
        <Divider height={10} />
        <Text
          weight="normal"
          size="sm"
          color="neutral"
          appearance="light"
          style={styles.errorText}>
          {errorMessage || 'Failed to complete order. Please try again.'}
        </Text>
        <Divider height={30} />
        <View style={styles.buttonContainer}>
          {canRetry && (
            <>
              <Button
                variant="solid"
                onPress={handleRetry}
                style={styles.button}>
                Retry
              </Button>
              <Divider height={10} />
            </>
          )}
          <Button
            variant="outlined"
            onPress={handleGoHome}
            style={styles.button}>
            Go to Home
          </Button>
        </View>
      </View>
    </HeaderAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
  },
});

export default OrderFailure;
