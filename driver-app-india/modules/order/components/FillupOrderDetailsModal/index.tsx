import React, {useRef} from 'react';
import {View, TouchableOpacity, ScrollView} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';

// components
import {Divider, SimpleBottomSheet, Text} from '@/components';
import FillupOrderStateFlow from '../FillupOrderStateFlow';

// store
import orderStore from '../../store';

// types
import {FBColors, FBColorPalette} from '@/types/styles';

type FillupOrderDetailsModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToAssets: () => void;
  onCancelOrder: () => void;
};

const FillupOrderDetailsModal: React.FC<FillupOrderDetailsModalProps> = ({
  isVisible,
  onClose,
  onNavigateToAssets,
  onCancelOrder,
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // store state
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const fillupOrderStateFlow = orderStore.use.fillupOrderStateFlow();

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatusColor = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'PENDING':
        return '#FFA500';
      case 'CONFIRMED':
        return '#2196F3';
      case 'IN_TRANSIT':
        return '#FF9800';
      case 'ARRIVED':
        return '#9C27B0';
      case 'DISPENSING':
        return '#FF5722';
      case 'DELIVERED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return FBColorPalette.steelBlue;
    }
  };

  const canCancelOrder = (state: string) => {
    return ['PENDING', 'CONFIRMED'].includes(state?.toUpperCase());
  };

  const canProceedToAssets = (state: string) => {
    return ['CONFIRMED', 'IN_TRANSIT', 'ARRIVED', 'DISPENSING'].includes(state?.toUpperCase());
  };

  if (!currentFillupOrder) {
    return null;
  }

  const fillupRequest = currentFillupOrder.fillup_requests?.[0];
  const orderState = currentFillupOrder.state || 'PENDING';
  const statusColor = getOrderStatusColor(orderState);
  const isCancellable = canCancelOrder(orderState);
  const canProceed = canProceedToAssets(orderState);

  return (
    <SimpleBottomSheet
      ref={bottomSheetRef}
      snapPoints={['80%']}
      closeSheet={onClose}>
      <BottomSheetView style={styles.modalContent}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text size="lg" weight="bold" color="neutral">
              Fillup Order Details
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text size="lg" color="steelBlue">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Divider height={15} />

          {/* Order Status */}
          <View style={styles.statusSection}>
            <Text size="base" weight="medium" color="neutral" style={styles.sectionTitle}>
              Order Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text size="sm" weight="bold" color="white">
                {orderState}
              </Text>
            </View>
          </View>

          <Divider height={20} />

          {/* Order State Flow */}
          <FillupOrderStateFlow
            orderStateFlow={fillupOrderStateFlow}
            currentState={orderState}
          />

          <Divider height={20} />

          {/* Order Information */}
          <View style={styles.infoSection}>
            <Text size="base" weight="medium" color="neutral" style={styles.sectionTitle}>
              Order Information
            </Text>

            <View style={styles.infoRow}>
              <Text size="sm" color="steelBlue">Order ID:</Text>
              <Text size="sm" weight="medium" color="neutral">
                #{currentFillupOrder.id?.substring(0, 8)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text size="sm" color="steelBlue">Created:</Text>
              <Text size="sm" weight="medium" color="neutral">
                {formatDate(currentFillupOrder.created_at)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text size="sm" color="steelBlue">Last Updated:</Text>
              <Text size="sm" weight="medium" color="neutral">
                {formatDate(currentFillupOrder.updated_at)}
              </Text>
            </View>
          </View>

          <Divider height={20} />

          {/* Fillup Details */}
          {fillupRequest && (
            <View style={styles.infoSection}>
              <Text size="base" weight="medium" color="neutral" style={styles.sectionTitle}>
                Fillup Details
              </Text>

              <View style={styles.infoRow}>
                <Text size="sm" color="steelBlue">Product:</Text>
                <Text size="sm" weight="medium" color="neutral">
                  {fillupRequest.vehicle_tank_type_product_variation?.product_variation?.product?.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text size="sm" color="steelBlue">Quantity:</Text>
                <Text size="sm" weight="medium" color="neutral">
                  {fillupRequest.quantity_approved || fillupRequest.quantity || 0} {fillupRequest.unit || 'L'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text size="sm" color="steelBlue">Tank Type:</Text>
                <Text size="sm" weight="medium" color="neutral">
                  {fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type?.tank_type?.name || 'N/A'}
                </Text>
              </View>

              {fillupRequest.otp && (
                <View style={styles.infoRow}>
                  <Text size="sm" color="steelBlue">OTP:</Text>
                  <Text size="sm" weight="bold" color="primary">
                    {fillupRequest.otp}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Divider height={20} />

          {/* Vehicle Information */}
          <View style={styles.infoSection}>
            <Text size="base" weight="medium" color="neutral" style={styles.sectionTitle}>
              Vehicle Information
            </Text>

            <View style={styles.infoRow}>
              <Text size="sm" color="steelBlue">Vehicle:</Text>
              <Text size="sm" weight="medium" color="neutral">
                {fillupRequest?.driver_vehicle?.vehicle?.name || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text size="sm" color="steelBlue">Registration:</Text>
              <Text size="sm" weight="medium" color="neutral">
                {fillupRequest?.driver_vehicle?.vehicle?.registration_number || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text size="sm" color="steelBlue">Driver:</Text>
              <Text size="sm" weight="medium" color="neutral">
                {fillupRequest?.driver_vehicle?.user?.first_name || 'N/A'}
              </Text>
            </View>
          </View>

          <Divider height={30} />

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {canProceed && (
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={onNavigateToAssets}
                activeOpacity={0.7}>
                <Text size="base" weight="bold" color="white">
                  Proceed to Assets
                </Text>
              </TouchableOpacity>
            )}

            {isCancellable && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancelOrder}
                activeOpacity={0.7}>
                <Text size="base" weight="bold" color="white">
                  Cancel Order
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </BottomSheetView>
    </SimpleBottomSheet>
  );
};

const styles = ScaledSheet.create({
  modalContent: {
    padding: '20@s',
    paddingBottom: '30@vs',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: '4@s',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '16@s',
  },
  sectionTitle: {
    marginBottom: '8@vs',
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    padding: '16@s',
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  actionSection: {
    gap: '12@s',
  },
  proceedButton: {
    backgroundColor: FBColors.primary,
    paddingVertical: '14@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: FBColors.error,
    paddingVertical: '14@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
});

export default FillupOrderDetailsModal;