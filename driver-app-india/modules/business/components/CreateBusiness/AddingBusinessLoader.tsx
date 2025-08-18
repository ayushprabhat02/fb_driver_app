// dependencies
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Text} from '@/components';

const AddingBusinessLoader = () => {
  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <View style={styles.container}>
        <Text weight="600" color="steelBlue">
          Adding business. Please wait
        </Text>
        <ActivityIndicator />
      </View>
    </View>
  );
};

export default AddingBusinessLoader;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 12,
  },
});
