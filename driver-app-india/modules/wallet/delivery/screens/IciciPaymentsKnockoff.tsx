// dependencies
import React from 'react';
import {ScrollView, View} from 'react-native';
import {WebView, WebViewNavigation} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';

// store
import {walletStore} from '@/globalStore';
import {HeaderAvoidingContainer} from '@/components';

const IciciPayments: React.FC = () => {
  const navigation = useNavigation();

  const iciciUrl = walletStore.use.iciciUrl();
  const pageVisitCount = walletStore.use.pageVisitCount();

  const extractQueryParams = (url: string) => {
    const queryString = url.split('?')[1];
    const params: any = {};

    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent(value);
      });
    }

    return params;
  };

  const handleNavigationStateChange = (navigationData: WebViewNavigation) => {
    const {url} = navigationData;

    if (
      url.includes('https://app.fuelbuddy.in/icici-success?status=SUCCESS') &&
      pageVisitCount === 0
    ) {
      const queryParams = extractQueryParams(url);

      walletStore.setState(state => ({
        ...state,
        iciciWalletTransactionId: queryParams.wallet_transaction_id || '',
        pageVisitCount: state.pageVisitCount + 1,
      }));

      navigation.replace('icici-success-knockoff');
      return;
    }

    if (
      url.includes('https://app.fuelbuddy.in/icici-failure') &&
      pageVisitCount === 0
    ) {
      walletStore.setState(state => ({
        ...state,
        pageVisitCount: state.pageVisitCount + 1,
      }));
      navigation.replace('icici-failure-knockoff');
      return;
    }
  };

  return (
    <HeaderAvoidingContainer>
      <View style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            paddingBottom: 28,
          }}>
          <View style={{flex: 1}}>
            <WebView
              onNavigationStateChange={handleNavigationStateChange}
              limitsNavigationsToAppBoundDomains
              originWhitelist={['*']}
              source={{uri: iciciUrl}}
              style={{flex: 1}}
            />
          </View>
        </ScrollView>
      </View>
    </HeaderAvoidingContainer>
  );
};

export default IciciPayments;
