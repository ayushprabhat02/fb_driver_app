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
import {orderStore} from '@/globalStore';
import {checkinStore} from '@/globalStore'; // Add checkinStore import
import {ImageContainer} from '@/modules/checkin/components';
import {VehicleInfoCard} from '../components';
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import supportService from '@/modules/support/services';
import orderService from '../services';
import fillupService from '../../fillupRequest/services';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Fillup_Request_Status_Enum} from '@/generated/graphql';

// utils
import {getCurrentLocation} from '@/utils/location';

type LoaderTypes = 'totalizerImage' | 'quantityImage';

type RootStackParamList = {
  home: undefined;
  order: {
    screen: string;
  };
};

const TotalizerAfterManual: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const cameraRef = useRef<RNCamera | null>(null);
  const isCompletingOrderRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const [showCamera, setShowCamera] = useState(false);
  type ImageCaptureType = 'totalizer' | 'quantity';

  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);
  const [totalizerReading, setTotalizerReading] = useState(''); // This should be dispensed quantity
  const [disableButton, setDisableButton] = useState(false);
  const [totalizerBeforeReading, setTotalizerBeforeReading] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Use orderStore for image data
  const totalizerImageData = orderStore.use.totalizerImageData();
  const quantityImageData = orderStore.use.quantityImageData();
  const totalizerUploadedUrl = orderStore.use.totalizerUploadedUrl();
  const totalizerImageUploading = orderStore.use.loaders().totalizerImage;
  const quantityImageUploading = orderStore.use.loaders().quantityImage;
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentAssetForDispense = orderStore.use.currentAssetForDispense();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails(); // Use checkinStore instead of orderStore
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();

  // Initialize component
  useEffect(() => {
    if (!currentFillupOrder) {
      // Only show error if we're not completing AND not navigating
      if (!isCompletingOrderRef.current && !isNavigatingRef.current) {
        console.log('❌ No order assigned, redirecting to home');
        Alert.alert('Error', 'No order assigned');
        // @ts-ignore
        navigation.replace('home');
      }
    } else {
      // Set the before reading value from store
      const beforeReading = orderStore.getState().totalizerBeforeReading || 0;
      setTotalizerBeforeReading(beforeReading);
    }
  }, [currentFillupOrder]);

  // Get approved quantity from fillup request
  const getApprovedQuantity = () => {
    if (
      currentFillupOrder?.category === 'FILL_UP' &&
      currentFillupOrder?.fillup_requests?.length > 0
    ) {
      const fillupRequest = currentFillupOrder.fillup_requests[0];
      return fillupRequest.quantity_approved || fillupRequest.quantity || 0;
    }
    return 0;
  };

  // Validate quantity dispensed
  const validateQuantity = (dispensedQty: number) => {
    const approvedQty = getApprovedQuantity();

    // For fillup orders, check against approved quantity
    if (currentFillupOrder?.category === 'FILL_UP') {
      if (approvedQty > 0 && dispensedQty > approvedQty) {
        return `Dispensed quantity cannot exceed approved quantity of ${approvedQty}L`;
      }
    }
    // For delivery orders, check against quantity to be dispensed
    else {
      const quantityToBeDispensed =
        orderStore.getState().quantityToBeDispensed || 0;
      const fuelDispensedTillNow =
        orderStore.getState().fuelDispensedTillNow || 0;

      if (
        quantityToBeDispensed > 0 &&
        fuelDispensedTillNow + dispensedQty > quantityToBeDispensed
      ) {
        return `Total dispensed quantity cannot exceed required quantity of ${quantityToBeDispensed}L`;
      }
    }

    return null; // No validation error
  };

  // Next step function (following Vue.js totalizer-after-manual logic)
  const nextStep = async () => {
    // Validation (following Vue.js pattern)
    if (!currentFillupOrder?.is_enable_totalizer_reading_image_upload) {
      if (!totalizerReading) {
        Alert.alert('Error', 'Please enter quantity dispensed');
        return;
      }
    } else {
      //check conditions and return error alert if something is missing
      if (!totalizerReading && !quantityImageData) {
        Alert.alert(
          'Error',
          'Please enter quantity dispensed and upload image',
        );
        return;
      } else if (!quantityImageData) {
        Alert.alert('Error', 'Please click quantity image');
        return;
      } else if (!totalizerReading) {
        Alert.alert('Error', 'Please enter quantity dispensed');
        return;
      }
    }

    const dispensedQty = parseFloat(totalizerReading);

    if (dispensedQty <= 0) {
      Alert.alert('Error', "You can't dispense 0 litres");
      return;
    }

    // Additional validation for dispensed quantity
    const validationError = validateQuantity(dispensedQty);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    // Open confirm modal (following Vue.js pattern)
    setShowConfirmModal(true);
  };

  // Function to mark quantity dispensed (following Vue.js pattern)
  const markQtyDispensed = async () => {
    try {
      setDisableButton(true);
      startLoader('upsertTaskAction');

      // Upload image if available
      let uploadedUrl = '';
      if (quantityImageData) {
        const blob = await (await fetch(quantityImageData)).blob();
        const {src, storeUrl} = await supportService.uploadFile({
          fileName: 'quantity.jpg',
          contentType: 'image/jpeg',
          fileData: blob,
        });
        uploadedUrl = storeUrl || src || '';
      }

      const coordinates = await getCurrentLocation();

      // Set current asset for dispense (following Vue.js pattern)
      const completedAsset = {
        ...currentAssetForDispense,
        totalizerAfter: {
          reading: parseFloat(totalizerReading) + totalizerBeforeReading,
          storeURL: uploadedUrl,
        },
      };

      const dispensedQty = parseFloat(totalizerReading);

      // Upsert step task action (following Vue.js pattern)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: uploadedUrl,
          value: `${parseFloat(totalizerReading) + totalizerBeforeReading}`,
          quantity_dispensed: dispensedQty,
          task_id: currentFillupOrder?.id,
          ...(currentFillupOrder?.category === 'DELIVERY'
            ? {customer_asset_id: completedAsset?.id}
            : {
                vehicle_id: completedAsset?.id || driverVehicleDetails?.id,
              }),
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Update asset qty in customer order if delivery flow
      if (currentFillupOrder?.category === 'DELIVERY') {
        await orderService.updateAssetQty({
          qty: dispensedQty,
          customerAssetId: completedAsset.id,
          customerOrderId: currentFillupOrder?.customer_order?.id,
        });
      }

      // Update totalizer reading for vehicle (following Vue.js pattern)
      if (driverVehicleDetails?.id) {
        await orderService.updateTotalizerReading({
          totalizer_reading:
            parseFloat(totalizerReading) + totalizerBeforeReading,
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

      // Set quantity dispensed in store
      orderStore.setState(state => ({
        ...state,
        quantityDispensed: dispensedQty,
      }));

      // If no error go to next page based on order category
      if (currentFillupOrder?.category === 'DELIVERY') {
        stopLoader('upsertTaskAction');
        orderStore.setState(state => ({
          ...state,
          quantityDispensed: 0,
          totalizerAfterReading:
            parseFloat(totalizerReading) + totalizerBeforeReading,
        }));
        // @ts-ignore
        navigation.replace('order', {
          screen: 'choose-asset',
        });
      } else {
        stopLoader('upsertTaskAction');
        orderStore.setState(state => ({
          ...state,
          quantityDispensed: 0,
          totalizerAfterReading:
            parseFloat(totalizerReading) + totalizerBeforeReading,
        }));

        // Create challan and mark fillup complete
        await createChallanAndMarkFillupComplete();
      }
    } catch (error) {
      console.error('Error in markQtyDispensed function:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to proceed to next step. Please try again.',
      });
    } finally {
      setDisableButton(false);
      stopLoader('upsertTaskAction');
      setShowConfirmModal(false);
    }
  };

  // Create challan and transaction logs (following Vue.js pattern)
  const createChallanAndTransactionLogs = async () => {
    try {
      const coordinates = await getCurrentLocation();

      // Create challan task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'CHALLAN',
          url: '',
          value: '0.0',
          quantity_dispensed: parseFloat(totalizerReading),
          task_id: currentFillupOrder?.id,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Get product variation id from fillup request (supports both fuel-tank and bowser-tank)
      const fillupRequest = currentFillupOrder?.fillup_requests[0];
      const productVarId =
        fillupRequest?.vehicle_tank_type_product_variation?.product_variation
          ?.id;

      if (productVarId && driverVehicleDetails?.id) {
        const quantity = parseFloat(totalizerReading);
        const fillupRequestId = fillupRequest?.id;
        const vehicleId = driverVehicleDetails?.id;
        const requestVehicleId = fillupRequest?.driver_vehicle?.vehicle?.id;

        // Add OUT transaction (from current driver's vehicle)
        await orderService.addTransactionLogs({
          quantity,
          product_var_id: productVarId,
          fillup_request_id: fillupRequestId,
          customer_order_id: null,
          vehicle_id: vehicleId,
          transaction_type: 'OUT',
        });

        // Add IN transaction if different vehicles (fuel goes to different vehicle)
        if (
          currentFillupOrder?.driver_vehicle_id !==
            fillupRequest?.driver_vehicle_id &&
          requestVehicleId
        ) {
          await orderService.addTransactionLogs({
            quantity,
            product_var_id: productVarId,
            fillup_request_id: fillupRequestId,
            customer_order_id: null,
            vehicle_id: requestVehicleId,
            transaction_type: 'IN',
          });
        }
      }
    } catch (error) {
      console.error('Error creating challan and transaction logs:', error);
      throw error;
    }
  };

  console.log(
    '-currentFillupOrder?.fillup_requests[0]?.fuel_request_type',
    currentFillupOrder?.fillup_requests[0]?.fuel_request_type,
  );

  // Create challan and mark fillup complete (following Vue.js pattern)
  const createChallanAndMarkFillupComplete = async () => {
    setDisableButton(true);

    // Set flags immediately to prevent error alerts during cleanup
    isCompletingOrderRef.current = true;
    isNavigatingRef.current = true;

    try {
      console.log('🚀 Starting fillup completion flow...');

      // Step 1: Create challan and transaction logs
      console.log('📝 Creating challan and transaction logs...');
      await createChallanAndTransactionLogs();

      // Step 2: Mark order completed
      console.log('✅ Marking order as completed...');
      await orderService.markOrderCompleted({id: currentFillupOrder?.id});

      // Step 3: Add stock entry to ERP
      console.log('📦 Adding stock entry to ERP...');
      await orderService.addStockEntryForFillupOnErp({
        state: 'DELIVERED',
        task_id: currentFillupOrder?.id,
      });

      // Step 4: Update fillup request state
      console.log('🔄 Updating fillup request state to COMPLETE...');
      await fillupService.updateFillupRequestState({
        id: currentFillupOrder?.fillup_requests[0]?.id,
        state: Fillup_Request_Status_Enum.Complete,
      });

      console.log('✨ All APIs completed successfully');

      // Clear ALL order states immediately before navigation (following Vue.js pattern)
      console.log('🧹 Clearing order store...');
      orderStore.setState(state => ({
        ...state,
        currentDriverOrder: null,
        currentFillupOrder: null,
        orderAssets: [],
        dispenseCompletedAssets: [],
        partiallyFilledAssetsArray: [],
        assetsWithUploadedVideos: [],
        challanImageData: null,
        technicianImageData: null,
        imapImageData: null,
        challanUploadedUrl: null,
        technicianUploadedUrl: null,
        imapUploadedUrl: null,
        totalizerImageData: null,
        quantityImageData: null,
        totalizerUploadedUrl: null,
        totalizerBeforeReading: 0,
        currentAssetForDispense: null,
      }));

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Challan uploaded successfully',
      });

      // Reset navigation stack completely to prevent going back to fill asset page
      console.log('🏠 Resetting navigation to home...');
      navigation.reset({
        index: 0,
        routes: [{name: 'home' as never}],
      });
    } catch (e) {
      console.error('❌ Error in fillup completion flow:', e);
      // Reset flags on error so alerts can show
      isCompletingOrderRef.current = false;
      isNavigatingRef.current = false;
      Alert.alert(
        'Error',
        'Error uploading challan and marking fillup order complete',
      );
    } finally {
      setDisableButton(false);
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

  const confirmQuantity = async () => {
    await markQtyDispensed();
  };

  const editQuantity = () => {
    setShowConfirmModal(false);
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
        vehicleName:
          fillupRequest.driver_vehicle?.vehicle?.name || 'Unknown Vehicle',
        tankTypeName:
          fillupRequest.vehicle_tank_type_product_variation?.vehicle_tank_type
            ?.tank_type?.name || 'Unknown Tank',
        requestedQuantity:
          fillupRequest.quantity_approved || fillupRequest.quantity || 0,
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
            Enter Quantity Dispensed *
          </Text>
          <TextInput
            editable={true}
            keyboardType="numeric"
            style={[
              styles.inputStyle,
              !totalizerReading && styles.requiredInput,
            ]}
            placeholder="Enter quantity dispensed"
            placeholderTextColor={FBColors.placeHolderPrimary}
            value={totalizerReading}
            onChangeText={setTotalizerReading}
          />
        </View>

        {/* Display approved quantity information */}
        {currentFillupOrder?.category === 'FILL_UP' &&
          getApprovedQuantity() > 0 && (
            <View style={styles.approvedQuantityContainer}>
              <Text style={styles.approvedQuantityText}>
                Approved Quantity: {getApprovedQuantity()}L
              </Text>
            </View>
          )}

        <Divider height={10} />

        <ImageContainer
          label="Quantity Dispensed"
          imageData={quantityImageData}
          isUploading={quantityImageUploading}
          onCameraPress={() => openCamera('quantity')}
          uploadingText="Uploading quantity image..."
          required={
            currentFillupOrder?.is_enable_totalizer_reading_image_upload ||
            false
          }
        />
        <Divider height={10} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!totalizerReading ||
              (currentFillupOrder?.is_enable_totalizer_reading_image_upload &&
                !quantityImageData)) &&
              styles.disabledButton,
          ]}
          variant="solid"
          onPress={nextStep}
          loading={disableButton}
          disabled={
            disableButton ||
            !totalizerReading ||
            (currentFillupOrder?.is_enable_totalizer_reading_image_upload &&
              !quantityImageData)
          }>
          {'Mark Order as Complete'}
        </Button>
      </View>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Quantity</Text>
            <Text style={styles.modalText}>
              Are you sure you want to dispense {totalizerReading} litres?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                style={styles.modalButton}
                variant="outlined"
                onPress={editQuantity}>
                Edit
              </Button>
              <Button
                style={styles.modalButton}
                variant="solid"
                onPress={confirmQuantity}
                loading={disableButton}
                disabled={disableButton}>
                Confirm
              </Button>
            </View>
          </View>
        </View>
      )}
    </HeaderAvoidingContainer>
  );
};

export default TotalizerAfterManual;

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  approvedQuantityContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 6,
  },
  approvedQuantityText: {
    fontSize: 12,
    color: FBColors.darkGray,
    fontStyle: 'italic',
  },
});
