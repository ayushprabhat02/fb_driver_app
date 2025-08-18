// dependencies
import React from 'react';
import {View, StyleSheet} from 'react-native';

// components
import {Button, Text} from '@/components';

// actions
import {formatAmountInternational} from '@/utils/general';

// store
import {walletStore} from '@/globalStore';

interface TotalSectionProps {
  totalSelectedAmount: number;
  onPayNow: () => void;
}

const TotalSection: React.FC<TotalSectionProps> = ({
  totalSelectedAmount,
  onPayNow,
}) => {
  const loaders = walletStore.use.loaders();

  return (
    <View style={styles.totalContainer}>
      <Button
        onPress={onPayNow}
        variant="solid"
        style={{width: '80%'}}
        loading={loaders.initiatePayment}>
        <Text weight="bold" color="white">
          Pay Now: {formatAmountInternational(totalSelectedAmount)}
        </Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  totalContainer: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
});

export default TotalSection;
