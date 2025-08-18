// dependencies
import {StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import LottieView from 'lottie-react-native';
import {Bar as ProgressBar} from 'react-native-progress';

// components
import SetupBusinessProfileAnimation from '@/animation/business/setup-business-profile.json';
import {Divider, Text} from '@/components';
import {FBColors} from '@/types/styles';

const SetupBusinessProfileLoader: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 1) {
          clearInterval(interval);
          return 1;
        }
        return prevProgress + 0.01;
      });
    }, 550);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        style={styles.lottieView}
        source={SetupBusinessProfileAnimation}
        autoPlay
        loop
      />
      <Divider height={32} />
      <View style={{paddingHorizontal: 10}}>
        <View style={{alignItems: 'center'}}>
          <ProgressBar
            progress={progress}
            width={300}
            color={FBColors.primary}
          />
          <Divider height={20} />
          <Text weight="600" color="steelBlue">
            Setting up your profile. Please Wait
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SetupBusinessProfileLoader;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  lottieView: {
    width: '100%',
    height: 90,
  },
});
