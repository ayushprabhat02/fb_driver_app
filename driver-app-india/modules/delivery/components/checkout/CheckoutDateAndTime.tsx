// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {Clock} from 'phosphor-react-native';
import {DateTime} from 'luxon';

// components
import {Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';

// styles & types
import {FBBackground} from '@/types/styles';

const CheckoutDateAndTime: React.FC = () => {
  const selectedDate = deliveryStore.use.selectedDate();
  const selectedSlot = deliveryStore.use.selectedSlot();

  return (
    <View style={styles.container}>
      <Clock size={24} />
      <View>
        <Text weight="600">Delivery slot</Text>
        <Text size="sm" weight="400" appearance="light" style={{marginTop: 10}}>
          {DateTime.fromFormat(selectedDate, 'yyyy-MM-dd').toFormat(
            'EEE dd MMM',
          )}{' '}
          {selectedSlot?.title}
        </Text>
      </View>
    </View>
  );
};

export default CheckoutDateAndTime;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    columnGap: 10,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: FBBackground.softBlue,
  },
});
