import {
  Linking,
  NativeModules,
  ToastAndroid,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  StatusBar,
} from 'react-native';
import {WebView, WebViewNavigation} from 'react-native-webview';
import PaymentHelper from '../components/axis/PaymentHelper';
import {walletStore} from '@/globalStore';
import {WalletService} from '@/services';
import {FocusAwareStatusBar, HeaderAvoidingContainer} from '@/components';
import React, {useCallback} from 'react';
const {NdpsAESLibrary} = NativeModules;

function AxisPayments(this: any, {route, navigation}) {
  const INJECT_JS =
    'window.ReactNativeWebView.postMessage(document.getElementsByTagName("h5")[0].innerHTML)';

  const htmlPage = route?.params?.htmlPage || '';

  /**
   * function to extract status and transaction id
   * @param url
   * @returns
   */
  const extractStatusAndTransactionId = (url: string) => {
    if (!url || !url.includes('?')) {
      // console.error(
      //   'Invalid URL passed to extractStatusAndTransactionId:',
      //   url,
      // );
      return {status: null, walletTransactionId: null};
    }
    const queryString = url.split('?')[1]; // Extract the part after `?`
    const queryParams = queryString.split('&').reduce((params: any, param) => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value);
      return params;
    }, {});

    const status = queryParams['status'] || null;
    const walletTransactionId = queryParams['wallet_transaction_id'] || null;

    return {status, walletTransactionId};
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('--axisPayment-knockoff--request-------', request);

    if (request?.mainDocumentURL) {
      const {status, walletTransactionId} = extractStatusAndTransactionId(
        request?.mainDocumentURL || '',
      );

      console.log('Extracted status:', status);
      console.log('Extracted walletTransactionId:', walletTransactionId);

      // FAILURE CASE: Check if status starts with "FAILED"
      if (status && status.startsWith('FAILED')) {
        navigation.replace('axis-failure-knockoff'); // Navigate to failure screen
        return false; // Prevent further WebView navigation
      }

      // SUCCESS CASE: Check if status is "SUCCESS"
      if (status === 'SUCCESS') {
        walletStore.setState(state => ({
          ...state,
          axisWalletTransactionId: walletTransactionId || '',
        }));
        navigation.replace('axis-success-knockoff'); // Navigate to success screen
        return false; // Prevent further WebView navigation
      }
    }

    // Handle UPI URLs
    if (url.startsWith('upi:')) {
      Linking.openURL(url).catch(() => {
        Alert.alert(
          'Error occurred! Please check if you have UPI apps installed.',
        );
      });
      return false; // Prevent WebView from handling UPI URLs
    }

    // Allow other URLs to load
    return true;
  };

  const handleNavigationStateChange = useCallback(
    (navigationData: WebViewNavigation) => {
      const {url} = navigationData;

      console.log('--handleNavigationStateChange-----url-----------', url);

      if (navigationData?.url) {
        const {status, walletTransactionId} = extractStatusAndTransactionId(
          navigationData?.url || '',
        );

        console.log('Extracted status:', status);
        console.log('Extracted walletTransactionId:', walletTransactionId);

        // FAILURE CASE: Check if status starts with "FAILED"
        if (status && status.startsWith('FAILED')) {
          navigation.replace('axis-failure-knockoff'); // Navigate to failure screen
          return;
        }

        // SUCCESS CASE: Check if status is "SUCCESS"
        if (status === 'SUCCESS') {
          walletStore.setState(state => ({
            ...state,
            axisWalletTransactionId: walletTransactionId || '',
          }));
          navigation.replace('axis-success-knockoff'); // Navigate to success screen
          return;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <FocusAwareStatusBar
        barStyle={'dark-content'}
        backgroundColor={'white'}
      />
      <View
        style={{
          flex: 1,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
        <WebView
          style={{flex: 1}}
          originWhitelist={['https://*', 'upi://*']}
          source={{html: htmlPage}}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          renderLoading={this.LoadingIndicatorView}
          startInLoadingState={true}
          // onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScript={INJECT_JS}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            Alert.alert('WebView error: ', nativeEvent);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default AxisPayments;
