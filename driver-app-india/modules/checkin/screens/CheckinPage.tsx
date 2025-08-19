// CheckinPage.tsx

import React, {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Button,
  Divider,
  FullScreenLoader,
  HeaderAvoidingContainer,
  Text,
} from '@/components';
import {FBBackground, FBColorPalette, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import checkinService from '../services';
import {checkinStore} from '@/globalStore';
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import supportService from '@/modules/support/services';
import {LoaderTypes} from '../store';
import {useNavigation} from '@react-navigation/native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

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
  type ImageCaptureType = 'selfie' | 'refueller' | 'odometer' | 'totalizer';

  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);
  const [odometerReading, setOdometerReading] = useState('');
  const [totalizerReading, setTotalizerReading] = useState('');

  const selfieImageData = checkinStore.use.selfieImageData();
  const refuellerImageData = checkinStore.use.refuellerImageData();
  const odometerImageData = checkinStore.use.odometerImageData();
  const totalizerImageData = checkinStore.use.totalizerImageData();

  const isSelfieImageUploading =
    checkinStore.use.loaders().isSelfieImageUploading;
  const isRefuellerImageUploading =
    checkinStore.use.loaders().isRefuellerImageUploading;
  const isOdometerImageUploading =
    checkinStore.use.loaders().isOdometerImageUploading;
  const isTotalizerImageUploading =
    checkinStore.use.loaders().isTotalizerImageUploading;

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

  const handleNextPress = () => {
    scrollViewRef.current?.scrollTo({
      y: odometerViewY.current,
      animated: true,
    });
    if (!isSubmitState) {
      setIsSubmitState(true);
    }
  };

  const handleSubmit = () => {
    if (
      !selfieImageData ||
      !refuellerImageData ||
      !odometerImageData ||
      !totalizerImageData ||
      !odometerReading ||
      !totalizerReading
    ) {
      Alert.alert('Pls fill all details');
    } else {
      // Mark check-in as completed explicitly
      checkinStore.setState(state => ({...state, isCheckedIn: true}));
      navigation.navigate('home');
    }
  };

  useEffect(() => {
    const dateTime = new Date().toISOString();
    startLoader('isDriverVehicleIdLoading');
    checkinService
      .fetchDriverVehicleId({dateTime})
      .catch(error => {
        console.error('Error fetching driver vehicle ID:', error);
      })
      .finally(() => {
        stopLoader('isDriverVehicleIdLoading');
      });
  }, []);

  useEffect(() => {
    if (!driverVehicleId) return;
    checkinService
      .fetchDriverVehicleDetailsById({
        driver_vehicle_id: driverVehicleId as string,
      })
      .catch(error => {
        console.error('Error fetching driver vehicle details:', error);
      })
      .finally(() => {
        stopLoader('isDriverVehicleIdLoading');
      });
  }, [driverVehicleId]);

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
        case 'selfie':
          loaderType = 'isSelfieImageUploading';
          checkinStore.setState(state => ({
            ...state,
            selfieImageData: data.uri,
          }));
          break;
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
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      stopLoader(loaderType);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.preview}
          type={RNCamera.Constants.Type.front}
          captureAudio={false}
        />
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity onPress={handleTakePhoto} style={styles.capture}>
            <Text style={styles.buttonText}>Take Photo</Text>
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
        <Text>{driverVehicleDetails?.name}</Text>
        <Text>{driverVehicleDetails?.registration_number}</Text>
        <Divider height={10} />
        <BouncyCheckbox
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
        />
        <Divider height={10} />
        <Text size="base" weight="700" color="secondary">
          Please complete the following steps to check-in
        </Text>

        <Divider height={20} />
        <Text size="base" weight="700" color="secondary">
          Upload Selfie
        </Text>
        <TouchableOpacity onPress={() => openCamera('selfie')}>
          <View style={styles.placeholderView}>
            {isSelfieImageUploading ? (
              <FullScreenLoader
                showLoader={true}
                loaderText={'Uploading selfie...'}
              />
            ) : selfieImageData ? (
              <Image source={{uri: selfieImageData}} style={styles.image} />
            ) : (
              <Text>Touch here to click your image</Text>
            )}
          </View>
        </TouchableOpacity>
        <Divider height={20} />
        <Text size="base" weight="700" color="secondary">
          Refueller details
        </Text>
        <TouchableOpacity onPress={() => openCamera('refueller')}>
          <View style={styles.placeholderView}>
            {isRefuellerImageUploading ? (
              <FullScreenLoader
                showLoader={true}
                loaderText={'Uploading refueller image...'}
              />
            ) : refuellerImageData ? (
              <Image source={{uri: refuellerImageData}} style={styles.image} />
            ) : (
              <Text>Touch here to click your image</Text>
            )}
          </View>
        </TouchableOpacity>
        <Divider height={20} />
        <Text size="base" weight="700" color="secondary">
          Odometer details
        </Text>
        <View
          onLayout={event => {
            odometerViewY.current = event.nativeEvent.layout.y;
          }}>
          <TouchableOpacity onPress={() => openCamera('odometer')}>
            <View style={styles.placeholderView}>
              {isOdometerImageUploading ? (
                <FullScreenLoader
                  showLoader={true}
                  loaderText={'Uploading odometer image...'}
                />
              ) : odometerImageData ? (
                <Image source={{uri: odometerImageData}} style={styles.image} />
              ) : (
                <Text>Touch here to click your image</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <Divider height={10} />
        <TextInput
          editable={true}
          keyboardType="numeric"
          style={styles.inputStyle}
          placeholder="Enter odometer reading"
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={odometerReading}
          onChangeText={setOdometerReading}
        />
        <Divider height={20} />
        <Text size="base" weight="700" color="secondary">
          Totalizer
        </Text>
        <TouchableOpacity onPress={() => openCamera('totalizer')}>
          <View style={styles.placeholderView}>
            {isTotalizerImageUploading ? (
              <FullScreenLoader
                showLoader={true}
                loaderText={'Uploading totalizer image...'}
              />
            ) : totalizerImageData ? (
              <Image source={{uri: totalizerImageData}} style={styles.image} />
            ) : (
              <Text>Touch here to click your image</Text>
            )}
          </View>
        </TouchableOpacity>
        <Divider height={10} />
        <TextInput
          editable={true}
          keyboardType="numeric"
          style={styles.inputStyle}
          placeholder="Enter Totalizer reading"
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={totalizerReading}
          onChangeText={setTotalizerReading}
        />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          variant="solid"
          onPress={isSubmitState ? handleSubmit : handleNextPress}
          loading={false}
          disabled={false}>
          {isSubmitState ? 'Verify Location and Check-in' : 'Next'}
        </Button>
      </View>
      <FullScreenLoader
        showLoader={loaders.isDriverVehicleIdLoading}
        loaderText={`Fetching driver vehicle ID...`}
      />
    </HeaderAvoidingContainer>
  );
};

export default CheckinPage;

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
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
});
