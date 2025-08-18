// dependencies
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

// imports
import {FBColorPalette} from '@/types/styles';

type Props = {
  children: React.ReactNode;
};

const GradientPrimary: React.FC<Props> = ({children}) => {
  return (
    <LinearGradient
      colors={[
        FBColorPalette.gradientPrimaryStart, //production
        // 'red', //kept here for development
        FBColorPalette.gradientPrimaryEnd,
      ]}
      style={{flex: 1}}>
      {children}
    </LinearGradient>
  );
};

export default GradientPrimary;
