import React, {useState, useEffect, useRef} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';

// Components
import {Button, Divider, Text} from '@/components';
import {ImageContainer} from '@/modules/checkin/components';
import OrderInfoCard from '../components/OrderInfoCard';

// Camera
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// Store
import {checkinStore, orderStore} from '@/globalStore';

// Services
import orderService from '../services';
import supportService from '@/modules/support/services';

// Utils
import {getCurrentLocation} from '@/utils/location';

// Types
import {FBBackground, FBColors, FBBorders} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';
// COMMENTED OUT: Not needed for normal driver flow
// import {
//   Delivered_To_Enum,
//   FuelDeliveryToMutationVariables,
// } from '@/generated/graphql';

type DeliveryChallanNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'delivery-challan'
>;

type ImageCaptureType = 'challan';
type LoaderTypes = 'challanImage';

const NormalDeliveryChallanScreen: React.FC = () => {
  const navigation = useNavigation<DeliveryChallanNavigationProp>();
  const cameraRef = useRef<RNCamera | null>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);

  // Store
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const dispenseCompletedAssets = orderStore.use.dispenseCompletedAssets();
  const challanImageData = orderStore.use.challanImageData();
  const challanUploadedUrl = orderStore.use.challanUploadedUrl();
  const challanImageUploading = orderStore.use.loaders().challanImage;

  // Rate state for invoice calculations
  const [rate, setRate] = useState<number>(0);
  const [dispensedQuantity, setDispensedQuantity] = useState<number>(0);

  // Delivered In dropdown state - COMMENTED OUT: Not needed for normal driver flow
  // const [selectedDeliveryTo, setSelectedDeliveryTo] = useState<string>('');
  // const [otherReason, setOtherReason] = useState<string>('');
  // const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // const deliveryOptions = [
  //   {value: Delivered_To_Enum.Jerrycan, label: 'Jerry Can'},
  //   {value: Delivered_To_Enum.Tank, label: 'Tank'},
  //   {value: Delivered_To_Enum.OwnerTank, label: 'Owner Tank'},
  //   {value: Delivered_To_Enum.Technician, label: 'Given To Technician'},
  //   {value: Delivered_To_Enum.Other, label: 'Other'},
  // ];

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      // Calculate rate similar to Vue.js onMounted logic
      if (
        currentDriverOrder?.customer_order?.organization_user?.organization
          ?.is_credit_available
      ) {
        // For credit available orders (postpaid), fetch rate from serviceability
        const locationString =
          currentDriverOrder.customer_order
            ?.organizationAddressByShippingAddressId?.location;
        const coordinatesMatch = locationString?.match(
          /\((-?\d+\.\d+),(-?\d+\.\d+)\)/,
        );

        if (coordinatesMatch) {
          const latitude = parseFloat(coordinatesMatch[2]);
          const longitude = parseFloat(coordinatesMatch[1]);

          const franchise = await orderService.checkServiceability({
            lat: latitude,
            lng: longitude,
          });

          const priceData = await orderService.fetchDeliveryProductsWithPrices({
            id: franchise?.partner_localities[0]
              ?.product_partner_localities_prices[0]?.parent_id,
          });

          setRate(priceData?.[0]?.sale_price || 0);
        }
      } else {
        // For prepaid orders, use unit price from order items
        setRate(
          currentDriverOrder?.customer_order?.customer_order_items?.[0]
            ?.unit_price || 0,
        );
      }

      // Calculate dispensed quantity
      const totalDispensed = getTotalDispensed();
      setDispensedQuantity(totalDispensed);
    } catch (error) {
      console.error('Error initializing delivery challan:', error);
      Toast.show({
        type: 'error',
        text1: 'Initialization Error',
        text2: 'Failed to load challan data',
      });
    }
  };

  const getTotalDispensed = (): number => {
    return (
      dispenseCompletedAssets?.reduce(
        (total: number, asset: any) => total + (asset.quantity_dispensed || 0),
        0,
      ) || 0
    );
  };

  const validateForm = (): boolean => {
    if (!challanImageData) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload challan image',
      });
      return false;
    }

    // COMMENTED OUT: Delivered In validation not needed for normal driver flow
    // if (!selectedDeliveryTo) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Validation Error',
    //     text2: 'Please select delivery destination',
    //   });
    //   return false;
    // }

    // if (selectedDeliveryTo === Delivered_To_Enum.Other && !otherReason.trim()) {
    //   Toast.show({
    //     type: 'error',
    //     text1: 'Validation Error',
    //     text2: 'Please specify the delivery destination',
    //   });
    //   return false;
    // }

    return true;
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
        case 'challan':
          loaderType = 'challanImage';
          orderStore.setState({
            challanImageData: data.uri,
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
      const fileName = `DeliveryChallan_${type}_${
        currentDriverOrder?.customer_order?.order_code
      }_${Date.now()}.jpg`;

      const {src, storeUrl} = await supportService.uploadFile({
        fileName,
        contentType: 'image/jpeg',
        fileData: blob,
      });

      // Store the upload URL for API calls but keep the local URI for display
      if (type === 'challan') {
        orderStore.setState({challanUploadedUrl: storeUrl || src});
      }

      console.log('Image uploaded:', {src, storeUrl});
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: `Failed to upload ${type} image`,
      });
      // Reset the local image on upload failure
      if (type === 'challan') {
        orderStore.setState({challanImageData: null});
      }
    } finally {
      orderStore.getState().stopLoader(loaderType);
    }
  };

  // COMMENTED OUT: Fuel delivery record not needed for normal driver flow
  // const createFuelDeliveryRecord = async () => {
  //   try {
  //     await orderService.createFuelDeliveryTo({
  //       delivered_to: selectedDeliveryTo as Delivered_To_Enum,
  //       other_reason:
  //         selectedDeliveryTo === Delivered_To_Enum.Other ? otherReason : '',
  //       quantity: dispensedQuantity,
  //       task_id: currentDriverOrder?.id || '',
  //     } as FuelDeliveryToMutationVariables);
  //   } catch (error) {
  //     console.warn('Error creating fuel delivery record:', error);
  //     // Don't throw - this is not critical for order completion
  //   }
  // };

  const createInvoice = async () => {
    try {
      // Create invoice items from dispensed assets (using dispenseCompletedAssets from store)
      const assetsToBeInvoiced =
        dispenseCompletedAssets
          ?.filter(
            (asset: any) =>
              asset.quantity_dispensed && !isNaN(asset.quantity_dispensed),
          )
          ?.map((item: any) => ({
            unit_price: rate,
            actual_amount: (item.quantity_dispensed || 0) * rate,
            actual_qty: item.quantity_dispensed || 0,
            amount: (item.quantity_dispensed || 0) * rate,
            customer_asset_id: item?.customer_asset?.id,
            discount: 0.0,
            is_active: true,
            order_item_id:
              currentDriverOrder?.customer_order?.customer_order_items?.[0]?.id,
            product_variation_id:
              currentDriverOrder?.customer_order?.customer_order_items?.[0]
                ?.product_variation_id,
            qty: item.quantity_dispensed || 0,
            service_tax:
              currentDriverOrder?.customer_order?.customer_order_items?.[0]
                ?.service_tax || 0,
            state: 'DELIVERED' as const,
            tax: 0.0,
            unit: 'LTRS',
          })) || [];

      // Fetch delivery fee
      const deliveryFeeData = await orderService.fetchDeliveryFee({
        customer_order_id: currentDriverOrder?.customer_order?.id,
        total_dispensed_qty: dispensedQuantity,
      });

      const totalQuantityDispensed = assetsToBeInvoiced.reduce(
        (acc: number, item: any) => acc + (item.actual_qty || 0),
        0,
      );

      const totalAmount = totalQuantityDispensed * rate;
      const deliveryFee = parseFloat(deliveryFeeData?.delivery_fees || '0');
      const discount = parseFloat(deliveryFeeData?.discount || '0');
      const calculatedFinalAmount = totalAmount + deliveryFee - discount;

      // Create invoice (following Vue.js pattern)
      await orderService.createInvoice({
        delivery_fee: String(deliveryFeeData?.delivery_fees || 0),
        actual_amount: String(calculatedFinalAmount),
        dispensedQty: String(dispensedQuantity),
        invoiced_items: assetsToBeInvoiced,
        charges: parseFloat(
          (deliveryFeeData as any)?.delivery_fees_no_tax || '0',
        ),
        tax: parseFloat((deliveryFeeData as any)?.total_tax || '0'),
        discount: discount,
        customer_order_id: currentDriverOrder?.customer_order?.id || '',
      });
    } catch (error) {
      throw new Error('Error creating invoice');
    }
  };

  const createChallanTask = async () => {
    try {
      const coordinates = await getCurrentLocation();

      // Get fresh uploaded URL from store (not from hooks which may not have updated yet)
      const currentState = orderStore.getState();
      const freshChallanUrl = currentState.challanUploadedUrl || '';

      console.log('📤 Creating challan task with URL:', {
        challanUrl: freshChallanUrl,
      });

      // Create challan task (following Vue.js pattern)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'CHALLAN',
          url: freshChallanUrl,
          value: '0.0',
          quantity_dispensed: dispensedQuantity,
          task_id: currentDriverOrder?.id || '',
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });
    } catch (error) {
      throw new Error('Error creating challan task');
    }
  };

  const addTransactionLogs = async () => {
    try {
      // Get vehicle details from checkin store (following Vue.js pattern)
      const vehicleDetails = checkinStore.getState().driverVehicleDetails;

      // Filter for browser-tank product variation (following Vue.js pattern)
      const filteredTankProductVarId = vehicleDetails?.vehicle_tank_types
        ?.filter((tank: any) => tank.tank_type.slug === 'browser-tank')
        ?.map(
          (tank: any) =>
            tank.vehicle_tank_type_product_variations?.[0]?.product_variation
              ?.id,
        );

      const productVarId =
        filteredTankProductVarId?.[0] ||
        currentDriverOrder?.customer_order?.customer_order_items?.[0]
          ?.product_variation_id;

      if (productVarId) {
        await orderService.addTransactionLogs({
          quantity: dispensedQuantity,
          product_var_id: productVarId,
          fillup_request_id: null,
          customer_order_id: currentDriverOrder?.customer_order?.id || '',
          vehicle_id: vehicleDetails?.id,
          transaction_type: 'OUT',
        });
      }
    } catch (error) {
      // Log but don't throw - transaction logs are not critical
      console.warn('Error adding transaction logs:', error);
    }
  };

  const markOrderCompleted = async () => {
    try {
      await orderService.markOrderCompleted({
        id: currentDriverOrder?.id || '',
      });
    } catch (error) {
      throw new Error('Error marking order as completed');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentDriverOrder?.id || !currentDriverOrder?.customer_order?.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Order data is missing',
      });
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create invoice
      await createInvoice();

      // Step 2: Create challan task
      await createChallanTask();

      // Step 3: Create fuel delivery record - COMMENTED OUT: Not needed for normal driver flow
      // await createFuelDeliveryRecord();

      // Step 4: Add transaction logs (optional)
      await addTransactionLogs();

      // Step 5: Mark order as completed
      await markOrderCompleted();

      // Note: OrderSuccess component will handle cleanup and navigation

      // Navigate to success screen
      setTimeout(() => {
        navigation.navigate('OrderSuccess' as any);
      }, 500);
    } catch (error) {
      console.error('Error completing delivery challan:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to complete order. Please try again.';

      // Navigate to failure screen
      setTimeout(() => {
        navigation.navigate('OrderFailure' as any, {
          errorMessage,
          canRetry: true,
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  // Camera view
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
            <Text size="sm" color="neutral">
              Take Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCamera(false)}
            style={styles.capture}>
            <Text size="sm" color="neutral">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Divider height={16} />

        <OrderInfoCard
          dispensedQuantity={dispensedQuantity}
          dispensedAssets={dispenseCompletedAssets || []}
        />

        {/* COMMENTED OUT: Delivered In dropdown not needed for normal driver flow */}
        {/* <Divider height={10} /> */}

        {/* Delivered In Dropdown */}
        {/* <View style={styles.vehicleDetailsContainer}>
          <Text weight="600" size="sm" color="neutral">
            Delivered In <Text color="error">*</Text>
          </Text>
          <Divider height={8} />
          <TouchableOpacity
            style={[
              styles.dropdownContainer,
              !selectedDeliveryTo && styles.placeholderContainer,
            ]}
            onPress={() => setShowDropdown(!showDropdown)}>
            <Text
              size="sm"
              color={selectedDeliveryTo ? 'neutral' : 'lightGray'}>
              {selectedDeliveryTo
                ? deliveryOptions.find(opt => opt.value === selectedDeliveryTo)
                    ?.label
                : 'Choose where fuel is delivered...'}
            </Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              {deliveryOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedDeliveryTo(option.value);
                    setShowDropdown(false);
                    if (option.value !== Delivered_To_Enum.Other) {
                      setOtherReason('');
                    }
                  }}>
                  <Text size="sm" color="neutral">
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedDeliveryTo === Delivered_To_Enum.Other && (
            <>
              <Divider height={8} />
              <TextInput
                style={styles.textInput}
                value={otherReason}
                onChangeText={setOtherReason}
                placeholder="Please specify the delivery destination..."
                placeholderTextColor={FBColors.lightGray}
                maxLength={60}
                multiline
                numberOfLines={3}
              />
            </>
          )}
        </View> */}

        {/* <Divider height={10} /> */}

        {/* Challan Image */}
        <ImageContainer
          label="Challan"
          imageData={challanImageData}
          isUploading={challanImageUploading}
          onCameraPress={() => openCamera('challan')}
          onRemovePhoto={() => {
            orderStore.setState({
              challanImageData: null,
              challanUploadedUrl: null,
            });
          }}
          uploadingText="Uploading challan image..."
          required={true}
        />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <Button
          style={[styles.button, !challanImageData && styles.disabledButton]}
          variant="solid"
          onPress={handleSubmit}
          loading={loading}
          disabled={!challanImageData}>
          Mark Order Complete
        </Button>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: '16@s',
    paddingBottom: '20@vs',
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: '16@vs',
  },
  buttonContainer: {
    position: 'relative',
    marginHorizontal: '20@s',
    marginVertical: '20@vs',
    backgroundColor: FBBackground.white,
  },
  button: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Camera styles
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
    borderRadius: '5@s',
    padding: '15@s',
    paddingHorizontal: '20@s',
    alignSelf: 'center',
    margin: '20@s',
  },
  // Dropdown styles
  dropdownContainer: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    borderRadius: '8@s',
    padding: '12@s',
    backgroundColor: FBBackground.white,
    justifyContent: 'center',
    minHeight: '40@vs',
  },
  placeholderContainer: {
    borderColor: FBBorders.primary,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: FBBorders.primary,
    borderRadius: '8@s',
    backgroundColor: FBBackground.white,
    marginTop: '4@vs',
    maxHeight: '200@vs',
  },
  dropdownItem: {
    padding: '12@s',
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.secondary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    borderRadius: '8@s',
    padding: '12@s',
    backgroundColor: FBBackground.white,
    fontSize: '14@ms',
    color: FBColors.neutral,
    textAlignVertical: 'top',
    minHeight: '80@vs',
  },
});

export default NormalDeliveryChallanScreen;
