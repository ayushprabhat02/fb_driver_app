// CheckinPage.tsx

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
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {ImageContainer} from '../components';
import checkinService from '../services';
import {LoaderTypes} from '../store';
import { DateTime } from 'luxon';

type RootStackParamList = {
  home: undefined;
};

const CheckinPage: React.FC = () => {
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
  const cameraRef = useRef<RNCamera | null>(null);
  const odometerViewY = useRef(0);
  const [isSubmitState, setIsSubmitState] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  type ImageCaptureType = 'refueller' | 'odometer' | 'totalizer';

  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);
  // Commented out for simplified flow
  // const [odometerReading, setOdometerReading] = useState('');
  // const [totalizerReading, setTotalizerReading] = useState('');

  const refuellerImageData = checkinStore.use.refuellerImageData();
  const refuellerStoreUrl = checkinStore.use.refuellerStoreUrl();
  // Commented out for simplified flow
  // const refuellerImageData = checkinStore.use.refuellerImageData();
  // const odometerImageData = checkinStore.use.odometerImageData();
  // const totalizerImageData = checkinStore.use.totalizerImageData();

  const isRefuellerImageUploading =
    checkinStore.use.loaders().isRefuellerImageUploading;
  const isCheckingIn = checkinStore.use.loaders().isCheckingIn;
  // Commented out for simplified flow
  // const isRefuellerImageUploading =
  //   checkinStore.use.loaders().isRefuellerImageUploading;
  // const isOdometerImageUploading =
  //   checkinStore.use.loaders().isOdometerImageUploading;
  // const isTotalizerImageUploading =
  //   checkinStore.use.loaders().isTotalizerImageUploading;

  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();

  const isQuantityCheckEnabled = checkinStore.use.isQuantityCheckEnabled();

  const startLoader = checkinStore.use.startLoader();
  const stopLoader = checkinStore.use.stopLoader();
  const loaders = checkinStore.use.loaders();

  console.log('----driverVehicleId--------', driverVehicleId);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isAtBottom !== isSubmitState) {
      setIsSubmitState(isAtBottom);
    }
  };

  // Simplified flow - no need for next/scroll functionality
  // const handleNextPress = () => {
  //   scrollViewRef.current?.scrollTo({
  //     y: odometerViewY.current,
  //     animated: true,
  //   });
  //   if (!isSubmitState) {
  //     setIsSubmitState(true);
  //   }
  // };

  const handleSubmit = async () => {
    if (!refuellerStoreUrl) {
      Alert.alert(
        'Required Image',
        'Please upload and wait for refueller image to be processed before proceeding',
      );
      return;
    }

    if (!driverVehicleId) {
      Alert.alert(
        'Vehicle Error',
        'Driver vehicle ID not found. Please restart the app.',
      );
      return;
    }

    try {
      console.log('Starting check-in process...');
      startLoader('isCheckingIn');

      // Get current location
      console.log('Getting current location...');
      const locationCoords = await getCurrentLocation();
      const location = {
        lat: locationCoords.latitude,
        lng: locationCoords.longitude,
      };
      console.log('Location obtained:', location);

      // Complete check-in process
      console.log('Calling completeCheckIn service...');
      await checkinService.completeCheckIn({
        refuellerStoreUrl: refuellerStoreUrl,
        location,
        driverVehicleId,
      });

      console.log('Check-in successful, navigating to home...');
      // Navigate to home after successful check-in
      navigation.navigate('home');
    } catch (error) {
      console.error('Check-in failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Check-in Failed',
        `Error: ${errorMessage}\n\nPlease try again.`,
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
		.set({ millisecond: 0 })
		.toISO({ suppressMilliseconds: true });

        // Fetch driver vehicle ID first
        await checkinService.fetchDriverVehicleId({ dateTime: today });

        // Get the updated driverVehicleId from store
        const currentDriverVehicleId = checkinStore.getState().driverVehicleId;

        // If we have the ID, fetch details immediately
        if (currentDriverVehicleId) {
          await checkinService.fetchDriverVehicleDetailsById({
            driver_vehicle_id: currentDriverVehicleId as string,
          });
        }
      } catch (error) {
        console.error('Error initializing checkin:', error);
      } finally {
        stopLoader('isDriverVehicleIdLoading');
      }
    };

    initializeCheckin();
  }, []);

  const openCamera = async (type: ImageCaptureType) => {
    const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA);
    if (cameraPermission === RESULTS.DENIED) {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result !== RESULTS.GRANTED) {
        console.log('Camera permission denied');
        return;
      }
    }
    setImageType(type);
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current && imageType) {
      const options = {quality: 0.5, base64: true};
      const data = await cameraRef.current.takePictureAsync(options);
      setShowCamera(false);
      let loaderType: LoaderTypes | null = null;
      switch (imageType) {
        case 'refueller':
          loaderType = 'isRefuellerImageUploading';
          checkinStore.setState(state => ({
            ...state,
            refuellerImageData: data.uri,
          }));
          break;
        case 'odometer':
          loaderType = 'isOdometerImageUploading';
          checkinStore.setState(state => ({
            ...state,
            odometerImageData: data.uri,
          }));
          break;
        case 'totalizer':
          loaderType = 'isTotalizerImageUploading';
          checkinStore.setState(state => ({
            ...state,
            totalizerImageData: data.uri,
          }));
          break;
        default:
          break;
      }

      if (loaderType !== null) {
        startLoader(loaderType);
        await uploadImage(data.uri, imageType, loaderType);
      }
    }
  };

  const handleRemoveRefueller = () => {
    checkinStore.setState(state => ({
      ...state,
      refuellerImageData: null,
      refuellerStoreUrl: null,
    }));
  };

  const uploadImage = async (
    uri: string,
    type: string,
    loaderType: LoaderTypes,
  ) => {
    try {
      const blob = await (await fetch(uri)).blob();
      const {src, storeUrl} = await supportService.uploadFile({
        fileName: `${type}.jpg`,
        contentType: 'image/jpeg',
        fileData: blob,
      });
      console.log('Image uploaded:', {src, storeUrl});

      // Store the uploaded URL in the store based on image type
      if (type === 'refueller' && storeUrl) {
        checkinStore.setState(state => ({
          ...state,
          refuellerStoreUrl: storeUrl,
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      stopLoader(loaderType);
    }
  };

  if (showCamera) {
    const cameraType = RNCamera.Constants.Type.back;

    return (
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.preview}
          type={cameraType}
          captureAudio={false}
        />
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity onPress={handleTakePhoto} style={styles.capture}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCamera(false)}
            style={styles.capture}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <HeaderAvoidingContainer paddingHorizontal={0}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        <View style={styles.vehicleDetailsContainer}>
          <View style={styles.vehicleDetailsRow}>
            <View style={styles.vehicleDetailItem}>
              <Text size="xs" color="secondary" style={styles.vehicleLabel}>
                Driver Name
              </Text>
              <Text size="base" weight="600" style={styles.vehicleValue}>
                {driverVehicleDetails?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Text size="xs" color="secondary" style={styles.vehicleLabel}>
                Registration Number
              </Text>
              <Text size="base" weight="600" style={styles.vehicleValue}>
                {driverVehicleDetails?.registration_number || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
        {/* <Divider height={10} /> */}
        {/* <BouncyCheckbox
          size={25}
          fillColor={FBColors.primary}
          unfillColor="#FFFFFF"
          text="Quantity Check"
          iconStyle={{borderColor: FBColors.primary}}
          innerIconStyle={{borderWidth: 2}}
          textStyle={styles.quantityCheckText}
          disableBuiltInState
          isChecked={isQuantityCheckEnabled}
          onPress={() => {
            checkinStore.setState(state => ({
              isQuantityCheckEnabled: !state.isQuantityCheckEnabled,
            }));
          }}
        /> */}
        <Divider height={10} />
        <Text size="base" weight="700" color="secondary">
          Please complete the following steps to check-in
        </Text>

        <ImageContainer
          label="Upload Refueller Image"
          imageData={refuellerImageData}
          isUploading={isRefuellerImageUploading}
          onCameraPress={() => openCamera('refueller')}
          onRemovePhoto={handleRemoveRefueller}
          uploadingText="Uploading Refueller image..."
          required={true}
        />
        {/* Refueller and Odometer sections commented out for simplified check-in flow */}
        {/* Commented out for simplified check-in flow */}
        {/* <Divider height={10} />
        <View>
          <Text
            size="base"
            weight="normal"
            color="secondary"
            style={styles.requiredLabel}>
            Enter Odometer Reading *
          </Text>
          <TextInput
            editable={true}
            keyboardType="numeric"
            style={[
              styles.inputStyle,
              // !odometerReading && styles.requiredInput,
            ]}
            placeholder="Enter odometer reading"
            placeholderTextColor={FBColors.placeHolderPrimary}
            // value={odometerReading}
            // onChangeText={setOdometerReading}
          */}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!refuellerStoreUrl || isCheckingIn) && styles.disabledButton
          ]}
          variant="solid"
          onPress={handleSubmit}
          loading={isCheckingIn}
          disabled={!refuellerStoreUrl || isCheckingIn}>
          {isCheckingIn ? 'Checking in...' : 'Check-in'}
        </Button>
      </View>
      <FullScreenLoader
        showLoader={loaders.isDriverVehicleIdLoading}
        loaderText={`Fetching driver vehicle ID...`}
      />
      <FullScreenLoader
        showLoader={isCheckingIn}
        loaderText={`Checking in, please wait...`}
      />
    </HeaderAvoidingContainer>
  );
};

export default CheckinPage;

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  placeholderView: {
    height: 200,
    backgroundColor: FBBackground.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  buttonContainer: {
    position: 'relative',
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
  },
  cameraContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cameraButtonContainer: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
  buttonText: {
    fontSize: 14,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  quantityCheckText: {
    textDecorationLine: 'none',
    color: FBColors.darkGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cameraIconButton: {
    backgroundColor: FBBackground.softBlue,
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageOnlyView: {
    height: 200,
    backgroundColor: FBBackground.softBlue,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  compactSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 12,
  },
  minimalistCameraButton: {
    backgroundColor: FBColors.primary,
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compactLabel: {
    marginBottom: 3,
    marginTop: 12,
  },
  compactImageView: {
    height: 140,
    backgroundColor: FBBackground.softBlue,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  requiredLabel: {
    marginBottom: 4,
    marginTop: 8,
  },
  requiredInput: {
    borderColor: FBBorders.primary,
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#C0C4CA',
  },
  selfieBoxContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: FBBorders.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 6,
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
