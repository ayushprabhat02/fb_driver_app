import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {
  FBBackground,
  FBBorders,
  FBColors,
  FBColorPalette,
} from '@/types/styles';

const allowedStates = [
  'APPROVED',
  'AUTHORIZED',
  'INDENT_UPLOAD_AUTHORIZED',
  'AWAITING_INDENT_UPLOAD_AUTHORIZATION',
  'ELOCKING_OPEN_REQUEST',
  'ELOCKING_OPEN_REQUEST_APPROVED',
  'INDENT_UPLOAD_REJECTED',
  'PURCHASE_INVOICE_REQUEST',
  'PURCHASE_RECEIPT_REQUEST',
];

interface FillupHistoryCardProps {
  item: any;
  onGoToFillup: (item: any) => void;
}

const FillupHistoryCard: React.FC<FillupHistoryCardProps> = ({
  item,
  onGoToFillup,
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return FBColors.primary;
      case 'pending':
        return FBColors.amber;
      case 'rejected':
        return FBColors.error;
      default:
        return FBColors.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isApproved = item.state?.toLowerCase() === 'approved';
  const isStateAllowed = allowedStates.includes(item.state?.toUpperCase());

  return (
    <View style={[styles.card, !isStateAllowed && styles.disabledCard]}>
      <View style={styles.cardHeader}>
        <Text size="base" weight="bold" color="secondary">
          FUEL TANK
        </Text>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.state)},
          ]}>
          <Text size="xs" weight="bold" color="white">
            {item.state?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text size="sm" color="steelBlue">
            Fuel :{' '}
          </Text>
          <Text size="sm" weight="500" color="neutral">
            {item.vehicle_tank_type_product_variation?.product_variation
              ?.product?.name || 'Diesel'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text size="sm" color="steelBlue">
            Qty :{' '}
          </Text>
          <Text size="sm" weight="500" color="neutral">
            {item.quantity_approved || item.quantity || '20'}L
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text size="sm" color="steelBlue">
            Date :{' '}
          </Text>
          <Text size="sm" weight="500" color="neutral">
            {formatDate(item.created_at) || '----'}
          </Text>
        </View>
      </View>

      {isApproved && isStateAllowed ? (
        <TouchableOpacity
          style={styles.goToFillupButton}
          onPress={() => onGoToFillup(item)}>
          <Text
            size="sm"
            weight="600"
            color="white"
            style={{textAlign: 'center'}}>
            Go to Fillup ›
          </Text>
        </TouchableOpacity>
      ) : (
        !isStateAllowed && (
          <View style={styles.notAvailableContainer}>
            <Text size="sm" weight="500" color="lightGray">
              Not Available
            </Text>
          </View>
        )
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  card: {
    backgroundColor: FBBackground.white,
    borderRadius: '6@s',
    padding: '12@s',
    marginVertical: '4@vs',
    shadowColor: FBColorPalette.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  stationTitle: {},
  statusBadge: {
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
    borderRadius: '3@s',
  },
  statusText: {},
  cardContent: {
    marginBottom: '8@vs',
  },
  label: {
    marginBottom: '2@vs',
  },
  value: {},
  goToFillupButton: {
    backgroundColor: FBColors.primary,
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: 5,
    alignSelf: 'stretch',
    marginTop: '6@vs',
    marginHorizontal: '4@s',
  },
  goToFillupButtonText: {},
  notAvailableContainer: {
    paddingVertical: '4@vs',
    alignSelf: 'center',
    marginTop: '6@vs',
  },
  notAvailableText: {},
  disabledCard: {
    opacity: 0.6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
});

export default FillupHistoryCard;
