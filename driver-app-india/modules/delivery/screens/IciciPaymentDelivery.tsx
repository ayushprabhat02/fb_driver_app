// dependencies
import React, {useCallback} from 'react';
import {SafeAreaView, ScrollView, View} from 'react-native';
import {WebView, WebViewNavigation} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';

// store
import {walletStore} from '@/globalStore';
import { HeaderAvoidingContainer } from '@/components';
// import {HeaderAvoidingContainer} from '@/components';

const IciciPayments: React.FC = () => {
  const navigation = useNavigation();

  const iciciUrl = walletStore.use.iciciUrl();

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

  const handleNavigationStateChange = useCallback(
    (navigationData: WebViewNavigation) => {
      const {url} = navigationData;

      if (
        url.includes('https://app.fuelbuddy.in/icici-success?status=SUCCESS')
      ) {
        const queryParams = extractQueryParams(url);

        walletStore.setState(state => ({
          ...state,
          iciciWalletTransactionId: queryParams.wallet_transaction_id || '',
        }));
        navigation.replace('icici-success-del');
        return;
      }

      if (url.includes('https://app.fuelbuddy.in/icici-failure')) {
        navigation.replace('icici-failure-del');
        return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{flex: 1, paddingHorizontal: 10}}>
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
    </SafeAreaView>
  );
};

export default IciciPayments;
