import React, {useRef, useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  Divider,
  HeaderAvoidingContainer,
  Text,
  FullScreenLoader,
} from '@/components';
import {FBBackground, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import {orderStore, checkinStore} from '@/globalStore';
import {ImageContainer} from '@/modules/checkin/components';
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import supportService from '@/modules/support/services';
import orderService from '../services';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {getCurrentLocation} from '@/utils/location';

type LoaderTypes = 'totalizerImage' | 'quantityImage';
type ImageType = 'totalizer' | 'quantity';

const DispenseFuelScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const cameraRef = useRef<RNCamera | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageType, setImageType] = useState<ImageType>('totalizer');
  const [totalizerReading, setTotalizerReading] = useState('');
  const [quantityDispensed, setQuantityDispensed] = useState('');
  const [disableButton, setDisableButton] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [totalizerBeforeSubmitted, setTotalizerBeforeSubmitted] = useState(false);
  const [isSubmittingTotalizerBefore, setIsSubmittingTotalizerBefore] =
    useState(false);

  const totalizerImageData = orderStore.use.totalizerImageData();
  const totalizerUploadedUrl = orderStore.use.totalizerUploadedUrl();
  const totalizerImageUploading = orderStore.use.loaders().totalizerImage;
  const quantityImageData = orderStore.use.quantityImageData();
  const quantityImageUploading = orderStore.use.loaders().quantityImage;
  const totalizerBeforeReading = orderStore.use.totalizerBeforeReading();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentAssetForDispense = orderStore.use.currentAssetForDispense();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();

  // Get the selected order (fillup order takes priority, matching ChooseAssetScreen)
  const selectedOrder = currentFillupOrder || currentDriverOrder;

  useEffect(() => {
    orderStore.setState({
      totalizerImageData: null,
      totalizerUploadedUrl: null,
      quantityImageData: null,
      totalizerReading: '',
      quantityDispensed: 0,
      totalizerBeforeReading: 0,
      totalizerAfterReading: 0,
    });
    setQuantityDispensed('');
    setTotalizerBeforeSubmitted(false);

    if (!selectedOrder) {
      Alert.alert('Error', 'No order assigned');
      navigation.replace('home' as never);
    } else if (driverVehicleDetails?.totalizer_reading !== undefined) {
      setTotalizerReading(driverVehicleDetails.totalizer_reading.toString());
    }
  }, []);

  // Auto-submit totalizer before reading when both fields are filled
  useEffect(() => {
    const shouldSubmitTotalizerBefore =
      !totalizerBeforeSubmitted &&
      totalizerReading &&
      (!selectedOrder?.is_enable_totalizer_reading_image_upload ||
        totalizerImageData);

    if (shouldSubmitTotalizerBefore) {
      handleTotalizerBeforeSubmit();
    }
  }, [totalizerReading, totalizerImageData, totalizerBeforeSubmitted]);

  const handleTotalizerBeforeSubmit = async () => {
    if (!selectedOrder || totalizerBeforeSubmitted || isSubmittingTotalizerBefore) {
      return;
    }

    try {
      setIsSubmittingTotalizerBefore(true);
      setDisableButton(true);
      startLoader('upsertTaskAction');
      const totalizerReadingValue = parseFloat(totalizerReading);
      const coordinates = await getCurrentLocation();

      // Step 1: Upload totalizer image to GCS if not already uploaded
      let uploadedUrl = totalizerUploadedUrl || '';
      if (totalizerImageData && !totalizerUploadedUrl) {
        const blob = await (await fetch(totalizerImageData)).blob();
        const {storeUrl} = await supportService.uploadFile({
          fileName: 'totalizer_before.jpg',
          contentType: 'image/jpeg',
          fileData: blob,
        });
        uploadedUrl = storeUrl || '';
        // Store the uploaded URL in the store
        orderStore.setState({totalizerUploadedUrl: uploadedUrl});
      }

      // Step 2: Upload totalizer before reading with store URL
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_BEFORE_READING',
          url: uploadedUrl,
          value: totalizerReading,
          task_id: selectedOrder.id,
          customer_asset_id: currentAssetForDispense?.id,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Update order state to DISPENSING if currently ARRIVED
      if (selectedOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({id: selectedOrder.id});
        orderStore.setState(state => ({
          ...state,
          currentDriverOrder: {
            ...state.currentDriverOrder!,
            state: 'DISPENSING' as any,
          },
        }));
      }

      // Update vehicle totalizer reading
      if (driverVehicleDetails?.id) {
        await orderService.updateTotalizerReading({
          totalizer_reading: totalizerReadingValue,
          vehicle_id: driverVehicleDetails.id,
        });
      }

      // Store totalizer before reading
      orderStore.setState(state => ({
        ...state,
        totalizerBeforeReading: totalizerReadingValue,
      }));

      setTotalizerBeforeSubmitted(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Totalizer reading saved',
      });
    } catch (error) {
      console.error('Error submitting totalizer before:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save totalizer reading',
      });
    } finally {
      setIsSubmittingTotalizerBefore(false);
      setDisableButton(false);
      stopLoader('upsertTaskAction');
    }
  };

  const handleSubmit = () => {
    // Validate totalizer before was submitted
    if (!totalizerBeforeSubmitted) {
      Alert.alert('Error', 'Please wait for totalizer reading to be saved');
      return;
    }

    // Validate quantity fields
    if (!quantityDispensed) {
      Alert.alert('Error', 'Please enter quantity dispensed');
      return;
    }

    if (
      selectedOrder?.is_enable_totalizer_reading_image_upload &&
      !quantityImageData
    ) {
      Alert.alert('Error', 'Please upload quantity dispensed image');
      return;
    }

    if (parseFloat(quantityDispensed) <= 0) {
      Alert.alert('Error', "You can't dispense 0 litres");
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmQuantity = async () => {
    if (!selectedOrder) {
      Alert.alert('Error', 'No order assigned');
      return;
    }

    try {
      setDisableButton(true);
      startLoader('upsertTaskAction');
      const qty = parseFloat(quantityDispensed);
      const totalizerReadingValue = parseFloat(totalizerReading);
      const coordinates = await getCurrentLocation();

      // Step 1: Upload quantity dispensed image if needed
      let quantityUploadedUrl = '';
      if (quantityImageData) {
        const blob = await (await fetch(quantityImageData)).blob();
        const {storeUrl} = await supportService.uploadFile({
          fileName: 'quantity.jpg',
          contentType: 'image/jpeg',
          fileData: blob,
        });
        quantityUploadedUrl = storeUrl || '';
      }

      // Step 2: Upload totalizer after reading (totalizer before + quantity)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: quantityUploadedUrl,
          value: `${qty + totalizerReadingValue}`,
          quantity_dispensed: qty,
          task_id: selectedOrder.id,
          customer_asset_id: currentAssetForDispense?.id,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Step 3: Update asset quantity
      const customerOrderId =
        'customer_order' in selectedOrder && selectedOrder.customer_order
          ? selectedOrder.customer_order.id
          : selectedOrder.id;

      await orderService.updateAssetQty({
        qty,
        customerAssetId: currentAssetForDispense?.id,
        customerOrderId: customerOrderId,
      });

      // Step 4: Update vehicle totalizer reading to final value
      if (driverVehicleDetails?.id) {
        await orderService.updateTotalizerReading({
          totalizer_reading: qty + totalizerReadingValue,
          vehicle_id: driverVehicleDetails.id,
        });
      }

      // Update store state
      orderStore.setState(state => ({
        ...state,
        totalizerAfterReading: qty + totalizerReadingValue,
        quantityDispensed: 0,
      }));

      Toast.show({type: 'success', text1: 'Success', text2: 'Quantity saved'});
      navigation.replace('order' as never, {screen: 'choose-asset'} as never);
    } catch (error) {
      console.error('Error:', error);
      Toast.show({type: 'error', text1: 'Error', text2: 'Failed to save'});
    } finally {
      setDisableButton(false);
      stopLoader('upsertTaskAction');
      setShowConfirmModal(false);
    }
  };

  const openCamera = async (type: ImageType) => {
    const permission = await check(PERMISSIONS.ANDROID.CAMERA);
    if (permission === RESULTS.DENIED) {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result !== RESULTS.GRANTED) return;
    }
    setImageType(type);
    setShowCamera(true);
  };

  const removeTotalizerImage = () => {
    orderStore.setState({
      totalizerImageData: null,
      totalizerUploadedUrl: null,
    });
    setTotalizerBeforeSubmitted(false);
  };

  const removeQuantityImage = () => {
    orderStore.setState({
      quantityImageData: null,
    });
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });
      setShowCamera(false);

      if (imageType === 'totalizer') {
        // Just store the image data, upload will happen in handleTotalizerBeforeSubmit
        orderStore.setState({
          totalizerImageData: data.uri,
          totalizerUploadedUrl: null, // Reset uploaded URL when new image is taken
        });
      } else {
        // Just store the image data, upload will happen in confirmQuantity
        orderStore.setState({quantityImageData: data.uri});
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
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
    <View style={{flex: 1, backgroundColor: FBBackground.white}}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Totalizer Before Reading */}
        <View style={{marginBottom: 4, marginTop: 8, flexDirection: 'row'}}>
          <Text size="base" weight="600">
            Totalizer Reading{' '}
          </Text>
          <Text size="base" weight="600" style={{color: FBColors.error}}>
            *
          </Text>
        </View>
        <TextInput
          keyboardType="numeric"
          style={styles.inputStyle}
          placeholder="Totalizer reading"
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={totalizerReading}
          onChangeText={setTotalizerReading}
        />
        <Divider height={10} />
        <ImageContainer
          label="Upload Totalizer Reading"
          imageData={totalizerImageData}
          isUploading={totalizerImageUploading}
          onCameraPress={() => openCamera('totalizer')}
          onRemovePhoto={removeTotalizerImage}
          uploadingText="Uploading..."
          required={
            selectedOrder?.is_enable_totalizer_reading_image_upload || false
          }
        />

        <Divider height={20} />

        {/* Quantity Dispensed */}
        <View style={{marginBottom: 4, marginTop: 8, flexDirection: 'row'}}>
          <Text size="base" weight="600">
            Quantity Dispensed{' '}
          </Text>
          <Text size="base" weight="600" style={{color: FBColors.error}}>
            *
          </Text>
        </View>
        <TextInput
          keyboardType="numeric"
          style={styles.inputStyle}
          placeholder="Enter quantity dispensed"
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={quantityDispensed}
          onChangeText={setQuantityDispensed}
        />
        <Divider height={10} />
        <ImageContainer
          label="Quantity Dispensed Image"
          imageData={quantityImageData}
          isUploading={quantityImageUploading}
          onCameraPress={() => openCamera('quantity')}
          onRemovePhoto={removeQuantityImage}
          uploadingText="Uploading..."
          required={
            selectedOrder?.is_enable_totalizer_reading_image_upload || false
          }
        />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          variant="solid"
          onPress={handleSubmit}
          loading={disableButton}
          disabled={
            disableButton ||
            !totalizerBeforeSubmitted ||
            !quantityDispensed ||
            (selectedOrder?.is_enable_totalizer_reading_image_upload &&
              !quantityImageData)
          }>
          Submit
        </Button>
      </View>
      {showConfirmModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Quantity</Text>
            <Text style={styles.modalText}>
              Are you sure you want to dispense {quantityDispensed} litres?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                style={styles.modalButton}
                variant="outlined"
                onPress={() => setShowConfirmModal(false)}>
                Edit
              </Button>
              <Button
                style={styles.modalButton}
                variant="solid"
                onPress={confirmQuantity}
                loading={disableButton}>
                Confirm
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Fullscreen loader for auto-submitting totalizer before */}
      <FullScreenLoader
        showLoader={isSubmittingTotalizerBefore}
        loaderText="Saving totalizer reading..."
      />
    </View>
  );
};

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
  button: {width: '100%'},
  inputStyle: {...commonInputStyles, height: 50, fontSize: 14, width: '100%'},
  cameraContainer: {flex: 1, backgroundColor: 'black'},
  preview: {flex: 1},
  cameraButtonContainer: {flexDirection: 'row', justifyContent: 'center'},
  capture: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    margin: 20,
  },
  buttonText: {fontSize: 14},
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default DispenseFuelScreen;
