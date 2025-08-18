// dependencies
import {View, StyleSheet, FlatList} from 'react-native';
import React, {useCallback, useRef} from 'react';
import {BottomSheetView, BottomSheetModal} from '@gorhom/bottom-sheet';
import {useFocusEffect} from '@react-navigation/native';

// store
import {businessStore, deliveryStore, walletStore} from '@/globalStore';

// components
import {
  WalletHeader,
  FBAccountDetails,
  WalletHistory,
  WalletForm,
  AmountsScreen,
} from '../../components';
import {
  Divider,
  FocusAwareStatusBar,
  FullScreenLoader,
  SimpleBottomSheet,
} from '@/components';

// styles
import {commonBottomSheetView} from '@/styles';

//actions
import {WalletService} from '@/services';

const DividerComponent = () => <Divider height={14} />;

const WalletDelivery: React.FC = () => {
  const currentWallet = walletStore.use.currentWallet();
  const resetLedgerPagination = walletStore.use.resetLedgerPagination();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const loaders = walletStore.use.loaders();
  const startLoader = walletStore.use.startLoader();
  const stopLoader = walletStore.use.stopLoader();

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };
  const flatListData = [
    {key: 'FBAccountDetails', component: <FBAccountDetails />},
    {
      key: 'AmountsScreen',
      component: currentWallet?.allowed_credit_limit ? <AmountsScreen /> : null,
    },
    {key: 'WalletHistory', component: <WalletHistory />},
  ];
  const renderItem = ({
    item,
  }: {
    item: {key: string; component: JSX.Element};
  }) => {
    return item.component;
  };

  useFocusEffect(
    useCallback(() => {
      walletStore.setState(state => ({
        ...state,
        pageVisitCount: 0,
      }));

      resetLedgerPagination();
      if (activeDeliveryOrgUser) {
        startLoader('fetchWalletData');
        WalletService.updateWalletData(activeDeliveryOrgUser, () =>
          stopLoader('fetchWalletData'),
        ).then(() => {
          WalletService.fetchPendingInvoice({
            object: {
              organization_id: activeDeliveryOrgUser?.organization_id,
            },
          });
        });
      }
    }, [activeDeliveryOrgUser, resetLedgerPagination, startLoader, stopLoader]),
  );

  useFocusEffect(
    useCallback(() => {
      deliveryStore.setState(state => ({
        ...state,
        isError: [],
      }));
    }, []),
  );

  return (
    <View style={{flex: 1}}>
      <WalletHeader onAdd={openBottomSheet} />
      <FocusAwareStatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="light-content"
      />
      <Divider height={14} />

      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        ItemSeparatorComponent={DividerComponent}
        contentContainerStyle={styles.container}
      />

      <SimpleBottomSheet
        snapPoints={['65%']}
        ref={bottomSheetRef}
        closeSheet={closeBottomSheet}>
        <BottomSheetView style={commonBottomSheetView}>
          <WalletForm
            currentWallet={currentWallet}
            onClose={closeBottomSheet}
          />
        </BottomSheetView>
      </SimpleBottomSheet>
      <FullScreenLoader
        showLoader={loaders.fetchWalletData}
        loaderText="Fetching wallet data..."
      />
    </View>
  );
};

export default WalletDelivery;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    flexGrow: 1,
    paddingHorizontal: 14,
  },
});
