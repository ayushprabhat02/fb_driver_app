// delivery
import {Pressable, StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';
import {WalletCard} from '@/modules/wallet/components';

// styles and types
import {FBBackground} from '@/types/styles';

const Wallet: React.FC = () => {
  return (
    <View style={{paddingHorizontal: 10}}>
      <Text size="3xl" letterSpacing="widest" weight="400">
        Wallet
      </Text>
      <Divider height={20} />
      <View style={styles.walletContainer}>
        <WalletCard flex={4} />
        <Pressable style={styles.viewMore}>
          <Text weight="600" color="white">
            View More
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  walletContainer: {
    flexDirection: 'row',
    width: '100%',
    columnGap: 8,
  },

  viewMore: {
    flex: 1,
    backgroundColor: FBBackground.complementary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
