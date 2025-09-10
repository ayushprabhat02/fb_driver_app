import React, {useState, useEffect, useRef} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';

// Components
import {Button, Divider, Text} from '@/components';
import {ImageContainer} from '@/modules/checkin/components';

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
import {FBBackground} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';

type BuddyChallanNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'buddy-challan'
>;

type ImageCaptureType = 'challan' | 'technician';
type LoaderTypes = 'challanImage' | 'technicianImage';

const BuddyChallanScreen: React.FC = () => {
  const navigation = useNavigation<BuddyChallanNavigationProp>();
  const cameraRef = useRef<RNCamera | null>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);

  // Store
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const dispenseCompletedAssets = orderStore.use.dispenseCompletedAssets();
  const challanImageData = orderStore.use.challanImageData();
  const technicianImageData = orderStore.use.technicianImageData();
  const challanUploadedUrl = orderStore.use.challanUploadedUrl();
  const technicianUploadedUrl = orderStore.use.technicianUploadedUrl();
  const challanImageUploading = orderStore.use.loaders().challanImage;
  const technicianImageUploading = orderStore.use.loaders().technicianImage;

  // Rate state for invoice calculations
  const [rate, setRate] = useState<number>(0);
  const [dispensedQuantity, setDispensedQuantity] = useState<number>(0);

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
            id: franchise?.partner_localities?.[0]
              ?.product_partner_localities_prices?.[0]?.parent_id,
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
      console.error('Error initializing buddy challan:', error);
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

    if (!technicianImageData) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload technician image',
      });
      return false;
    }

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
        case 'technician':
          loaderType = 'technicianImage';
          orderStore.setState({
            technicianImageData: data.uri,
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
      const fileName = `BuddyChallan_${type}_${
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
      } else if (type === 'technician') {
        orderStore.setState({technicianUploadedUrl: storeUrl || src});
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
      } else if (type === 'technician') {
        orderStore.setState({technicianImageData: null});
      }
    } finally {
      orderStore.getState().stopLoader(loaderType);
    }
  };

  const createInvoice = async () => {
    try {
      // Create invoice items from dispensed assets
      const assetsToBeInvoiced =
        currentDriverOrder?.customer_order?.customer_order_customer_assets
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

      // Create invoice
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
      console.log('-----coordinates-------', getCurrentLocation);

      // Create challan task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'CHALLAN',
          url: challanUploadedUrl || challanImageData || '',
          value: '0.0',
          quantity_dispensed: dispensedQuantity,
          task_id: currentDriverOrder?.id || '',
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Create technician task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TECHNICIAN',
          url: technicianUploadedUrl || technicianImageData || '',
          value: '0.0',
          task_id: currentDriverOrder?.id || '',
        },
      });
    } catch (error) {
      throw new Error('Error creating challan task');
    }
  };

  const addTransactionLogs = async () => {
    try {
      // Note: This requires vehicle details. In Vue.js version, they filter for "browser-tank"
      // For now, we'll use the product variation ID from the order
      const productVarId =
        currentDriverOrder?.customer_order?.customer_order_items?.[0]
          ?.product_variation_id;

      if (productVarId) {
        await orderService.addTransactionLogs({
          quantity: dispensedQuantity,
          product_var_id: productVarId,
          fillup_request_id: null,
          customer_order_id: currentDriverOrder?.customer_order?.id || '',
          vehicle_id: checkinStore.getState().driverVehicleDetails?.id, // This would need to be fetched from driver vehicle details
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
        task_id: currentDriverOrder?.id || '',
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

      // Step 2: Create challan and technician tasks
      await createChallanTask();

      // Step 3: Add transaction logs (optional)
      await addTransactionLogs();

      // Step 4: Mark order as completed
      await markOrderCompleted();

      // Reset states and navigate
      orderStore.setState(state => ({
        ...state,
        dispenseCompletedAssets: [],
        partiallyFilledAssetsArray: [],
        assetsWithUploadedVideos: [],
      }));

      Toast.show({
        type: 'success',
        text1: 'Order Completed',
        text2: 'Buddy challan has been submitted successfully',
      });

      // Navigate back to dashboard or orders list
      navigation.reset({
        index: 0,
        routes: [{name: 'delivery-orders'}],
      });
    } catch (error) {
      console.error('Error completing buddy challan:', error);
      Toast.show({
        type: 'error',
        text1: 'Completion Failed',
        text2: 'Failed to complete order. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDispensedAssets = () => {
    if (!dispenseCompletedAssets || dispenseCompletedAssets.length === 0) {
      return (
        <Text size="sm" color="lightGray">
          No assets dispensed
        </Text>
      );
    }

    return dispenseCompletedAssets.map((asset: any, index: number) => (
      <View key={index} style={styles.assetRow}>
        <Text size="sm" color="neutral" weight="600">
          {asset.customer_asset?.name || 'Unknown Asset'}
        </Text>
        <Text size="sm" color="primary" weight="600">
          {asset.quantity_dispensed}L
        </Text>
      </View>
    ));
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
        <Divider height={10} />

        {/* Order Summary */}
        <View style={styles.vehicleDetailsContainer}>
          <Text weight="600" size="lg" color="neutral">
            Delivery Summary
          </Text>

          <Divider height={8} />

          <View style={styles.summaryRow}>
            <Text size="sm" color="darkGray">
              Order Code:
            </Text>
            <Text size="sm" color="primary" weight="600">
              #{currentDriverOrder?.customer_order?.order_code || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text size="sm" color="darkGray">
              Total Dispensed:
            </Text>
            <Text size="base" color="primary" weight="700">
              {dispensedQuantity}L
            </Text>
          </View>

          {rate > 0 && (
            <View style={styles.summaryRow}>
              <Text size="sm" color="darkGray">
                Rate per Liter:
              </Text>
              <Text size="sm" color="neutral" weight="600">
                ₹{rate.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <Divider height={10} />

        {/* Dispensed Assets */}
        <View style={styles.vehicleDetailsContainer}>
          <Text weight="600" size="sm" color="neutral">
            Dispensed Assets:
          </Text>
          <Divider height={8} />
          {renderDispensedAssets()}
        </View>

        <Divider height={10} />

        {/* Challan Image */}
        <ImageContainer
          label="Challan"
          imageData={challanImageData}
          isUploading={challanImageUploading}
          onCameraPress={() => openCamera('challan')}
          uploadingText="Uploading challan image..."
          required={true}
        />

        <Divider height={10} />

        {/* Technician Image */}
        <ImageContainer
          label="Technician Image"
          imageData={technicianImageData}
          isUploading={technicianImageUploading}
          onCameraPress={() => openCamera('technician')}
          uploadingText="Uploading technician image..."
          required={true}
        />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!challanImageData || !technicianImageData) &&
              styles.disabledButton,
          ]}
          variant="solid"
          onPress={handleSubmit}
          loading={loading}
          disabled={!challanImageData || !technicianImageData}>
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
    paddingBottom: '16@vs',
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: '16@vs',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  vehicleDetailsContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: '8@s',
    padding: '16@s',
    marginBottom: '10@vs',
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
});

export default BuddyChallanScreen;
