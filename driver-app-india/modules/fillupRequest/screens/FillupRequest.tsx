import React, {useCallback, useEffect, useState, useRef} from 'react';
import {View, FlatList, Text, TouchableOpacity} from 'react-native';
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
} from '@/components';
import {
  CustomSelectInput,
  CustomBottomFormInput,
} from '@/modules/fillupRequest/components';

// store
import homeStore from '@/modules/home/store';

// services
import homeService from '@/modules/home/services';

// actions, utils
import {getDriverVehicleId} from '@/utils/localStorage';

// styles
import {headerTransparentContainer} from '@/styles';
import {checkinStore} from '@/globalStore';

// FillupHistoryCard component
const FillupHistoryCard = ({item}: {item: any}) => {
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'COMPLETE':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'COMPLETE':
        return 'COMPLETE';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'PENDING';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.stationTitle}>
          {item.task?.category === 'FUEL_TANK'
            ? 'FUEL TANK'
            : 'SERVICE STATION'}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.state)},
          ]}>
          <Text style={styles.statusText}>{getStatusText(item.state)}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>
          Fuel: <Text style={styles.value}>Diesel</Text>
        </Text>
        <Text style={styles.label}>
          Qty: <Text style={styles.value}>{item.quantity}L</Text>
        </Text>
        <Text style={styles.label}>
          Date:{' '}
          <Text style={styles.value}>
            {new Date().toLocaleDateString('en-GB')}
          </Text>
        </Text>
      </View>
      <Text style={styles.notAvailable}>Not Available</Text>
    </View>
  );
};

const FillupRequest: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  // store
  const homeLoaders = homeStore.use.loaders();
  const startHomeLoader = homeStore.use.startLoader();
  const stopHomeLoader = homeStore.use.stopLoader();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const fillupHistoryData = homeStore.use.fillupHistory();

  // Modal and form handling
  const bottomSheetRef = useRef<BottomSheetModal>(null);
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

  // Tank type options
  const tankTypeOptions = [
    {label: 'Fuel Tank', value: 'fuel_tank'},
    {label: 'Browser Tank', value: 'browser_tank'},
    {label: 'Rotation Flow', value: 'rotation_flow'},
  ];

  const openModal = () => {
    bottomSheetRef.current?.present();
  };

  const closeModal = () => {
    bottomSheetRef.current?.close();
    reset();
  };

  const onSubmitFillupRequest = (data: any) => {
    console.log('Fillup request data:', data);
    // TODO: Implement API call to submit fillup request
    closeModal();
  };

  const fetchFillupHistory = async () => {
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

  return (
    <HeaderAvoidingContainer>
      <View style={{flex: 1, padding: 8}}>
        {/* null check */}
        {!homeLoaders.fillupHistory &&
          (!fillupHistoryData || fillupHistoryData.length === 0) && (
            <Text style={{paddingTop: 12, marginLeft: 8, fontSize: 14}}>
              No fillup history found.
            </Text>
          )}
        <FlatList
          data={fillupHistoryData || []}
          keyExtractor={(item: any) => item.id}
          renderItem={({item}: {item: any}) => (
            <FillupHistoryCard item={item} />
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
        <Text style={styles.fabText}>Request Fillup</Text>
      </TouchableOpacity>

      {/* Modal for fillup request */}
      <SimpleBottomSheet
        ref={bottomSheetRef}
        snapPoints={['60%']}
        closeSheet={closeModal}>
        <BottomSheetView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter fuel quantity</Text>

          <CustomSelectInput
            name="tankType"
            label="Select Tank Type"
            control={control}
            errors={errors}
            placeholder="Please select tank"
            required
            items={tankTypeOptions}
            setChange={value => console.log('Tank type changed:', value)}
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isFormValid ? styles.submitButtonActive : null,
              ]}
              onPress={handleSubmit(onSubmitFillupRequest)}>
              <Text style={styles.submitButtonText}>Request Fillup</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </SimpleBottomSheet>
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '6@s',
    padding: '12@s',
    marginVertical: '4@vs',
    shadowColor: '#000',
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
  stationTitle: {
    fontSize: '16@s',
    fontWeight: 'bold',
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
    borderRadius: '3@s',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: '11@s',
    fontWeight: 'bold',
  },
  cardContent: {
    marginBottom: '8@vs',
  },
  label: {
    fontSize: '13@s',
    color: '#666666',
    marginBottom: '2@vs',
  },
  value: {
    color: '#333333',
    fontWeight: '500',
  },
  notAvailable: {
    fontSize: '13@s',
    color: '#999999',
    textAlign: 'center',
    marginVertical: '6@vs',
  },
  requestButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '16@s',
    alignSelf: 'center',
    marginTop: '6@vs',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: '13@s',
    fontWeight: 'bold',
  },
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
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: '14@s',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: '20@s',
    paddingBottom: '30@vs',
  },
  modalTitle: {
    fontSize: '18@s',
    fontWeight: 'bold',
    color: '#333333',
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
    backgroundColor: '#DC3545',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: '16@s',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#28A745',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: '16@s',
    fontWeight: 'bold',
  },
});

export default FillupRequest;
