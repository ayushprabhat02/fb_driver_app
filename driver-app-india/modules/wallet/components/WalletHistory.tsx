// dependencies
import {View, FlatList, ActivityIndicator} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {DateTime} from 'luxon';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';

import {formatAmountInternational, getBusinessRole} from '@/utils/general';

// store
import walletStore from '../store';

// components
import {Divider, FullScreenLoader, Text, TextButton} from '@/components';

// types
import {FetchUserLedgerQuery} from '@/generated/graphql';
import {businessStore} from '@/globalStore';
import {WalletService} from '@/services';

const WalletHistory: React.FC = () => {
  const userLedger = walletStore.use.userLedger();
  const userLedgerOffset = walletStore.use.userLedgerOffset();
  const userLedgerHasMoreItems = walletStore.use.userLedgerHasMoreItems();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const isOwner =
    getBusinessRole(activeDeliveryOrgUser) === 'owner' ||
    getBusinessRole(activeDeliveryOrgUser) === 'individual';
  const loaders = walletStore.use.loaders();
  const startLoader = walletStore.use.startLoader();
  const stopLoader = walletStore.use.stopLoader();
  const [fetching, setFetching] = useState(false);
  const navigation = useNavigation();
  const showPendingInvoices = async () => {
    startLoader('fetchPendingInvoices');
    WalletService.fetchPendingInvoice({
      object: {
        organization_id: activeDeliveryOrgUser?.organization_id,
      },
    })
      .then(() => {
        stopLoader('fetchPendingInvoices');
        navigation.navigate('wallet', {screen: 'user-invoices'});
      })
      .finally(() => {
        stopLoader('fetchPendingInvoices');
      });
  };

  const hasNextPage = () => {
    if (!userLedgerHasMoreItems || fetching) {
      return;
    }
    setFetching(true);
    const updatedOffset = userLedgerOffset + 10;
    walletStore.setState(state => ({
      ...state,
      userLedgerOffset: updatedOffset,
    }));
  };

  const fetchLedger = useCallback(async () => {
    if (!activeDeliveryOrgUser) return;

    await WalletService.getUserLedger({
      limit: 10,
      offset: userLedgerOffset,
      where: {
        organization_user_id: {
          _eq: activeDeliveryOrgUser?.id,
        },
      },
    }).finally(() => {
      setFetching(false);
    });
  }, [userLedgerOffset, activeDeliveryOrgUser]);

  useEffect(() => {
    if (userLedgerOffset && activeDeliveryOrgUser) {
      const fetchData = async () => {
        await fetchLedger();
      };
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLedgerOffset, activeDeliveryOrgUser]);

  return (
    <View style={{flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text size="lg" weight="600">
          Order History
        </Text>
        {isOwner ? (
          <TextButton underline onPress={showPendingInvoices}>
            Pending Invoices
          </TextButton>
        ) : null}
      </View>
      <Divider />
      <View style={styles.orderHistoryListContainer}>
        <FlatList
          data={userLedger.sort((a, b) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          })}
          renderItem={({item}) => <LedgerCard ledgerObject={item} />}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
          }}
          onEndReached={hasNextPage}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={Divider}
          ListFooterComponent={
            fetching ? <ActivityIndicator size="large" /> : null
          }
        />
      </View>
      <FullScreenLoader
        showLoader={loaders.fetchPendingInvoices}
        loaderText="Fetching pending invoices..."
      />
    </View>
  );
};

interface LedgerCardProps {
  ledgerObject: FetchUserLedgerQuery['user_ledger'][0];
}

const LedgerCard: React.FC<LedgerCardProps> = ({ledgerObject}) => {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
      <View>
        {ledgerObject.payment_type === 'CREDIT' ? (
          <Text weight="600">
            {ledgerObject.payment_type === 'CREDIT' ? 'Wallet Topup' : 'Debit'}
          </Text>
        ) : (
          <Text weight="500">Order #{ledgerObject?.transaction_details}</Text>
        )}
        <Text size="sm" color="lightGray" style={{marginTop: 2}}>
          {DateTime.fromISO(ledgerObject.created_at, {zone: 'utc'})
            ?.setZone('Asia/Kolkata')
            ?.toFormat('dd-LLL-yyyy HH:mm a')}
        </Text>
      </View>
      <Text
        weight="600"
        color={ledgerObject.payment_type === 'CREDIT' ? 'primary' : 'error'}>
        {formatAmountInternational(ledgerObject.amount)}{' '}
        {ledgerObject.payment_type === 'CREDIT' ? '(cr.)' : '(dr.)'}
      </Text>
    </View>
  );
};

export default WalletHistory;

const styles = ScaledSheet.create({
  orderHistoryListContainer: {
    // giving flex:1 to child element so it can take available white space
    flex: 1,
  },
});
