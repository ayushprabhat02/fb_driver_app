// dependencies
import {View, Text as RNText} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

// imports
import BrandLogo1 from '@/assets/branding/brand-logo-1.svg';

const LoginHeading: React.FC = () => {
  return (
    <View style={{width: '100%', alignItems: 'center'}}>
      {/* <BrandLogo1 width={36} height={36} /> */}
      <Divider />
      <Text size="xl" weight="bold">
        Welcome
      </Text>
      <Divider height={6} />
      <RNText style={{fontSize: 15, color: 'black', fontWeight: '600'}}>
        Log in to continue
      </RNText>
    </View>
  );
};

export default LoginHeading;
