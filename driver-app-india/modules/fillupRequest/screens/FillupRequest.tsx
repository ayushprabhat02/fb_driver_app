import React, {useCallback, useEffect, useState, useRef, useMemo} from 'react';
import {View, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import Toast from 'react-native-toast-message';
import {useFocusEffect} from '@react-navigation/native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {useForm} from 'react-hook-form';
import {ms} from 'react-native-size-matters';

// --- Core Components & Services ---
// Assuming these are your existing custom components, services, and stores.
import {
  Divider,
  FullScreenLoader,
  HeaderAvoidingContainer,
  SimpleBottomSheet,
  Text,
} from '@/components';
import {
  CustomSelectInput,
  CustomBottomFormInput,
  FillupHistoryCard,
} from '@/modules/fillupRequest/components';
import fillupStore from '../store';
import {checkinStore} from '@/globalStore';
import fillupService from '../services';

// --- SDK Enums & Types ---
import {
  Fuel_Request_Type_Enum,
  Vehicle_Tank_Type,
  Fillup_Request_Status_Enum,
  Order_Type_Enum,
} from '@/generated/graphql';
import {FBColors} from '@/types/styles';
import {TankTypeDetails} from '@/types/custom';

// --- Form Data Structure ---
interface FillupFormData {
  tankType: string;
  fillupQuantity: string;
}

const FillupRequest: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Zustand Store Hooks
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();
  const fillupHistory = fillupStore.use.fillupHistory();
  const fillupLoaders = fillupStore.use.loaders();
  const startFillupLoader = fillupStore.use.startLoader();
  const stopFillupLoader = fillupStore.use.stopLoader();

  // Bottom Sheet Ref
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // React Hook Form for modal inputs
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: {errors},
  } = useForm<FillupFormData>({
    defaultValues: {tankType: '', fillupQuantity: ''},
  });

  // Watch form values to react to changes
  const watchedTankType = watch('tankType');
  const watchedQuantity = watch('fillupQuantity');
  const isFormValid = watchedTankType && watchedQuantity;

  // --- DERIVED & MEMOIZED VALUES ---
  // These values are recalculated only when their dependencies change.

  const isRotationFlow = watchedTankType === 'rotation-flow';

  const tankTypeOptions = useMemo(() => {
    // NOTE: Currently only showing 'browser-tank' (bowser tank) for fillup requests
    // Fuel tank and rotation tank are commented out and may be enabled in future
    const options =
      driverVehicleDetails?.vehicle_tank_types
        ?.filter((tank: Vehicle_Tank_Type) => {
          // Only include browser-tank (bowser tank)
          return tank.tank_type?.slug === 'browser-tank';
        })
        ?.map(
        (tank: Vehicle_Tank_Type) => {
          const tankTypeDetails: TankTypeDetails = {
            tank_type: {
              id: tank.tank_type?.id ?? '',
              name: tank.tank_type?.name ?? 'Unknown',
              is_active: tank.tank_type?.is_active ?? false,
              slug: tank.tank_type?.slug ?? '',
            },
            tank_type_id: tank.tank_type?.id ?? '',
            vehicle_tank_type_product_variations:
              (tank.vehicle_tank_type_product_variations ?? []) as any,
          };

          return {
            label: tank.tank_type?.name ?? 'Unknown Tank',
            value: tank.tank_type?.id ?? '',
            details: tankTypeDetails,
          };
        },
      ) || [];
    // TODO: Uncomment when rotation flow is needed
    // options.push({
    //   label: 'Rotation Flow',
    //   value: 'rotation-flow',
    //   details: undefined as any,
    // });
    return options;
  }, [driverVehicleDetails]);

  const currentTankDetails = useMemo(() => {
    if (!watchedTankType || isRotationFlow) {
      return null;
    }
    return tankTypeOptions.find(opt => opt.value === watchedTankType)?.details;
  }, [watchedTankType, isRotationFlow, tankTypeOptions]);

  console.log('----currentTankDetails-----', currentTankDetails);

  const maxCapacity = useMemo(() => {
    if (isRotationFlow) {
      return Number.MAX_SAFE_INTEGER;
    }
    if (currentTankDetails && driverVehicleDetails) {
      return currentTankDetails.tank_type?.slug === 'browser-tank'
        ? driverVehicleDetails.tanker_capacity
        : driverVehicleDetails.fuel_tank_capacity;
    }
    return 0; // Default to 0 if no tank is selected
  }, [isRotationFlow, currentTankDetails, driverVehicleDetails]);

  // --- DATA FETCHING & LIFECYCLE HOOKS ---

  // Function to fetch fillup history - optimized for last 5 days
  const getFillupHistory = useCallback(async () => {
    if (!driverVehicleId) {
      console.warn(
        'Driver vehicle ID not available, cannot fetch fillup history',
      );
      return;
    }

    // Get date range for last 5 days (ensure local timezone)
    const now = new Date();
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(now.getDate() - 5);

    // Format start date (5 days ago at 00:00:00)
    const startYear = fiveDaysAgo.getFullYear();
    const startMonth = String(fiveDaysAgo.getMonth() + 1).padStart(2, '0');
    const startDay = String(fiveDaysAgo.getDate()).padStart(2, '0');
    const startOfPeriod = `${startYear}-${startMonth}-${startDay}T00:00:00`;

    // Format end date (today at 23:59:59)
    const endYear = now.getFullYear();
    const endMonth = String(now.getMonth() + 1).padStart(2, '0');
    const endDay = String(now.getDate()).padStart(2, '0');
    const endOfPeriod = `${endYear}-${endMonth}-${endDay}T23:59:59`;

    startFillupLoader('fetchFillupHistoryNew');
    try {
      await fillupService.fetchFillupHistoryNew({
        limit: 5, // Increased limit to accommodate 5 days of history
        offset: 0,
        driver_vehicle_id: driverVehicleId,
        start_date: startOfPeriod,
        end_date: endOfPeriod,
      });
    } catch (error) {
      console.error('Failed to fetch fillup history:', error);
    } finally {
      stopFillupLoader('fetchFillupHistoryNew');
    }
  }, [driverVehicleId, startFillupLoader, stopFillupLoader]);

  // Fetch initial history when the component mounts or driver ID changes
  useEffect(() => {
    getFillupHistory();
  }, [getFillupHistory]);

  // Set up polling to refresh history every 3 seconds when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const intervalId = setInterval(() => {
        getFillupHistory();
      }, 10000); // 10 seconds

      return () => clearInterval(intervalId); // Cleanup on blur or unmount
    }, [getFillupHistory]),
  );

  // Effect to reset quantity whenever the tank type changes
  useEffect(() => {
    setValue('fillupQuantity', '');
  }, [watchedTankType, setValue]);

  // --- MODAL & FORM HANDLERS ---

  const openModal = () => bottomSheetRef.current?.present();
  const closeModal = () => {
    bottomSheetRef.current?.close();
    reset(); // Reset form to default values
  };

  const onSubmit = async (data: FillupFormData) => {
    setIsSubmitting(true);

    // 1. Check for pending fill-ups
    const hasPendingFillups = fillupHistory.some(
      (fillup: any) =>
        fillup.state !== 'COMPLETE' && fillup.state !== 'REJECTED',
    );
    if (hasPendingFillups) {
      Toast.show({
        type: 'error',
        text1: 'Request Denied',
        text2:
          'You cannot raise a new request while a previous one is still pending.',
      });
      setIsSubmitting(false);
      return;
    }

    const quantity = parseFloat(data.fillupQuantity);

    // 2. Validate quantity against max capacity and ensure it's positive
    if (quantity <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Fill-up quantity must be greater than zero.',
      });
      setIsSubmitting(false);
      return;
    }
    if (maxCapacity && quantity > maxCapacity) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: `Quantity cannot exceed the tank capacity of ${maxCapacity} litres.`,
      });
      setIsSubmitting(false);
      return;
    }

    // 3. Construct the request payload dynamically
    let requestPayload: any = {
      quantity: `${quantity}`,
      state: Fillup_Request_Status_Enum.Pending,
      unit: 'liter',
      is_active: true,
      driver_vehicle_id: driverVehicleId,
      otp: Math.floor(1000 + Math.random() * 9000), // Generate 4-digit OTP
      category: Order_Type_Enum.Delivery, // Default to DELIVERY category
    };

    if (isRotationFlow) {
      requestPayload.fuel_request_type = Fuel_Request_Type_Enum.RotationalFlow;
    } else if (currentTankDetails) {
      requestPayload.fuel_request_type =
        currentTankDetails.tank_type?.name?.includes('Fuel')
          ? Fuel_Request_Type_Enum.FuelTank
          : Fuel_Request_Type_Enum.BowsersTank;
      requestPayload.vehicle_tank_type_product_variation_id =
        currentTankDetails.vehicle_tank_type_product_variations?.[0]?.id;
    }

    // 4. Call the API
    startFillupLoader('raiseFillupRequest');
    try {
      await fillupService.raiseFillupRequest({object: requestPayload});
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your fill-up request has been submitted.',
      });
      closeModal();
      await getFillupHistory(); // Refresh history immediately after success
    } catch (error) {
      console.error('Error raising fill-up request:', error);
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: 'Could not submit your request. Please try again.',
      });
    } finally {
      stopFillupLoader('raiseFillupRequest');
      setIsSubmitting(false);
    }
  };

  // --- RENDER LOGIC ---

  return (
    <HeaderAvoidingContainer>
      {fillupLoaders.raiseFillupRequest && (
        <FullScreenLoader
          loaderText="Submitting fillup request..."
          showLoader={true}
        />
      )}
      <View style={styles.container}>
        {fillupLoaders.fetchFillupHistoryNew && !fillupHistory?.length ? (
          <FullScreenLoader
            loaderText="Fetching fillup history..."
            showLoader={false}
          />
        ) : !fillupHistory?.length ? (
          <Text size="sm" color="steelBlue" style={styles.infoText}>
            No fillup history found.
          </Text>
        ) : (
          <FlatList
            data={fillupHistory || []}
            keyExtractor={(item: any) => item.id}
            renderItem={({item}: {item: any}) => (
              <FillupHistoryCard item={item} />
            )}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Text size="sm" weight="bold" color="white">
          Request Fillup
        </Text>
      </TouchableOpacity>

      {/* Modal for Fillup Request */}
      <SimpleBottomSheet
        ref={bottomSheetRef}
        snapPoints={['60%', '65%']}
        closeSheet={closeModal}>
        <BottomSheetView style={styles.modalContent}>
          {/* Header */}
          <Text
            size="lg"
            weight="bold"
            color="neutral"
            style={styles.modalTitle}>
            Enter Fillup Quantity
          </Text>

          <Divider height={24} />

          {/* Tank Type Selection */}
          <CustomSelectInput
            name="tankType"
            label="Select Tank Type"
            control={control}
            errors={errors}
            placeholder="Please select a tank"
            required
            items={tankTypeOptions.map(opt => ({
              label: opt.label,
              value: opt.value,
            }))}
            setChange={(value: any) => {
              setValue('tankType', value);
            }}
            renderObject={(item: any) => item}
          />

          <Divider height={20} />

          {/* Quantity Input - Only show when tank is selected */}
          {watchedTankType && (
            <>
              <CustomBottomFormInput
                name="fillupQuantity"
                label="Enter Fillup Quantity (in Litres)"
                control={control}
                errors={errors}
                placeholder={`Max: ${
                  maxCapacity === Number.MAX_SAFE_INTEGER ? 'N/A' : maxCapacity
                } L`}
                required
                keyboardType="numeric"
              />

              <Divider height={32} />
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text size="base" weight="bold" color="white">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isFormValid && !isSubmitting ? styles.submitButtonActive : null,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isFormValid || isSubmitting}>
              <Text size="base" weight="bold" color="white">
                {isSubmitting ? 'Submitting...' : 'Request Fillup'}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </SimpleBottomSheet>
    </HeaderAvoidingContainer>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  infoText: {
    paddingTop: 12,
    marginLeft: 8,
  },
  list: {
    flex: 1,
    marginTop: ms(4),
  },
  fab: {
    position: 'absolute',
    bottom: ms(20, 0.5),
    right: ms(20, 0.5),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderRadius: ms(25),
    backgroundColor: FBColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalContent: {
    height: 400,
    padding: ms(20),
  },
  modalTitle: {
    textAlign: 'left',
  },
  tankInfo: {
    backgroundColor: '#F8F9FA',
    padding: ms(12),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: ms(12),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: FBColors.error,
    paddingVertical: ms(12),
    borderRadius: ms(8),
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: FBColors.steelBlue, // Disabled color
    paddingVertical: ms(12),
    borderRadius: ms(8),
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: FBColors.primary, // Active color
  },
});

export default FillupRequest;
