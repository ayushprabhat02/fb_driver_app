// dependencies
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

import {Overdue, Outstanding} from './index';

const AmountsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Overdue />
      <Outstanding />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default AmountsScreen;
