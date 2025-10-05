import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {Warning} from 'phosphor-react-native';
import {useTranslation} from 'react-i18next';

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
  const {t} = useTranslation();

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
                {t('home.alerts.completeDispensingFirst')}
              </Text>
              <Text size="xs" style={{color: '#92400e', opacity: 0.8}}>
                {t('home.alerts.completeDispensingDesc')}
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
                {t('home.alerts.completeFillupFirst')}
              </Text>
              <Text size="xs" style={{color: '#92400e', opacity: 0.8}}>
                {t('home.alerts.completeFillupDesc')}
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
                {t('home.alerts.fillupPriority')}
              </Text>
              <Text size="xs" style={{color: '#92400e', opacity: 0.8}}>
                {t('home.alerts.fillupPriorityDesc')}
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