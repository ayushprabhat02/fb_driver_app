// dependencies
import {View, Text as RNText} from 'react-native';
import React from 'react';
import {useTranslation} from 'react-i18next';

// components
import {Divider, Text} from '@/components';

// imports
import BrandLogo1 from '@/assets/branding/brand-logo-1.svg';

const LoginHeading: React.FC = () => {
  const {t} = useTranslation();

  return (
    <View style={{width: '100%', alignItems: 'center'}}>
      {/* <BrandLogo1 width={36} height={36} /> */}
      <Divider />
      <Text size="xl" weight="bold">
        {t('login.welcome')}
      </Text>
      <Divider height={6} />
      <RNText style={{fontSize: 15, color: 'black', fontWeight: '600'}}>
        {t('login.login_to_continue')}
      </RNText>
    </View>
  );
};

export default LoginHeading;
