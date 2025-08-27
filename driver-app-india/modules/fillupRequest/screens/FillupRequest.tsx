import React, {useCallback, useEffect, useState, useRef} from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {ScaledSheet, ms} from 'react-native-size-matters';
import {useFocusEffect} from '@react-navigation/native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {useForm} from 'react-hook-form';

// components
import {
  Button,
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
  FillupDetailsBottomSheet,
} from '@/modules/fillupRequest/components';

// store
import homeStore from '@/modules/home/store';
import fillupStore from '../store';

// services
import homeService from '@/modules/home/services';
import fillupService, {
  extractTankTypeOptions,
  findTankTypeById,
} from '../services';

// actions, utils
import {getDriverVehicleId} from '@/utils/localStorage';

// styles
import {headerTransparentContainer} from '@/styles';
import {checkinStore} from '@/globalStore';
import {
  Fillup_Request_Status_Enum,
  Fuel_Request_Type_Enum,
  Order_Type_Enum,
} from '@/generated/graphql';
import {FBColors, FBBackground, FBColorPalette} from '@/types/styles';

const FillupRequest: React.FC = () => {
  const [selectedFillupItem, setSelectedFillupItem] = useState<any>(null);

  // store
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const fillupHistoryData = homeStore.use.fillupHistory();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();
  const selectedTankType = fillupStore.use.selectedTankType();
  const setSelectedTankType = fillupStore.use.setSelectedTankType();

  //loader
  const homeLoaders = homeStore.use.loaders();
  const startHomeLoader = homeStore.use.startLoader();
  const stopHomeLoader = homeStore.use.stopLoader();
  const fillupLoaders = fillupStore.use.loaders();
  const startFillupLoader = fillupStore.use.startLoader();
  const stopFillupLoader = fillupStore.use.stopLoader();

  console.log(
    '----driverVehicleDetails------',
    JSON.stringify(driverVehicleDetails),
  );

  // Modal and form handling
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const fillupDetailsSheetRef = useRef<BottomSheetModal>(null);
  const {
    control,
    handleSubmit,
    formState: {errors},
    reset,
    watch,
  } = useForm({
    defaultValues: {
      tankType: '',
      fuelQuantity: '',
    },
  });

  // Watch form values to enable/disable submit button
  const watchedValues = watch();
  const isFormValid = watchedValues.tankType && watchedValues.fuelQuantity;

  // Tank type options - dynamically extracted from driverVehicleDetails
  const tankTypeOptions = React.useMemo(() => {
    return extractTankTypeOptions(driverVehicleDetails);
  }, [driverVehicleDetails]);

  const openModal = () => {
    bottomSheetRef.current?.present();
  };

  const closeModal = () => {
    bottomSheetRef.current?.close();
    reset();
  };

  const openFillupDetailsModal = async (item: any) => {
    setSelectedFillupItem(item);
    try {
      await fillupService.fetchFillupRequestById({id: item.id});
      fillupDetailsSheetRef.current?.present();
    } catch (error) {
      console.error('Error fetching fillup details:', error);
      fillupDetailsSheetRef.current?.present();
    }
  };

  const closeFillupDetailsModal = () => {
    fillupDetailsSheetRef.current?.close();
    setSelectedFillupItem(null);
  };

  const onSubmitFillupRequest = (data: any) => {
    console.log('Fillup request data:', data);
    console.log('Selected tank type:', selectedTankType);

    if (!selectedTankType) {
      console.error('No tank type selected');
      return;
    }

    // Call the API with form data and selected tank type
    raiseFillupRequest(data.fuelQuantity, selectedTankType);
    closeModal();
  };

  const raiseFillupRequest = async (quantity: string, tankTypeDetails: any) => {
    startFillupLoader('raiseFillupRequest');

    // Get the vehicle_tank_type_product_variation_id from the selected tank type
    const vehicleTankTypeProductVariationId =
      tankTypeDetails.vehicle_tank_type_product_variations?.[0]?.id;

    if (!vehicleTankTypeProductVariationId) {
      console.error('No vehicle tank type product variation ID found');
      stopFillupLoader('raiseFillupRequest');
      return;
    }

    if (!driverVehicleId) {
      console.warn('Driver vehicle ID not available, cannot raise fillup request');
      stopFillupLoader('raiseFillupRequest');
      return;
    }

    fillupService
      .raiseFillupRequest({
        object: {
          quantity: quantity,
          state: Fillup_Request_Status_Enum.Pending,
          unit: 'liter',
          fuel_request_type: Fuel_Request_Type_Enum.FuelTank,
          is_active: true,
          driver_vehicle_id: driverVehicleId,
          vehicle_tank_type_product_variation_id:
            vehicleTankTypeProductVariationId,
          otp: Math.floor(1000 + Math.random() * 9000),
          category: Order_Type_Enum.Delivery,
        },
      })
      .finally(() => {
        stopFillupLoader('raiseFillupRequest');
        fetchFillupHistory();
        closeModal();
      });
  };

  const fetchFillupHistory = async () => {
    if (!driverVehicleId) {
      console.warn('Driver vehicle ID not available, cannot fetch fillup history');
      return;
    }

    startHomeLoader('fillupHistory');
    homeService
      .fetchFillupHistory({
        limit: 5,
        offset: 0,
        driver_vehicle_id: driverVehicleId,
      })
      .finally(() => {
        stopHomeLoader('fillupHistory');
      });
  };

  useFocusEffect(
    useCallback(() => {
      if (driverVehicleId) {
        fetchFillupHistory();
      }
    }, [driverVehicleId]),
  );

  console.log('----fillupHistoryData----', fillupHistoryData);

  return (
    <HeaderAvoidingContainer>
      <View style={{flex: 1, padding: 8}}>
        {/* null check */}
        {!homeLoaders.fillupHistory &&
          (!fillupHistoryData || fillupHistoryData.length === 0) && (
            <Text
              size="sm"
              color="steelBlue"
              style={{paddingTop: 12, marginLeft: 8}}>
              No fillup history found.
            </Text>
          )}
        <FlatList
          data={fillupHistoryData || []}
          keyExtractor={(item: any) => item.id}
          renderItem={({item}: {item: any}) => (
            <FillupHistoryCard
              item={item}
              onGoToFillup={openFillupDetailsModal}
            />
          )}
          windowSize={10}
          style={{
            flex: 1,
            marginTop: ms(4),
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FullScreenLoader
        showLoader={homeLoaders.fillupHistory}
        loaderText="Fetching fillup history"
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Text size="sm" weight="bold" color="white">
          Request Fillup
        </Text>
      </TouchableOpacity>

      {/* Modal for fillup request */}
      <SimpleBottomSheet
        ref={bottomSheetRef}
        snapPoints={['60%']}
        closeSheet={closeModal}>
        <BottomSheetView style={styles.modalContent}>
          <Text size="lg" weight="bold" color="neutral">
            Enter fuel quantity
          </Text>

          <CustomSelectInput
            name="tankType"
            label="Select Tank Type"
            control={control}
            errors={errors}
            placeholder="Please select tank"
            required
            items={tankTypeOptions}
            setChange={value => {
              console.log('Tank type changed:', value);
              // Find and store the selected tank type details
              const selectedOption = tankTypeOptions.find(
                option => option.value === value,
              );
              if (selectedOption) {
                setSelectedTankType(selectedOption.tankTypeDetails);
              }
            }}
            renderObject={item => item}
          />
          <Divider height={5} />

          <CustomBottomFormInput
            name="fuelQuantity"
            label="Enter fillup quantity"
            control={control}
            errors={errors}
            placeholder="0"
            required
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text size="base" weight="bold" color="white">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isFormValid ? styles.submitButtonActive : null,
              ]}
              onPress={handleSubmit(onSubmitFillupRequest)}>
              <Text size="base" weight="bold" color="white">
                Request Fillup
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </SimpleBottomSheet>
      <FullScreenLoader
        showLoader={fillupLoaders.raiseFillupRequest}
        loaderText="Raising fillup request"
      />

      {/* Fillup Details Modal */}
      <FillupDetailsBottomSheet
        bottomSheetRef={fillupDetailsSheetRef}
        onClose={closeFillupDetailsModal}
      />
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  containerTop: {
    ...headerTransparentContainer,
  },
  fab: {
    position: 'absolute',
    bottom: '20@vs',
    right: '20@s',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    borderRadius: '25@s',
    backgroundColor: FBColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: FBColorPalette.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {},
  modalContent: {
    padding: '20@s',
    paddingBottom: '30@vs',
  },
  modalTitle: {
    marginBottom: '20@vs',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '20@vs',
    gap: '12@s',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: FBColors.error,
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  cancelButtonText: {},
  submitButton: {
    flex: 1,
    backgroundColor: FBColors.steelBlue,
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: FBColors.primary,
  },
  submitButtonText: {},
});

export default FillupRequest;
