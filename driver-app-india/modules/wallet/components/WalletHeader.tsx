// dependencies
import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// store
import {businessStore, walletStore} from '@/globalStore';

// utils
import WalletService from '../services';
import {formatAmountInternational, getBusinessRole} from '@/utils/general';

// assets
import WalletHeaderTexture1 from '@/assets/wallet/wallet-header-texture-1.svg';
import WalletHeaderTexture2 from '@/assets/wallet/wallet-header-texture-2.svg';

// components
import {Divider, Text} from '@/components';
import {FBBackground} from '@/types/styles';
import {AddMoneyButton, AmountDetails} from './index';

interface Props {
  onAdd: () => void;
}

const WalletHeader: React.FC<Props> = ({onAdd}) => {
  const currentWallet = walletStore.use.currentWallet();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();

  const [availableBalance, setAvailableBalance] = useState<string>('');

  const isOwner =
    getBusinessRole(activeDeliveryOrgUser) === 'owner' ||
    getBusinessRole(activeDeliveryOrgUser) === 'individual';

  useEffect(() => {
    const showAvailableBalance = WalletService.showAvailableBalance(
      activeDeliveryOrgUser,
    );

    if (showAvailableBalance) {
      setAvailableBalance(`${currentWallet?.available_balance}`);
    } else {
      setAvailableBalance(`${currentWallet?.amount}`);
    }
  }, [activeDeliveryOrgUser, currentWallet]);

  return (
    <View style={styles.container}>
      <WalletHeaderTexture1
        style={{position: 'absolute', bottom: 0, left: 0}}
      />
      <WalletHeaderTexture2 style={{position: 'absolute', top: 0, right: 0}} />

      <View>
        <Text color="white" weight="400" size="lg">
          Wallet Balance
        </Text>
        <Divider height={20} />
        <View>
          <Text color="white" weight="bold" size="xl">
            {formatAmountInternational(parseFloat(availableBalance))}
          </Text>
        </View>
        <Divider height={40} />
        {/* {isOwner ? <AmountDetails /> : null} */}
        <AmountDetails />
        <View style={styles.addMoneyBtn}>
          {isOwner ? <AddMoneyButton onPress={onAdd} /> : null}
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    minHeight: '30%',
    backgroundColor: FBBackground.darkGreen,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: '20@s',
    paddingTop: '60@vs',
    paddingBottom: '20@vs',
  },
  addMoneyBtn: {
    position: 'absolute',
    right: 0,
    top: -8,
  },
});

export default WalletHeader;
