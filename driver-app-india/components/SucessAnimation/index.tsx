import React from 'react';
import {View, Dimensions} from 'react-native';
import LottieView from 'lottie-react-native';
import successAnimation from './sucessAnimation.json';

const {width} = Dimensions.get('window');

const SuccessAnimation: React.FC = () => {
  return (
    <View
      style={{
        width: width,
        height: width,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <LottieView
        style={{
          width: '100%',
          height: '100%',
        }}
        source={successAnimation}
        autoPlay
        loop
      />
    </View>
  );
};

export default SuccessAnimation;
