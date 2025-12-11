import React, {useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  TextInput,
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
import orderService from '../services';
import checkinService from '@/modules/checkin/services';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {getCurrentLocation} from '@/utils/location';

const DispenseFuelScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [totalizerReading, setTotalizerReading] = useState('');
  const [quantityDispensed, setQuantityDispensed] = useState('');
  const [disableButton, setDisableButton] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [totalizerBeforeSubmitted, setTotalizerBeforeSubmitted] =
    useState(false);
  const [isSubmittingTotalizerBefore, setIsSubmittingTotalizerBefore] =
    useState(false);
  const [quantityUploadedUrl, setQuantityUploadedUrl] = useState('');

  const totalizerImageData = orderStore.use.totalizerImageData();
  const totalizerUploadedUrl = orderStore.use.totalizerUploadedUrl();
  const totalizerImageUploading = orderStore.use.loaders().totalizerImage;
  const quantityImageData = orderStore.use.quantityImageData();
  const quantityImageUploading = orderStore.use.loaders().quantityImage;
  const totalizerBeforeReading = orderStore.use.totalizerBeforeReading();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentAssetForDispense = orderStore.use.currentAssetForDispense();
  const fuelDispensedTillNow = orderStore.use.fuelDispensedTillNow();
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();

  // Get the selected order (fillup order takes priority, matching ChooseAssetScreen)
  const selectedOrder = currentFillupOrder || currentDriverOrder;

  // Determine if this is a buddycan order (not DELIVERY category)
  const isBuddyCanOrder = selectedOrder?.is_enable_buddycan_flow;
  console.log(
    '----selectedOrder------',
    selectedOrder?.is_enable_buddycan_flow,
  );

  useEffect(() => {
    const fetchLatestVehicleDetails = async () => {
      // Reset state first
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
        return;
      }

      // Fetch updated vehicle details to get latest totalizer reading
      if (driverVehicleId) {
        try {
          await checkinService.fetchDriverVehicleDetailsById({
            driver_vehicle_id: driverVehicleId,
          });

          // After fetching, get the updated value from store
          const updatedVehicleDetails =
            checkinStore.getState().driverVehicleDetails;
          if (updatedVehicleDetails?.totalizer_reading !== undefined) {
            setTotalizerReading(
              updatedVehicleDetails.totalizer_reading.toString(),
            );
          }
        } catch (error) {
          console.error('Error fetching vehicle details:', error);
          // Fallback to cached value if API fails
          if (driverVehicleDetails?.totalizer_reading !== undefined) {
            setTotalizerReading(
              driverVehicleDetails.totalizer_reading.toString(),
            );
          }
        }
      } else if (driverVehicleDetails?.totalizer_reading !== undefined) {
        // Fallback if no vehicle ID
        setTotalizerReading(driverVehicleDetails.totalizer_reading.toString());
      }
    };

    fetchLatestVehicleDetails();
  }, []);

  // Auto-submit totalizer before reading when both fields are filled
  // Skip for buddycan orders as they don't need totalizer
  // Skip when totalizer is disabled (is_enable_totalizer_reading_image_upload is false)
  useEffect(() => {
    if (isBuddyCanOrder) {
      // For buddycan orders, mark totalizer as submitted automatically
      setTotalizerBeforeSubmitted(true);
      return;
    }

    // Skip if totalizer reading is not enabled for this order
    if (!selectedOrder?.is_enable_totalizer_reading_image_upload) {
      // Mark as submitted to allow proceeding without totalizer
      setTotalizerBeforeSubmitted(true);
      return;
    }

    const shouldSubmitTotalizerBefore =
      !totalizerBeforeSubmitted &&
      totalizerReading &&
      totalizerImageData; // Image is required when totalizer is enabled

    if (shouldSubmitTotalizerBefore) {
      handleTotalizerBeforeSubmit();
    }
  }, [
    totalizerReading,
    totalizerImageData,
    totalizerBeforeSubmitted,
    isBuddyCanOrder,
    selectedOrder?.is_enable_totalizer_reading_image_upload,
  ]);

  const handleTotalizerBeforeSubmit = async () => {
    if (
      !selectedOrder ||
      totalizerBeforeSubmitted ||
      isSubmittingTotalizerBefore ||
      isBuddyCanOrder || // Skip for buddycan orders
      !selectedOrder?.is_enable_totalizer_reading_image_upload // Skip when totalizer is disabled
    ) {
      return;
    }

    try {
      setIsSubmittingTotalizerBefore(true);
      setDisableButton(true);
      startLoader('upsertTaskAction');
      const totalizerReadingValue = parseFloat(totalizerReading);
      const coordinates = await getCurrentLocation();

      // Step 1: Use already uploaded totalizer image URL (images are uploaded by ImageContainer component)
      const uploadedUrl = totalizerUploadedUrl || '';

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

      // // Update order state to DISPENSING if currently ARRIVED
      // if (selectedOrder?.state === 'ARRIVED') {
      //   await orderService.markOrderDispensing({id: selectedOrder.id});
      //   orderStore.setState(state => ({
      //     ...state,
      //     currentDriverOrder: {
      //       ...state.currentDriverOrder!,
      //       state: 'DISPENSING' as any,
      //     },
      //   }));
      // }

      // Update vehicle totalizer reading
      if (driverVehicleId) {
        await orderService.updateTotalizerReading({
          totalizer_reading: totalizerReadingValue,
          vehicle_id: driverVehicleDetails?.id,
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

    // Validate quantity is multiple of 20 for buddycan orders
    const qty = parseFloat(quantityDispensed);
    if (isBuddyCanOrder && qty % 20 !== 0) {
      Alert.alert(
        'Invalid Quantity',
        'For BuddyCan orders, quantity must be in multiples of 20 liters',
      );
      return;
    }

    // Validate quantity doesn't exceed available amount
    // For asset-based dispensing (bowser/normal flow), use asset's requested quantity
    // For global dispensing, use quantityToBeDispensed
    const assetRequestedQuantity =
      currentAssetForDispense?.quantity_requested || 0;
    const useAssetBasedValidation = assetRequestedQuantity > 0;

    let availableQuantity = 0;
    let totalOrderQuantity = 0;

    if (useAssetBasedValidation) {
      // Asset-based validation (bowser orders)
      const currentAssetQuantity =
        currentAssetForDispense?.quantity_dispensed || 0;
      availableQuantity = assetRequestedQuantity;
      totalOrderQuantity = assetRequestedQuantity;

      console.log('📊 Asset-based quantity validation:', {
        quantityDispensed: qty,
        assetRequestedQuantity,
        currentAssetQuantity,
        availableQuantity,
        willExceed: qty > availableQuantity,
      });
    } else {
      // Global order validation (fillup orders)
      totalOrderQuantity =
        quantityToBeDispensed > 0 ? quantityToBeDispensed : 0;
      const alreadyDispensed = fuelDispensedTillNow || 0;
      const remainingQuantity = totalOrderQuantity - alreadyDispensed;
      const currentAssetQuantity =
        currentAssetForDispense?.quantity_dispensed || 0;
      availableQuantity = remainingQuantity + currentAssetQuantity;

      console.log('📊 Global quantity validation:', {
        quantityDispensed: qty,
        totalOrderQuantity,
        fuelDispensedTillNow: alreadyDispensed,
        currentAssetQuantity,
        remainingQuantity,
        availableQuantity,
        willExceed: qty > availableQuantity,
      });
    }

    if (availableQuantity > 0 && qty > availableQuantity) {
      Alert.alert(
        'Quantity Exceeds Available',
        `Cannot dispense ${qty}L. Only ${availableQuantity}L available for this asset.`,
      );
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
      const totalizerReadingValue = isBuddyCanOrder
        ? 0
        : parseFloat(totalizerReading);
      const coordinates = await getCurrentLocation();

      // Step 1: Use already uploaded quantity image URL (images are uploaded by ImageContainer component)
      const quantityImageUrl = quantityUploadedUrl || '';

      // Step 2: Upload totalizer after reading (for both bowser and buddycan orders)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: quantityImageUrl,
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

      // Step 2.5: Mark order as dispensing if still in ARRIVED state (for both bowser and buddycan orders)
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

      // Step 4: Update vehicle totalizer reading to final value (skip for buddycan orders and when totalizer is disabled)
      if (
        !isBuddyCanOrder &&
        selectedOrder?.is_enable_totalizer_reading_image_upload &&
        driverVehicleId
      ) {
        await orderService.updateTotalizerReading({
          totalizer_reading: qty + totalizerReadingValue,
          vehicle_id: driverVehicleDetails?.id,
        });
      }

      // Update store state
      orderStore.setState(state => ({
        ...state,
        totalizerAfterReading: isBuddyCanOrder
          ? 0
          : qty + totalizerReadingValue,
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

  // Image capture handlers - using new ImageContainer API with automatic upload
  const handleTotalizerImageCaptured = (imageUri: string, storeUrl: string) => {
    orderStore.setState({
      totalizerImageData: imageUri,
      totalizerUploadedUrl: storeUrl,
    });
  };

  const handleQuantityImageCaptured = (imageUri: string, storeUrl: string) => {
    orderStore.setState({
      quantityImageData: imageUri,
    });
    setQuantityUploadedUrl(storeUrl);
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

  return (
    <View style={{flex: 1, backgroundColor: FBBackground.white}}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Totalizer Before Reading - Hidden for BuddyCan orders and when flag is disabled */}
        {!isBuddyCanOrder &&
          selectedOrder?.is_enable_totalizer_reading_image_upload && (
            <>
              <View
                style={{marginBottom: 4, marginTop: 8, flexDirection: 'row'}}>
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
                imageStoreUrl={totalizerUploadedUrl}
                isUploading={totalizerImageUploading}
                onImageCaptured={handleTotalizerImageCaptured}
                onRemovePhoto={removeTotalizerImage}
                uploadingText="Uploading..."
                required={
                  selectedOrder?.is_enable_totalizer_reading_image_upload ||
                  false
                }
              />

              <Divider height={20} />
            </>
          )}

        {/* Quantity Dispensed */}
        <View
          style={{
            marginBottom: 4,
            marginTop: isBuddyCanOrder ? 8 : 8,
            flexDirection: 'row',
          }}>
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

        {/* Available Quantity Display */}
        {(() => {
          const assetRequestedQuantity =
            currentAssetForDispense?.quantity_requested || 0;
          const useAssetBasedValidation = assetRequestedQuantity > 0;

          let availableQuantity = 0;
          let totalOrderQuantity = 0;

          if (useAssetBasedValidation) {
            // Asset-based display (bowser orders)
            availableQuantity = assetRequestedQuantity;
            totalOrderQuantity = assetRequestedQuantity;
          } else {
            // Global order display (fillup orders)
            totalOrderQuantity =
              quantityToBeDispensed > 0 ? quantityToBeDispensed : 0;
            const alreadyDispensed = fuelDispensedTillNow || 0;
            const remainingQuantity = totalOrderQuantity - alreadyDispensed;
            const currentAssetQuantity =
              currentAssetForDispense?.quantity_dispensed || 0;
            availableQuantity = remainingQuantity + currentAssetQuantity;
          }

          if (availableQuantity > 0) {
            return (
              <View style={styles.availableQuantityContainer}>
                <Text
                  size="sm"
                  color="darkGray"
                  weight="400"
                  style={{fontStyle: 'italic'}}>
                  Available quantity: {availableQuantity}L
                </Text>
              </View>
            );
          }
          return null;
        })()}

        <Divider height={10} />
        <ImageContainer
          label="Quantity Dispensed Image"
          imageData={quantityImageData}
          imageStoreUrl={null}
          isUploading={quantityImageUploading}
          onImageCaptured={handleQuantityImageCaptured}
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
            !quantityDispensed ||
            (selectedOrder?.is_enable_totalizer_reading_image_upload &&
              !quantityImageData) ||
            // For bowser orders only, check if totalizer is submitted
            (!isBuddyCanOrder && !totalizerBeforeSubmitted)
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
  availableQuantityContainer: {
    marginTop: 6,
  },
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
