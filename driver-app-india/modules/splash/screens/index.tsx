// SplashScreen.tsx

import {View} from 'react-native';
import React from 'react';
import SplashScreenIcon from '../assets/splash-icon.svg';
import {FBColorPalette} from '@/types/styles';

const SplashScreen: React.FC = () => {
  // No useEffect or state management needed here anymore.
  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        backgroundColor: FBColorPalette.primary,
      }}>
      <SplashScreenIcon style={{transform: [{scale: 1.5}]}} />
    </View>
  );
};

export default SplashScreen;
