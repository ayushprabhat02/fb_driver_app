import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {Warning} from 'phosphor-react-native';

interface OrderValidationAlertProps {
  hasDispensingOrder: boolean;
  hasIncompleteFillupHistory: boolean;
  hasFillupOrder: boolean;
}

const OrderValidationAlert: React.FC<OrderValidationAlertProps> = ({
  hasDispensingOrder,
  hasIncompleteFillupHistory,
  hasFillupOrder,
}) => {
  if (!hasDispensingOrder && !hasIncompleteFillupHistory && !hasFillupOrder) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Dispensing Order Alert */}
      {hasDispensingOrder && (
        <View style={styles.alertBox}>
          <View style={styles.alertContent}>
            <Warning size={16} color="#92400e" weight="fill" />
            <View style={styles.alertText}>
              <Text size="sm" weight="600" style={{color: '#92400e', marginBottom: 2}}>
                Complete dispensing order first!
              </Text>
              <Text size="xs" style={{color: '#92400e', opacity: 0.8}}>
                You must complete the order in dispensing state before selecting a new order.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Incomplete Fillup History Alert */}
      {hasIncompleteFillupHistory && (
        <View style={styles.alertBox}>
          <View style={styles.alertContent}>
            <Warning size={16} color="#92400e" weight="fill" />
            <View style={styles.alertText}>
              <Text size="sm" weight="600" style={{color: '#92400e', marginBottom: 2}}>
                Complete fillup history first!
              </Text>
              <Text size="xs" style={{color: '#92400e', opacity: 0.8}}>
                You must complete all incomplete fillup orders before selecting delivery orders.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Fillup Order Priority Alert */}
      {hasFillupOrder && !hasIncompleteFillupHistory && (
        <View style={styles.alertBox}>
          <View style={styles.alertContent}>
            <Warning size={16} color="#92400e" weight="fill" />
            <View style={styles.alertText}>
              <Text size="sm" weight="600" style={{color: '#92400e', marginBottom: 2}}>
                Fillup orders have priority!
              </Text>
              <Text size="xs" style={{color: '#92400e', opacity: 0.8}}>
                Complete fillup orders before selecting delivery orders.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginHorizontal: '16@s',
    marginBottom: '8@vs',
  },
  alertBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: '4@s',
    borderLeftColor: '#fbbf24',
    borderRadius: '6@s',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    marginBottom: '8@vs',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    marginLeft: '8@s',
  },
});

export default OrderValidationAlert;