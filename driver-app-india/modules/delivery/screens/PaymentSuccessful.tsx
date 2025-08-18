// SuccessScreen.tsx
import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import SuccessAnimation from '@/components/SucessAnimation';
import {GradientPrimary, Text} from '@/components';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

const SuccessScreen: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore
      navigation.replace('delivery-order-tracking');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <GradientPrimary>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <SuccessAnimation />
          <Text weight="bold" size="xl" color="primary">
            Payment Successful !!
          </Text>
        </View>
      </SafeAreaView>
    </GradientPrimary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuccessScreen;
