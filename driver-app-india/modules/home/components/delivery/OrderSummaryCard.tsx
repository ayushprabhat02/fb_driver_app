import React from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {FullScreenLoader, Text} from '@/components';
import {homeStore} from '@/globalStore';

const OrderSummaryCard: React.FC = () => {
  const driverOrderStats = homeStore.use.driverOrderStats();
  const isLoading = homeStore.use.loaders().driverOrderStats;

  const totalOrders = driverOrderStats?.data?.total_assigned_orders || 0;
  const deliveredOrders =
    driverOrderStats?.data?.total_delivered_orders_today || 0;
  const pendingOrders = driverOrderStats?.data?.total_pending_orders || 0;
  const progressPercentage =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#007bff" />
      </View>
    );
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text size="base" weight="700" color="primary">
          Today's Summary
        </Text>
        <Text size="sm" weight="500" color="neutral">
          {getCurrentDate()}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text size="xs" weight="500" color="neutral">
            Total
          </Text>
          <Text size="lg" weight="700" color="primary">
            {totalOrders}
          </Text>
          <Text size="xs" weight="500" color="neutral">
            {driverOrderStats?.data?.total_assigned_qty || 0}L
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text size="xs" weight="500" color="neutral">
            Delivered
          </Text>
          <Text size="lg" weight="700" style={{color: '#28a745'}}>
            {deliveredOrders}
          </Text>
          <Text size="xs" weight="500" color="neutral">
            {driverOrderStats?.data?.total_delivered_qty_today || 0}L
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text size="xs" weight="500" color="neutral">
            Pending
          </Text>
          <Text size="lg" weight="700" style={{color: '#fd7e14'}}>
            {pendingOrders}
          </Text>
          <Text size="xs" weight="500" color="neutral">
            {driverOrderStats?.data?.total_pending_qty || 0}L
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text size="xs" weight="500" color="neutral">
            Progress
          </Text>
          <Text size="lg" weight="700" color="primary">
            {progressPercentage}%
          </Text>
        </View>
      </View>

      <FullScreenLoader showLoader={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    marginVertical: 8,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  loadingContainer: {
    height: 115,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
});

export default OrderSummaryCard;
