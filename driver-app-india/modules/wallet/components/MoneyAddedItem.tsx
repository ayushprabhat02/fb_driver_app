// dependencies
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {DateTime} from 'luxon';

// components
import {Divider, Text} from '@/components';

// utils
import {formatAmountInternational} from '@/utils/general';

// types
import {MoneyAddedItem as MoneyAddedItemType} from '../types/index';

interface MoneyAddedItemProps {
  item: MoneyAddedItemType;
}

const MoneyAddedItem: React.FC<MoneyAddedItemProps> = ({item}) => (
  <View style={styles.itemContainer}>
    <View>
      <Text size="base" weight="bold">
        Wallet Topup
      </Text>
      <Divider height={6} />
      <Text size="sm" color="lightGray">
        {DateTime.fromISO(item.created_at, {zone: 'utc'})
          .setZone('Asia/Kolkata')
          .toFormat('dd-LLL-yyyy HH:mm a')}
      </Text>
    </View>
    <Text size="base" weight="bold" color="primary">
      {formatAmountInternational(item.amount)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
});

export default MoneyAddedItem;
