import React from 'react';

// components
import {AmountBox} from './index';
import {Warning} from 'phosphor-react-native';

// store
import {walletStore} from '@/globalStore';

// types
import {FBColors} from '@/types/styles';

// services
import {formatAmountInternational} from '@/utils/general';

const OverdueAmount: React.FC = () => {
  const currentWallet = walletStore.use.pendingInvoice();
  return (
    <AmountBox
      icon={<Warning color={FBColors.amber} size={20} />}
      label="Overdue Amount"
      amount={formatAmountInternational(currentWallet?.totalOverDueAmt)}
      amountColor="amber"
      backgroundColor={FBColors.lightYellow}
    />
  );
};

export default OverdueAmount;
