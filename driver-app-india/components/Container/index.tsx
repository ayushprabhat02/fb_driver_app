// dependencies
import React, {ReactNode} from 'react';
import {View} from 'react-native';

interface ContainerProps {
  children: ReactNode;
  paddingHorizontal?: number;
  style?: any;
}

const Container: React.FC<ContainerProps> = ({
  children,
  paddingHorizontal = 24,
  style,
}) => {
  return <View style={{padding: paddingHorizontal, ...style}}>{children}</View>;
};

export default Container;
