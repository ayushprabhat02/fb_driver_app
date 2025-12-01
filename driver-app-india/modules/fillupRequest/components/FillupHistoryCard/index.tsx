import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import {Text} from '@/components';
import {FBBackground, FBColors, FBColorPalette} from '@/types/styles';

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
}

const FillupHistoryCard: React.FC<FillupHistoryCardProps> = ({item}) => {
  const navigation = useNavigation();

  const getFuelRequestTypeDisplayLabel = (fuelRequestType: string) => {
    switch (fuelRequestType) {
      case 'BOWSERS_TANK':
        return 'BOWSER TANK';
      case 'SERVICE_STATION':
        return 'BOWSER TANK (RO)';
      default:
        // For other types like FUEL_TANK, ROTATIONAL_FLOW, etc., use default formatting
        return fuelRequestType.split('_').join(' ');
    }
  };

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
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isStateAllowed = allowedStates.includes(item.state?.toUpperCase());

  // Navigate based on fuel request type and current state - based on Vue.js logic
  const goToFillup = () => {
    if (isStateAllowed) {
      // Check if this is a fuel tank request - should navigate to HomeLandingPage
      if (item.fuel_request_type === 'FUEL_TANK') {
        // Only navigate to home if order is not already in progress
        // If user clicks "Go to Fillup" from fillup request page, just navigate to home
        // The FillupOrderCard on home page will handle the "Start Fillup" action
        console.log('📍 Navigating to home for fuel tank order:', item.id);
        // @ts-ignore
        navigation.navigate('home', {
          screen: 'HomeLandingPage',
        });
      } else {
        // For other types (BOWSERS_TANK, ROTATIONAL_FLOW, etc.), navigate to fillup details
        // @ts-ignore
        navigation.navigate('address', {
          screen: 'fillup-details',
          params: {fillupId: item.id},
        });
      }
    }
  };

  const getQuantityDisplay = (item: any): string => {
    // console.log('Calculating quantity for item:', JSON.stringify(item));
    if (!item) return '-';

    // Case 1: Partner order with COMPLETE state
    if (item.partner_order && item.state === 'COMPLETE') {
      const value =
        item?.partner_order?.partner_order_items?.[0]?.partner_order_item_values?.find(
          (v: any) => v.key === 'FILLED_QUANTITY',
        )?.value;
      return value ? `${value}L` : '-';
    }

    // Case 2: Not complete → show approved or normal quantity
    if (item.state !== 'COMPLETE') {
      const quantity = item?.quantity_approved || item?.quantity;
      return quantity ? `${quantity}L` : '-';
    }

    // Case 3: Task data for COMPLETE state
    if (item.task && item.state === 'COMPLETE') {
      const quantity = item?.task?.task_values?.find(
        (v: any) => v.key === 'CHALLAN',
      )?.quantity_dispensed;
      return quantity ? `${quantity}L` : '-';
    }

    // Fallback
    return '-';
  };

  return (
    <View style={[styles.card, !isStateAllowed && styles.disabledCard]}>
      <View style={styles.cardHeader}>
        <Text size="base" weight="bold" color="secondary">
          {getFuelRequestTypeDisplayLabel(item?.fuel_request_type || '')}
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
            {getQuantityDisplay(item)}
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

      {isStateAllowed ? (
        <TouchableOpacity style={styles.goToFillupButton} onPress={goToFillup}>
          <Text
            size="sm"
            weight="600"
            color="white"
            style={{textAlign: 'center'}}>
            Go to Fillup ›
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.notAvailableContainer}>
          <Text size="sm" weight="500" color="lightGray">
            Not Available
          </Text>
        </View>
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
