// CheckinPageCustomer.tsx - For customer driver role

import {
  Button,
  Divider,
  FullScreenLoader,
  HeaderAvoidingContainer,
  Text,
} from '@/components';
import {checkinStore} from '@/globalStore';
import supportService from '@/modules/support/services';
import {commonInputStyles} from '@/styles';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {getCurrentLocation} from '@/utils/location';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {ImageContainer} from '../components';
import checkinService from '../services';
import {DateTime} from 'luxon';
import {useTranslation} from 'react-i18next';

type RootStackParamList = {
  home: undefined;
};

const CheckinPageCustomer: React.FC = () => {
  const {t} = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const isCheckedIn = checkinStore.use.isCheckedIn();

  useEffect(() => {
    if (isCheckedIn) {
      navigation.navigate('home');
    }
  }, [isCheckedIn, navigation]);

  const scrollViewRef = useRef<ScrollView>(null);
  const [odometerReading, setOdometerReading] = useState('');
  const [totalizerReading, setTotalizerReading] = useState('');

  const selfieImageData = checkinStore.use.selfieImageData();
  const selfieStoreUrl = checkinStore.use.selfieStoreUrl();
  const refuellerImageData = checkinStore.use.refuellerImageData();
  const refuellerStoreUrl = checkinStore.use.refuellerStoreUrl();
  const odometerImageData = checkinStore.use.odometerImageData();
  const odometerStoreUrl = checkinStore.use.odometerStoreUrl();
  const totalizerImageData = checkinStore.use.totalizerImageData();
  const totalizerStoreUrl = checkinStore.use.totalizerStoreUrl();

  const isSelfieImageUploading =
    checkinStore.use.loaders().isSelfieImageUploading;
  const isRefuellerImageUploading =
    checkinStore.use.loaders().isRefuellerImageUploading;
  const isOdometerImageUploading =
    checkinStore.use.loaders().isOdometerImageUploading;
  const isTotalizerImageUploading =
    checkinStore.use.loaders().isTotalizerImageUploading;
  const isCheckingIn = checkinStore.use.loaders().isCheckingIn;

  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();
  const startLoader = checkinStore.use.startLoader();
  const stopLoader = checkinStore.use.stopLoader();
  const loaders = checkinStore.use.loaders();

  const handleSubmit = async () => {
    if (
      !selfieStoreUrl ||
      !refuellerStoreUrl ||
      !odometerStoreUrl ||
      !totalizerStoreUrl
    ) {
      Alert.alert(
        t('checkin.required_image'),
        'Please upload all required images',
      );
      return;
    }

    if (!odometerReading || !totalizerReading) {
      Alert.alert(
        t('checkin.required_reading'),
        'Please enter all required readings',
      );
      return;
    }

    if (!driverVehicleId) {
      Alert.alert(
        t('checkin.vehicle_error'),
        t('checkin.vehicle_error_message'),
      );
      return;
    }

    try {
      startLoader('isCheckingIn');
      const locationCoords = await getCurrentLocation();
      const location = {
        lat: locationCoords.latitude,
        lng: locationCoords.longitude,
      };

      await checkinService.completeCheckIn({
        refuellerStoreUrl,
        selfieStoreUrl,
        odometerStoreUrl,
        totalizerStoreUrl,
        odometerReading,
        totalizerReading,
        location,
        driverVehicleId,
      });

      navigation.navigate('home');
    } catch (error) {
      console.error('Check-in failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        t('checkin.checkin_failed'),
        `${t('common.error')}: ${errorMessage}\n\n${t(
          'checkin.please_try_again',
        )}`,
      );
    } finally {
      stopLoader('isCheckingIn');
    }
  };

  useEffect(() => {
    const initializeCheckin = async () => {
      try {
        startLoader('isDriverVehicleIdLoading');
        const today = DateTime.now()
          .set({millisecond: 0})
          .toISO({suppressMilliseconds: true});

        await checkinService.fetchDriverVehicleId({dateTime: today});
        const currentDriverVehicleId = checkinStore.getState().driverVehicleId;

        if (currentDriverVehicleId) {
          await checkinService.fetchDriverVehicleDetailsById({
            driver_vehicle_id: currentDriverVehicleId as string,
          });

          // Get updated vehicle details from store
          const vehicleDetails = checkinStore.getState().driverVehicleDetails;

          // Prefill totalizer reading using Vue logic:
          // totalizer_reading + 5 (matching Vue implementation)
          if (vehicleDetails?.totalizer_reading !== undefined) {
            const currentTotalizer = vehicleDetails.totalizer_reading;
            const calculatedTotalizer = currentTotalizer + 5;

            console.log('📊 Totalizer calculation (Vue style):', {
              currentTotalizer,
              addition: 5,
              calculatedTotalizer,
            });

            // Prefill the totalizer reading
            setTotalizerReading(calculatedTotalizer.toString());
          }
        }
      } catch (error) {
        console.error('Error initializing checkin:', error);
      } finally {
        stopLoader('isDriverVehicleIdLoading');
      }
    };

    initializeCheckin();
  }, []);

  // Image capture handlers - using new ImageContainer API with automatic upload
  const handleSelfieImageCaptured = (imageUri: string, storeUrl: string) => {
    checkinStore.setState({
      selfieImageData: imageUri,
      selfieStoreUrl: storeUrl,
    });
  };

  const handleRefuellerImageCaptured = (imageUri: string, storeUrl: string) => {
    checkinStore.setState({
      refuellerImageData: imageUri,
      refuellerStoreUrl: storeUrl,
    });
  };

  const handleOdometerImageCaptured = (imageUri: string, storeUrl: string) => {
    checkinStore.setState({
      odometerImageData: imageUri,
      odometerStoreUrl: storeUrl,
    });
  };

  const handleTotalizerImageCaptured = (imageUri: string, storeUrl: string) => {
    checkinStore.setState({
      totalizerImageData: imageUri,
      totalizerStoreUrl: storeUrl,
    });
  };

  // Remove image handlers
  const handleRemoveSelfie = () => {
    checkinStore.setState({
      selfieImageData: null,
      selfieStoreUrl: null,
    });
  };

  const handleRemoveRefueller = () => {
    checkinStore.setState({
      refuellerImageData: null,
      refuellerStoreUrl: null,
    });
  };

  const handleRemoveOdometer = () => {
    checkinStore.setState({
      odometerImageData: null,
      odometerStoreUrl: null,
    });
    setOdometerReading('');
  };

  const handleRemoveTotalizer = () => {
    checkinStore.setState({
      totalizerImageData: null,
      totalizerStoreUrl: null,
    });
    setTotalizerReading('');
  };

  const isFormValid =
    selfieStoreUrl &&
    refuellerStoreUrl &&
    odometerStoreUrl &&
    totalizerStoreUrl &&
    odometerReading &&
    totalizerReading;

  return (
    <HeaderAvoidingContainer paddingHorizontal={0}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.vehicleDetailsContainer}>
          <View style={styles.vehicleDetailsRow}>
            <View style={styles.vehicleDetailItem}>
              <Text size="xs" color="secondary" style={styles.vehicleLabel}>
                {t('checkin.driver_name')}
              </Text>
              <Text size="base" weight="600" style={styles.vehicleValue}>
                {driverVehicleDetails?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Text size="xs" color="secondary" style={styles.vehicleLabel}>
                {t('checkin.registration_number')}
              </Text>
              <Text size="base" weight="600" style={styles.vehicleValue}>
                {driverVehicleDetails?.registration_number || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <Divider height={10} />
        <Text size="base" weight="700" color="secondary">
          {t('checkin.complete_steps')}
        </Text>

        <ImageContainer
          label="Upload Selfie"
          imageData={selfieImageData}
          imageStoreUrl={selfieStoreUrl}
          isUploading={isSelfieImageUploading}
          onImageCaptured={handleSelfieImageCaptured}
          onRemovePhoto={handleRemoveSelfie}
          uploadingText="Uploading selfie..."
          required={true}
        />

        <ImageContainer
          label={t('checkin.upload_refueller_image')}
          imageData={refuellerImageData}
          imageStoreUrl={refuellerStoreUrl}
          isUploading={isRefuellerImageUploading}
          onImageCaptured={handleRefuellerImageCaptured}
          onRemovePhoto={handleRemoveRefueller}
          uploadingText={t('checkin.uploading_refueller')}
          required={true}
        />

        <Divider height={10} />
        <Text size="base" weight="normal" color="secondary">
          Enter Totalizer Reading *
        </Text>
        <TextInput
          keyboardType="numeric"
          style={styles.inputStyle}
          placeholder="Enter totalizer reading"
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={totalizerReading}
          onChangeText={setTotalizerReading}
        />

        <ImageContainer
          label="Upload Totalizer Image"
          imageData={totalizerImageData}
          imageStoreUrl={totalizerStoreUrl}
          isUploading={isTotalizerImageUploading}
          onImageCaptured={handleTotalizerImageCaptured}
          onRemovePhoto={handleRemoveTotalizer}
          uploadingText="Uploading totalizer..."
          required={true}
        />

        <Divider height={10} />
        <Text size="base" weight="normal" color="secondary">
          Enter Odometer Reading
        </Text>
        <TextInput
          keyboardType="numeric"
          style={styles.inputStyle}
          placeholder="Enter odometer reading"
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={odometerReading}
          onChangeText={setOdometerReading}
        />

        <ImageContainer
          label="Upload Odometer Image"
          imageData={odometerImageData}
          imageStoreUrl={odometerStoreUrl}
          isUploading={isOdometerImageUploading}
          onImageCaptured={handleOdometerImageCaptured}
          onRemovePhoto={handleRemoveOdometer}
          uploadingText="Uploading odometer..."
          required={true}
        />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!isFormValid || isCheckingIn) && styles.disabledButton,
          ]}
          variant="solid"
          onPress={handleSubmit}
          loading={isCheckingIn}
          disabled={!isFormValid || isCheckingIn}>
          {isCheckingIn
            ? t('checkin.checking_in')
            : t('checkin.checkin_button')}
        </Button>
      </View>
      <FullScreenLoader
        showLoader={loaders.isDriverVehicleIdLoading}
        loaderText={t('checkin.fetching_vehicle_id')}
      />
      <FullScreenLoader
        showLoader={isCheckingIn}
        loaderText={t('checkin.checking_in_wait')}
      />
    </HeaderAvoidingContainer>
  );
};

export default CheckinPageCustomer;

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: FBBackground.white,
  },
  button: {
    width: '100%',
  },
  inputStyle: {
    ...commonInputStyles,
    height: 50,
    fontSize: 14,
    fontWeight: '400',
    width: '100%',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#C0C4CA',
  },
  vehicleDetailsContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: FBBorders.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleDetailItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  vehicleLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleValue: {
    color: FBColors.primary,
  },
});
