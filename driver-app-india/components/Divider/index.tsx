import {View, DimensionValue} from 'react-native';
import React from 'react';
import {s} from 'react-native-size-matters';

type DividerProps = {
  width?: DimensionValue;
  height?: number;
};

const Divider: React.FC<DividerProps> = ({height = 10, width = '100%'}) => {
  return <View style={{height: s(height), width: width}} />;
};

export default Divider;
