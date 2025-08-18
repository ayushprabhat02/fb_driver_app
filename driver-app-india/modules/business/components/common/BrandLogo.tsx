// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';

// imports
import BrandIcon from '@/assets/branding/brand-logo-1.svg';

// styles
import {FBBackground, FBBorders} from '@/types/styles';

const BrandLogo: React.FC = () => {
  return (
    <>
      <View style={styles.container}>
        <BrandIcon width={40} height={40} />
      </View>
    </>
  );
};

export default BrandLogo;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    backgroundColor: FBBackground.white,
    elevation: 3,
  },
});
