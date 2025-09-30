import {
  Button,
  FullScreenLoader,
  HeaderAvoidingContainer,
  Text,
} from '@/components';
import { checkoutStore, checkinStore } from '@/globalStore';
import supportService from '@/modules/support/services';
import { FBBackground, FBBorders, FBColors } from '@/types/styles';
import { getCurrentLocation } from '@/utils/location';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import ImageContainer from '@/modules/checkin/components/ImageContainer';
import checkoutService from '../services';
import checkinService from '@/modules/checkin/services';
import { signOut } from '@/modules/auth/services';
import {
  Login_Type_Enum,
  Partner_Vehicle_State_Enum,
  Photo_Type_Enum,
} from '@/generated/graphql';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  home: undefined;
};

const CheckoutPage: React.FC = () => {
  const navigation = useNavigation();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const isCheckedOut = checkoutStore.use.isCheckedOut();
  
  // Add camera reference
  const cameraRef = React.useRef<RNCamera>(null);

  useEffect(() => {
    if (isCheckedOut) {
      // After checkout, we'll be signing out, so no need to navigate
    }
  }, [isCheckedOut]);

  const [showCamera, setShowCamera] = useState(false);
  type ImageCaptureType = 'selfie' | 'refueller';

  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);

  const selfieImageData = checkoutStore.use.selfieImageData();
  const selfieStoreUrl = checkoutStore.use.selfieStoreUrl();
  const refuellerImageData = checkoutStore.use.refuellerImageData();
  const refuellerStoreUrl = checkoutStore.use.refuellerStoreUrl();

  const isSelfieImageUploading = checkoutStore.use.loaders().isSelfieImageUploading;
  const isRefuellerImageUploading = checkoutStore.use.loaders().isRefuellerImageUploading;
  const isCheckingOut = checkoutStore.use.loaders().isCheckingOut;

  const startLoader = checkoutStore.use.startLoader();
  const stopLoader = checkoutStore.use.stopLoader();
  const loaders = checkoutStore.use.loaders();

  const handleSubmit = async () => {
    // Validation
    if (!selfieStoreUrl || !refuellerStoreUrl) {
      Alert.alert(
        'Required Images',
        'Please upload both selfie and refueller images before proceeding',
      );
      return;
    }

    if (!driverVehicleId) {
      Alert.alert(
        'Vehicle Error',
        'Driver vehicle ID not found. Please check in first.',
      );
      return;
    }

    try {
      startLoader('isCheckingOut');

      // Step 1: Get location
      const locationCoords = await getCurrentLocation();
      const lat = locationCoords.latitude;
      const lng = locationCoords.longitude;

      // Step 2: Fetch last check-in details
      const lastCheckinDetails = await checkoutService.fetchLastCheckInDetails({
        driver_vehicle_id: driverVehicleId,
        category: Login_Type_Enum.CheckIn,
      });

      if (!lastCheckinDetails) {
        Alert.alert(
          'Check-in Required',
          'No active check-in found. Please check in first before attempting to checkout.',
        );
        return;
      }

      // Step 3: Get driver name from store
      const driverDetails = checkinStore.getState().driverDetails;
      const firstName = driverDetails?.first_name || '';
      const middleName = driverDetails?.middle_name || '';
      const lastName = driverDetails?.last_name || '';
      const driverName = `${firstName} ${middleName} ${lastName}`.trim() || 'Driver';

      // Step 4: Prepare checkout data
      const checkoutData = {
        is_active: true,
        location: `(${lng},${lat})`,
        name: driverName,
        odometer: '0',
        totallizer: '0',
        parent_id: lastCheckinDetails.id,
        category: Login_Type_Enum.CheckOut,
        driver_vehicle_id: driverVehicleId,
        driver_duty_photos: {
          data: [
            {
              category: Photo_Type_Enum.SelfieEnd,
              is_active: true,
              url: selfieStoreUrl,
            },
            {
              category: Photo_Type_Enum.RefuellerStart,
              is_active: true,
              url: refuellerStoreUrl,
            },
          ],
        },
      };

      // Step 5: Execute checkout
      const response = await checkoutService.driverCheckOut({ object: checkoutData });

      if (response) {
        // Step 6: Update vehicle state
        await checkinService.updateDriverVehicleStateById({
          id: driverVehicleId,
          state: Login_Type_Enum.CheckOut,
          status: Partner_Vehicle_State_Enum.OffDuty,
        });

        // Step 7: Clear store
        checkoutStore.setState({
          selfieImageData: null,
          selfieStoreUrl: null,
          refuellerImageData: null,
          refuellerStoreUrl: null,
          isCheckedOut: true,
          loaders: {
            isSelfieImageUploading: false,
            isRefuellerImageUploading: false,
            isCheckingOut: false,
          },
        });

        // Step 8: Success message
        Toast.show({
          type: 'success',
          text1: 'Checkout Successful',
          text2: 'You have been checked out. Logging out...',
        });

        // Step 9: Sign out after 2 seconds
        setTimeout(async () => {
          await signOut();
        }, 2000);
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      Toast.show({
        type: 'error',
        text1: 'Checkout Failed',
        text2: errorMessage,
      });
    } finally {
      stopLoader('isCheckingOut');
    }
  };

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
      const options = { quality: 0.5, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      setShowCamera(false);
      let loaderType: any = null;
      switch (imageType) {
        case 'selfie':
          loaderType = 'isSelfieImageUploading';
          // Set the local image data for immediate display
          checkoutStore.getState().setSelfieImageData(data.uri, null);
          break;
        case 'refueller':
          loaderType = 'isRefuellerImageUploading';
          // Set the local image data for immediate display
          checkoutStore.getState().setRefuellerImageData(data.uri, null);
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

  const handleRemoveSelfie = () => {
    checkoutStore.getState().setSelfieImageData(null, null);
  };

  const handleRemoveRefueller = () => {
    checkoutStore.getState().setRefuellerImageData(null, null);
  };

  const uploadImage = async (
    uri: string,
    type: string,
    loaderType: any,
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
      // Keep the local image data for display, only update the store URL
      if (type === 'selfie' && storeUrl) {
        checkoutStore.getState().setSelfieImageData(uri, storeUrl);
      } else if (type === 'refueller' && storeUrl) {
        checkoutStore.getState().setRefuellerImageData(uri, storeUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      stopLoader(loaderType);
    }
  };

  if (showCamera) {
    // Use front camera for selfie, back camera for refueller
    const cameraType = imageType === 'selfie'
      ? RNCamera.Constants.Type.front
      : RNCamera.Constants.Type.back;

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
            <Text style={styles.buttonText}>
              Take {imageType === 'selfie' ? 'Selfie' : 'Photo'}
            </Text>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text size="xl" weight="700" color="primary" style={styles.title}>
          Checkout
        </Text>
        
        <Text size="base" color="secondary" style={styles.subtitle}>
          Please complete the steps to checkout
        </Text>

        <ImageContainer
          label="Upload Selfie"
          imageData={selfieImageData}
          isUploading={isSelfieImageUploading}
          onCameraPress={() => openCamera('selfie')}
          onRemovePhoto={handleRemoveSelfie}
          uploadingText="Uploading selfie..."
          required={true}
        />

        <ImageContainer
          label="Refueller Details"
          imageData={refuellerImageData}
          isUploading={isRefuellerImageUploading}
          onCameraPress={() => openCamera('refueller')}
          onRemovePhoto={handleRemoveRefueller}
          uploadingText="Uploading refueller image..."
          required={true}
        />

        <View style={styles.buttonContainer}>
          <Button
            style={[
              styles.button,
              (!selfieStoreUrl || !refuellerStoreUrl || isCheckingOut) && styles.disabledButton
            ]}
            variant="solid"
            onPress={handleSubmit}
            loading={isCheckingOut}
            disabled={!selfieStoreUrl || !refuellerStoreUrl || isCheckingOut}>
            {isCheckingOut ? 'Checking out...' : 'Checkout'}
          </Button>
          
          {/* Cancel button to go back */}
          <Button
            style={[styles.button, { marginTop: 10 }]}
            variant="outlined"
            onPress={() => navigation.goBack()}>
            Cancel
          </Button>
        </View>
      </ScrollView>

      <FullScreenLoader
        showLoader={isCheckingOut}
        loaderText={`Checking out, please wait...`}
      />
    </HeaderAvoidingContainer>
  );
};

export default CheckoutPage;

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
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
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#C0C4CA',
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
});