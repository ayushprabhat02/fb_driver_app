// dependencies
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScaledSheet} from 'react-native-size-matters';

const BusinessNavigator: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Business Module Removed</Text>
        <Text style={styles.subtitle}>Business functionality has been removed from the app</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@ms',
  },
  title: {
    fontSize: '24@ms',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10@ms',
  },
  subtitle: {
    fontSize: '16@ms',
    color: '#666',
    textAlign: 'center',
  },
});

export default BusinessNavigator;
