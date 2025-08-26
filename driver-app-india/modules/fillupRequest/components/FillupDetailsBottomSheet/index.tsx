import React from 'react';
import {View, TouchableOpacity, ActivityIndicator} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {SimpleBottomSheet, Text} from '@/components';
import {FBColors, FBBackground} from '@/types/styles';
import fillupStore from '../../store';
import {useNavigation} from '@react-navigation/native';

interface FillupDetailsBottomSheetProps {
  bottomSheetRef: React.RefObject<any>;
  onClose: () => void;
}

const FillupDetailsBottomSheet: React.FC<FillupDetailsBottomSheetProps> = ({
  bottomSheetRef,
  onClose,
}) => {
  const fillupRequestDetails = fillupStore.use.fillupRequestDetails();
  console.log('----fillupRequestDetails-----', fillupRequestDetails);
  const isLoading = fillupStore.use.loaders().fetchFillupRequestById;

  const navigation = useNavigation();
  return (
    <SimpleBottomSheet
      ref={bottomSheetRef}
      snapPoints={['50%']}
      closeSheet={onClose}>
      <BottomSheetView style={styles.modalContent}>
        <Text size="lg" weight="bold" color="neutral">
          Fillup Details
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text size="base" color="steelBlue">
              Loading fillup details...
            </Text>
          </View>
        ) : fillupRequestDetails ? (
          <View style={styles.fillupDetailsContainer}>
            <View style={styles.detailRow}>
              <Text size="base" color="neutral" weight="500">
                Name :
              </Text>
              <Text size="base" color="neutral">
                {fillupRequestDetails?.partner_order?.partner_user?.partner
                  ?.name
                  ? fillupRequestDetails?.partner_order?.partner_user?.partner
                      ?.name
                  : `${
                      fillupRequestDetails?.task?.fillup_requests[0]
                        ?.driver_vehicle?.user
                        ? fillupRequestDetails?.task?.fillup_requests[0]
                            ?.driver_vehicle?.user?.first_name +
                          ' ' +
                          fillupRequestDetails?.task?.fillup_requests[0]
                            ?.driver_vehicle?.user?.middle_name +
                          ' ' +
                          fillupRequestDetails?.task?.fillup_requests[0]
                            ?.driver_vehicle?.user?.last_name
                        : fillupRequestDetails?.partner_order?.partner_address
                            ?.name
                        ? fillupRequestDetails?.partner_order?.partner_address
                            ?.name
                        : '-'
                    }`}
              </Text>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailColumn}>
                <Text size="sm" color="steelBlue">
                  Fuel Type
                </Text>
                <Text size="base" color="neutral" weight="500">
                  {fillupRequestDetails?.task?.fillup_requests[0]
                    ?.vehicle_tank_type_product_variation?.product_variation
                    ?.product?.name ||
                    fillupRequestDetails?.partner_order?.fillup_requests[0]
                      ?.vehicle_tank_type_product_variation?.product_variation
                      ?.product?.name}
                </Text>
              </View>
              <View style={styles.detailColumn}>
                <Text size="sm" color="steelBlue">
                  Approved Quantity
                </Text>
                <Text size="base" color="neutral" weight="500">
                  {fillupRequestDetails?.task?.fillup_requests[0]
                    ?.quantity_approved ||
                    fillupRequestDetails?.partner_order?.fillup_requests[0]
                      ?.quantity_approved}{' '}
                  litres
                </Text>
              </View>
            </View>

            <View style={styles.tankTypeSection}>
              <Text size="sm" color="steelBlue">
                Tank Type
              </Text>
              <Text size="base" color="neutral" weight="500">
                {fillupRequestDetails?.task?.fillup_requests[0]
                  ?.vehicle_tank_type_product_variation?.vehicle_tank_type
                  ?.tank_type?.name ||
                  fillupRequestDetails?.partner_order?.fillup_requests[0]
                    ?.vehicle_tank_type_product_variation?.vehicle_tank_type
                    ?.tank_type?.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => {
                navigation.navigate('home');
              }}>
              <Text size="base" weight="bold" color="white">
                Navigate
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text size="base" color="error">
              Unable to load fillup details
            </Text>
          </View>
        )}
      </BottomSheetView>
    </SimpleBottomSheet>
  );
};

const styles = ScaledSheet.create({
  modalContent: {
    padding: '20@s',
    paddingBottom: '30@vs',
  },
  modalTitle: {
    marginBottom: '20@vs',
    textAlign: 'center',
  },
  fillupDetailsContainer: {
    paddingVertical: '10@vs',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: '20@vs',
  },
  detailLabel: {},
  detailValue: {
    marginLeft: '8@s',
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '20@vs',
  },
  detailColumn: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: '4@vs',
  },
  sectionValue: {},
  tankTypeSection: {
    marginBottom: '20@vs',
  },
  partnerDetailsSection: {
    marginBottom: '30@vs',
  },
  partnerAddress: {
    marginTop: '4@vs',
  },
  navigateButton: {
    backgroundColor: FBColors.primary,
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  navigateButtonText: {},
  loadingContainer: {
    paddingVertical: '40@vs',
    alignItems: 'center',
  },
  loadingText: {},
  errorContainer: {
    paddingVertical: '40@vs',
    alignItems: 'center',
  },
  errorText: {},
});

export default FillupDetailsBottomSheet;
