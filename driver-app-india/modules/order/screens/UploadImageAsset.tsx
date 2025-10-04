import React, {useRef, useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {Button, Divider, HeaderAvoidingContainer, Text} from '@/components';
import {FBBackground, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import {orderStore, checkinStore} from '@/globalStore';
import {ImageContainer} from '@/modules/checkin/components';
import {VehicleInfoCard} from '../components';
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import supportService from '@/modules/support/services';
import orderService from '../services';
import Toast from 'react-native-toast-message';
type LoaderTypes = 'totalizerImage' | 'quantityImage';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

// utils
import {getCurrentLocation} from '@/utils/location';

type RootStackParamList = {
  home: undefined;
  order: {
    screen: string;
  };
};

const UploadImageAsset: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const cameraRef = useRef<RNCamera | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  type ImageCaptureType = 'totalizer' | 'quantity';

  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);
  const [totalizerReading, setTotalizerReading] = useState('');
  const [quantityDispensed, setQuantityDispensed] = useState('');
  const [disableButton, setDisableButton] = useState(false);

  // Use orderStore for image data
  const totalizerImageData = orderStore.use.totalizerImageData();
  const quantityImageData = orderStore.use.quantityImageData();
  const totalizerUploadedUrl = orderStore.use.totalizerUploadedUrl();
  const totalizerImageUploading = orderStore.use.loaders().totalizerImage;
  const quantityImageUploading = orderStore.use.loaders().quantityImage;
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentAssetForDispense = orderStore.use.currentAssetForDispense();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();

  // Initialize component (following Vue.js pattern)
  useEffect(() => {
    if (!currentFillupOrder) {
      Alert.alert('Error', 'No order assigned');
      // @ts-ignore
      navigation.replace('home');
    } else {
      // Pre-fill totalizer reading from vehicle details if available
      if (driverVehicleDetails?.totalizer_reading !== undefined) {
        setTotalizerReading(driverVehicleDetails.totalizer_reading.toString());
      }
    }
  }, [currentFillupOrder, driverVehicleDetails]);

  // Next step function (following Vue.js totalizer-before-manual logic)
  const nextStep = async () => {
    // Validation (following Vue.js pattern)
    if (!currentFillupOrder?.is_enable_totalizer_reading_image_upload) {
      if (!totalizerReading) {
        Alert.alert('Error', 'Please enter totalizer reading');
        return;
      }
    } else {
      if (!totalizerReading && !totalizerImageData) {
        Alert.alert('Error', 'Please enter both reading and upload image');
        return;
      } else if (!totalizerImageData) {
        Alert.alert('Error', 'Please click totalizer image');
        return;
      } else if (!totalizerReading) {
        Alert.alert('Error', 'Please enter totalizer reading');
        return;
      }
    }

    try {
      setDisableButton(true);
      startLoader('upsertTaskAction');

      // Set current asset for dispense (following Vue.js pattern)
      const updatedAsset = {
        ...currentAssetForDispense,
        totalizerBefore: {
          reading: parseFloat(totalizerReading),
          storeURL: totalizerUploadedUrl || totalizerImageData || '',
        },
      };

      orderStore.setState(state => ({
        ...state,
        currentAssetForDispense: updatedAsset,
      }));

      const coordinates = await getCurrentLocation();

      // Upsert step task action (following Vue.js pattern)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_BEFORE_READING',
          url: totalizerUploadedUrl || totalizerImageData || '',
          value: totalizerReading,
          task_id: currentFillupOrder?.id,
          ...(currentFillupOrder?.category === 'DELIVERY'
            ? {customer_asset_id: currentAssetForDispense?.id}
            : {
                vehicle_id:
                  currentAssetForDispense?.id || driverVehicleDetails?.id,
              }),
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Update totalizer reading for vehicle (following Vue.js pattern)
      if (driverVehicleDetails?.id) {
        await orderService.updateTotalizerReading({
          totalizer_reading: parseFloat(totalizerReading),
          vehicle_id: driverVehicleDetails.id,
        });
      } else {
        console.warn('Vehicle ID not available for updateTotalizerReading');
        Toast.show({
          type: 'error',
          text1: 'Warning',
          text2:
            'Vehicle information not available. Totalizer reading not updated.',
        });
      }

      // Mark order dispensing if arrived (following Vue.js pattern)
      if (currentFillupOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({id: currentFillupOrder?.id});

        // Update order state in store
        orderStore.setState(state => ({
          ...state,
          currentFillupOrder: state.currentFillupOrder
            ? {...state.currentFillupOrder, state: 'DISPENSING' as any}
            : null,
        }));
      }

      // Set totalizer before reading in store
      orderStore.setState(state => ({
        ...state,
        totalizerBeforeReading: parseFloat(totalizerReading),
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Totalizer reading saved successfully',
      });

      // Navigate to totalizer after manual (next step)
      // @ts-ignore
      navigation.navigate('order', {
        screen: 'totalizer-after-manual',
      });
    } catch (error) {
      console.error('Error in nextStep function:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to proceed to next step. Please try again.',
      });
    } finally {
      setDisableButton(false);
      stopLoader('upsertTaskAction');
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
      const options = {quality: 0.5, base64: true};
      const data = await cameraRef.current.takePictureAsync(options);
      setShowCamera(false);
      let loaderType: LoaderTypes | null = null;
      switch (imageType) {
        case 'totalizer':
          loaderType = 'totalizerImage';
          orderStore.setState({
            totalizerImageData: data.uri,
          });
          break;
        case 'quantity':
          loaderType = 'quantityImage';
          orderStore.setState({
            quantityImageData: data.uri,
          });
          break;
        default:
          break;
      }

      if (loaderType !== null) {
        orderStore.getState().startLoader(loaderType);
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

      // Store the upload URL for API calls but keep the local URI for display
      if (type === 'totalizer') {
        orderStore.setState({totalizerUploadedUrl: storeUrl || src});
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      orderStore.getState().stopLoader(loaderType);
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

  // Get order status color (matching FillupOrderCard styling)
  const getOrderStatusColor = (state: string) => {
    switch (state?.toUpperCase()) {
      case 'DISPENSING':
        return {
          backgroundColor: '#fee2e2',
          textColor: '#991b1b',
          borderColor: '#fecaca',
        };
      case 'ASSIGNED':
        return {
          backgroundColor: '#dbeafe',
          textColor: '#1e40af',
          borderColor: '#bfdbfe',
        };
      case 'IN_TRANSIT':
        return {
          backgroundColor: '#fef3c7',
          textColor: '#92400e',
          borderColor: '#fde68a',
        };
      case 'ARRIVED':
        return {
          backgroundColor: '#dcfce7',
          textColor: '#166534',
          borderColor: '#bbf7d0',
        };
      case 'APPROVED':
        return {
          backgroundColor: '#dbeafe',
          textColor: '#1e40af',
          borderColor: '#bfdbfe',
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          borderColor: '#e5e7eb',
        };
    }
  };

  // Get vehicle information for the card
  const getVehicleInfo = () => {
    if (currentFillupOrder?.fillup_requests?.length > 0) {
      const fillupRequest = currentFillupOrder.fillup_requests[0];
      return {
        vehicleName: fillupRequest.driver_vehicle?.vehicle?.name || 'Unknown Vehicle',
        tankTypeName: fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type?.tank_type?.name || 'Unknown Tank',
        requestedQuantity: fillupRequest.quantity_approved || fillupRequest.quantity || 0,
      };
    }
    return {
      vehicleName: 'Unknown Vehicle',
      tankTypeName: 'Unknown Tank',
      requestedQuantity: 0,
    };
  };

  const vehicleInfo = getVehicleInfo();
  const orderState = currentFillupOrder?.state || 'PENDING';
  const statusColor = getOrderStatusColor(orderState);

  return (
    <HeaderAvoidingContainer paddingHorizontal={0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Vehicle Info Card */}
        <VehicleInfoCard
          vehicleName={vehicleInfo.vehicleName}
          tankTypeName={vehicleInfo.tankTypeName}
          requestedQuantity={vehicleInfo.requestedQuantity}
          orderState={orderState}
          statusColor={statusColor}
        />

        <Divider height={20} />

        <View>
          <Text
            size="base"
            weight="normal"
            color="secondary"
            style={styles.requiredLabel}>
            Totalizer Reading *
          </Text>
          <TextInput
            editable={true}
            keyboardType="numeric"
            style={[
              styles.inputStyle,
              !totalizerReading && styles.requiredInput,
            ]}
            placeholder="Totalizer reading"
            placeholderTextColor={FBColors.placeHolderPrimary}
            value={totalizerReading}
            onChangeText={setTotalizerReading}
          />
        </View>
        <Divider height={10} />

        <ImageContainer
          label="Upload Totalizer Reading"
          imageData={totalizerImageData}
          isUploading={totalizerImageUploading}
          onCameraPress={() => openCamera('totalizer')}
          uploadingText="Uploading totalizer image..."
          required={
            currentFillupOrder?.is_enable_totalizer_reading_image_upload ||
            false
          }
        />
        <Divider height={10} />
        {/* Remove quantity dispensed section for totalizer before reading */}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!totalizerReading ||
              (currentFillupOrder?.is_enable_totalizer_reading_image_upload &&
                !totalizerImageData)) &&
              styles.disabledButton,
          ]}
          variant="solid"
          onPress={nextStep}
          loading={disableButton}
          disabled={
            disableButton ||
            !totalizerReading ||
            (currentFillupOrder?.is_enable_totalizer_reading_image_upload &&
              !totalizerImageData)
          }>
          {'Next'}
        </Button>
      </View>
    </HeaderAvoidingContainer>
  );
};

export default UploadImageAsset;

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
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selfieBoxContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  vehicleDetailsContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: FBColors.darkGray,
  },
});
