// dependencies
import React from 'react';
import {View} from 'react-native';

// components
import {Divider, Text} from '@/components';

// store
import {businessStore, walletStore} from '@/globalStore';

// actions
import {formatAmountInternational, getBusinessRole} from '@/utils/general';

const AmountDetails: React.FC = () => {
  const currentWallet = walletStore.use.currentWallet();

  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const isOwner =
    getBusinessRole(activeDeliveryOrgUser) === 'owner' ||
    getBusinessRole(activeDeliveryOrgUser) === 'individual';

  return (
    <View>
      <Text
        size="sm"
        color="white"
        weight="800"
        lines={1}
        style={{maxWidth: '95%'}}>
        Block Amount:{' '}
        {formatAmountInternational(currentWallet?.block_amount) || 0}
      </Text>
      <Divider height={20} />
      {isOwner && currentWallet?.is_credit_available ? (
        <Text
          size="sm"
          color="white"
          weight="800"
          lines={1}
          style={{maxWidth: '95%'}}>
          Credit Limit:{' '}
          {formatAmountInternational(currentWallet?.allowed_credit_limit) || 0}
        </Text>
      ) : null}
    </View>
  );
};

export default AmountDetails;
