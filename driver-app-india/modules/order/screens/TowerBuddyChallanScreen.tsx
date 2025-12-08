import React, {useState, useEffect} from 'react';
import {View, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';

// Components
import {Button, Divider, Text, FullScreenLoader} from '@/components';
import {ImageContainer} from '@/modules/checkin/components';

// Store
import {checkinStore, orderStore} from '@/globalStore';

// Services
import orderService from '../services';

// Utils
import {getCurrentLocation} from '@/utils/location';

// Types
import {FBBackground, FBColors, FBBorders} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';
import {
  Delivered_To_Enum,
  FuelDeliveryToMutationVariables,
} from '@/generated/graphql';
import {OrderSuccess} from '@/modules/home/components';
import {OrderInfoCard} from '../components';

type BuddyChallanNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'buddy-challan'
>;

const TowerBuddyChallanScreen: React.FC = () => {
  const navigation = useNavigation<BuddyChallanNavigationProp>();

  // State
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  // Store
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const dispenseCompletedAssets = orderStore.use.dispenseCompletedAssets();
  const challanImageData = orderStore.use.challanImageData();
  const technicianImageData = orderStore.use.technicianImageData();
  const imapImageData = orderStore.use.imapImageData();
  const challanUploadedUrl = orderStore.use.challanUploadedUrl();
  const technicianUploadedUrl = orderStore.use.technicianUploadedUrl();
  const imapUploadedUrl = orderStore.use.imapUploadedUrl();
  const challanImageUploading = orderStore.use.loaders().challanImage;
  const technicianImageUploading = orderStore.use.loaders().technicianImage;
  const imapImageUploading = orderStore.use.loaders().imapImage;

  // Rate state for invoice calculations
  const [rate, setRate] = useState<number>(0);
  const [dispensedQuantity, setDispensedQuantity] = useState<number>(0);

  // Delivered In dropdown state
  const [selectedDeliveryTo, setSelectedDeliveryTo] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const deliveryOptions = [
    {value: Delivered_To_Enum.Jerrycan, label: 'Jerry Can'},
    {value: Delivered_To_Enum.Tank, label: 'Tank'},
    {value: Delivered_To_Enum.OwnerTank, label: 'Owner Tank'},
    {value: Delivered_To_Enum.Technician, label: 'Given To Technician'},
    {value: Delivered_To_Enum.Other, label: 'Other'},
  ];

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

    if (!imapImageData) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload IMAP photo',
      });
      return false;
    }

    if (!selectedDeliveryTo) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select delivery destination',
      });
      return false;
    }

    if (selectedDeliveryTo === Delivered_To_Enum.Other && !otherReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please specify the delivery destination',
      });
      return false;
    }

    return true;
  };

  // Image capture handlers - using new ImageContainer API with automatic upload
  const handleChallanImageCaptured = (imageUri: string, storeUrl: string) => {
    orderStore.setState({
      challanImageData: imageUri,
      challanUploadedUrl: storeUrl,
    });
  };

  const handleTechnicianImageCaptured = (imageUri: string, storeUrl: string) => {
    orderStore.setState({
      technicianImageData: imageUri,
      technicianUploadedUrl: storeUrl,
    });
  };

  const handleImapImageCaptured = (imageUri: string, storeUrl: string) => {
    orderStore.setState({
      imapImageData: imageUri,
      imapUploadedUrl: storeUrl,
    });
  };

  const handleRemoveChallan = () => {
    orderStore.setState({
      challanImageData: null,
      challanUploadedUrl: null,
    });
  };

  const handleRemoveTechnician = () => {
    orderStore.setState({
      technicianImageData: null,
      technicianUploadedUrl: null,
    });
  };

  const handleRemoveImap = () => {
    orderStore.setState({
      imapImageData: null,
      imapUploadedUrl: null,
    });
  };

  const createFuelDeliveryRecord = async () => {
    try {
      await orderService.createFuelDeliveryTo({
        delivered_to: selectedDeliveryTo as Delivered_To_Enum,
        other_reason:
          selectedDeliveryTo === Delivered_To_Enum.Other ? otherReason : '',
        quantity: dispensedQuantity,
        task_id: currentDriverOrder?.id || '',
      } as FuelDeliveryToMutationVariables);
    } catch (error) {
      console.warn('Error creating fuel delivery record:', error);
      // Don't throw - this is not critical for order completion
    }
  };

  const createInvoice = async (): Promise<{
    success: boolean;
    alreadyDelivered: boolean;
  }> => {
    try {
      const assetsToBeInvoiced =
        dispenseCompletedAssets
          ?.filter(
            (asset: any) =>
              asset.quantity_dispensed && !isNaN(asset.quantity_dispensed),
          )
          ?.map((item: any) => ({
            unit_price: rate,
            actual_amount: item.quantity_dispensed * rate,
            actual_qty: item.quantity_dispensed,
            amount: item.quantity_dispensed * rate,
            customer_asset_id: item?.customer_asset?.id,
            discount: 0.0,
            is_active: true,
            order_item_id:
              currentDriverOrder?.customer_order?.customer_order_items?.[0]?.id,
            product_variation_id:
              currentDriverOrder?.customer_order?.customer_order_items?.[0]
                ?.product_variation_id,
            qty: item.quantity_dispensed,
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

      console.log('📋 Creating invoice with amounts:', {
        totalAmount,
        deliveryFee,
        discount,
        calculatedFinalAmount,
      });

      const invoiceResult = await orderService.createInvoice({
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

      if (invoiceResult.alreadyDelivered) {
        console.log('📋 Invoice handler already marked order as Delivered');
      }

      return invoiceResult;
    } catch (error) {
      throw new Error('Error creating invoice');
    }
  };

  const createChallanTask = async () => {
    try {
      const coordinates = await getCurrentLocation();

      // Get fresh uploaded URLs from store (not from hooks which may not have updated yet)
      const currentState = orderStore.getState();
      const freshChallanUrl = currentState.challanUploadedUrl || '';
      const freshTechnicianUrl = currentState.technicianUploadedUrl || '';
      const freshImapUrl = currentState.imapUploadedUrl || '';

      console.log('📤 Creating challan tasks with URLs:', {
        challanUrl: freshChallanUrl,
        technicianUrl: freshTechnicianUrl,
        imapUrl: freshImapUrl,
      });

      // Create challan task
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

      // Create technician task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TECHNICIAN',
          url: freshTechnicianUrl,
          value: '0.0',
          task_id: currentDriverOrder?.id || '',
        },
      });

      // Create IMAP task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'IMAP',
          url: freshImapUrl,
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
      // Images are already uploaded by ImageContainer component
      // Show fullscreen loader for operations
      setProcessingOrder(true);
      setLoading(true);

      // Step 1: Create invoice
      const invoiceResult = await createInvoice();

      // Step 2: Create challan and technician tasks
      await createChallanTask();

      // Step 3: Create fuel delivery record
      await createFuelDeliveryRecord();

      // Step 4: Add transaction logs (optional)
      await addTransactionLogs();

      // Step 5: Mark order as completed
      // await markOrderCompleted();
      if (invoiceResult.alreadyDelivered) {
        console.log(
          '⏭️ Skipping markOrderCompleted - invoice handler already marked order as Delivered',
        );
      } else {
        await markOrderCompleted();
      }

      // Note: OrderSuccess component will handle cleanup and navigation

      // Show success screen
      setShowSuccess(true);
    } catch (error) {
      console.error('Error completing buddy challan:', error);
      Toast.show({
        type: 'error',
        text1: 'Completion Failed',
        text2: 'Failed to complete order. Please try again.',
      });
    } finally {
      setLoading(false);
      setProcessingOrder(false);
    }
  };

  // Success view
  if (showSuccess) {
    return <OrderSuccess />;
  }

  return (
    <View style={styles.container}>
      <FullScreenLoader
        showLoader={processingOrder}
        loaderText="Completing order..."
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <OrderInfoCard
          dispensedQuantity={dispensedQuantity}
          dispensedAssets={dispenseCompletedAssets || []}
        />

        <Divider height={10} />

        {/* Delivered In Dropdown */}
        <View style={styles.vehicleDetailsContainer}>
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
        </View>

        <Divider height={10} />

        {/* Challan Image */}
        <ImageContainer
          label="Upload Delivery Challan"
          imageData={challanImageData}
          imageStoreUrl={challanUploadedUrl}
          isUploading={challanImageUploading}
          onImageCaptured={handleChallanImageCaptured}
          onRemovePhoto={handleRemoveChallan}
          uploadingText="Uploading challan image..."
          required={true}
        />

        <Divider height={10} />

        {/* Technician Image */}
        <ImageContainer
          label="Technician Image"
          imageData={technicianImageData}
          imageStoreUrl={technicianUploadedUrl}
          isUploading={technicianImageUploading}
          onImageCaptured={handleTechnicianImageCaptured}
          onRemovePhoto={handleRemoveTechnician}
          uploadingText="Uploading technician image..."
          required={true}
        />

        <Divider height={10} />

        {/* IMAP Photo */}
        <ImageContainer
          label="Upload IMAP Image"
          imageData={imapImageData}
          imageStoreUrl={imapUploadedUrl}
          isUploading={imapImageUploading}
          onImageCaptured={handleImapImageCaptured}
          onRemovePhoto={handleRemoveImap}
          uploadingText="Uploading IMAP photo..."
          required={true}
        />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!challanImageData ||
              !technicianImageData ||
              !imapImageData ||
              !selectedDeliveryTo ||
              challanImageUploading ||
              technicianImageUploading ||
              imapImageUploading) &&
              styles.disabledButton,
          ]}
          variant="solid"
          onPress={handleSubmit}
          loading={
            loading ||
            challanImageUploading ||
            technicianImageUploading ||
            imapImageUploading
          }
          disabled={
            !challanImageData ||
            !technicianImageData ||
            !imapImageData ||
            !selectedDeliveryTo ||
            challanImageUploading ||
            technicianImageUploading ||
            imapImageUploading
          }>
          {challanImageUploading ||
          technicianImageUploading ||
          imapImageUploading
            ? 'Uploading Images...'
            : 'Mark Order Complete'}
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
    borderColor: '#E0E0E0',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: '8@s',
    backgroundColor: FBBackground.white,
    marginTop: '4@vs',
    maxHeight: '200@vs',
  },
  dropdownItem: {
    padding: '12@s',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: '8@s',
    padding: '12@s',
    backgroundColor: FBBackground.white,
    fontSize: '14@ms',
    color: FBColors.neutral,
    textAlignVertical: 'top',
    minHeight: '80@vs',
  },
});

export default TowerBuddyChallanScreen;
