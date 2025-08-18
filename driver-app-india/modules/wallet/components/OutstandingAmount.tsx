// dependencies
import React from 'react';
import {AmountBox} from './index';
import {ArrowDown} from 'phosphor-react-native';

// store
import {walletStore} from '@/globalStore';

// types
import {FBColors} from '@/types/styles';

// services
import {formatAmountInternational} from '@/utils/general';

const OutstandingAmount: React.FC = () => {
  const currentWallet = walletStore.use.pendingInvoice();
  return (
    <AmountBox
      icon={<ArrowDown color={FBColors.error} size={20} />}
      label="Outstanding Amount"
      amount={formatAmountInternational(currentWallet?.totalPendingAmt)}
      amountColor="redGradient"
      backgroundColor={FBColors.lightRed}
    />
  );
};

export default OutstandingAmount;
