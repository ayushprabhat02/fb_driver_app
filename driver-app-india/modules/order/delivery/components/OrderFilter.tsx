// dependencies
import {ScrollView} from 'react-native';
import React from 'react';

// components
import {Chip} from '@/components';

// data, styles & types
import {Filter, DeliveryOrderFilterTypes} from '../data';
import {FBBorders} from '@/types/styles';

interface Props {
  filters: Filter[];
  activeFilter: DeliveryOrderFilterTypes;
  changeFilter: (filter: DeliveryOrderFilterTypes) => void;
}

const OrderFilter: React.FC<Props> = ({
  filters,
  activeFilter,
  changeFilter,
}) => {
  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      horizontal
      contentContainerStyle={{columnGap: 12, paddingRight: 8}}>
      {filters.map(item => (
        <Chip
          key={item.value}
          onPress={() => changeFilter(item.value)}
          fontSize="sm"
          active={item.value === activeFilter}
          label={item.title}
          shape="square"
          style={{borderWidth: 1, borderColor: FBBorders.secondary}}
        />
      ))}
    </ScrollView>
  );
};

export default OrderFilter;
