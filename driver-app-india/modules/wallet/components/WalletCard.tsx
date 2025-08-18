// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

// actions
import {formatAmountInternational} from '@/utils/general';

// imports
import WalletChip from '@/assets/wallet/wallet-chip.svg';
import WalletWifi from '@/assets/wallet/wallet-wifi.svg';
import FuelBuddyFull from '@/assets/branding/fuelbuddy-full.svg';

// types
import {FBBackground} from '@/types/styles';

// store
import {walletStore} from '@/globalStore';

interface WalletCardProps {
  flex: number;
}

const WalletCard: React.FC<WalletCardProps> = ({flex}) => {
  const currentWallet = walletStore.use.currentWallet();

  return (
    <View style={[styles.walletCard, {flex: flex}]}>
      <View style={styles.iconContainer}>
        <WalletChip />
        <WalletWifi />
      </View>
      <Divider height={46} />
      <View>
        <Text color="white" weight="600">
          Wallet Balance
        </Text>
        <Divider height={8} />
        <Text color="white" size="xl" weight="600" lines={1}>
          {formatAmountInternational(currentWallet?.available_balance)}
        </Text>
      </View>
      <Divider height={8} />
      <View style={styles.logoContainer}>
        <FuelBuddyFull />
      </View>
    </View>
  );
};

export default WalletCard;

const styles = StyleSheet.create({
  walletCard: {
    height: 200,
    width: '100%',
    backgroundColor: FBBackground.darkGreen,
    borderRadius: 16,
    padding: 16,
  },

  iconContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  logoContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
