import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StyleSheet,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation, useRoute} from '@react-navigation/native';
import {RNCamera} from 'react-native-camera';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

// Components
import {HeaderAvoidingContainer, Text, FullScreenLoader} from '@/components';
import {ImageContainer} from '@/modules/checkin/components';

// Services
import fillupService from '../services';

// Store
import fillupStore from '../store';

// Types & Enums

// Utils
import {FBColors, FBBackground} from '@/types/styles';
import supportService from '@/modules/support/services';
import orderService from '@/modules/order/services';

// Types & Enums
import {
  Fillup_Request_Status_Enum,
  Partner_Order_Item_State_Enum,
  Partner_Order_State_Enum,
} from '@/generated/graphql';

interface RouteParams {
  fillupId: string;
}

const FillupIndent: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {fillupId} = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [indentNumber, setIndentNumber] = useState('');
  const [filledQuantity, setFilledQuantity] = useState('');
  const [indentImageData, setIndentImageData] = useState<string | null>(null);
  const [indentStoreUrl, setIndentStoreUrl] = useState<string | null>(null);
  const [isIndentImageUploading, setIsIndentImageUploading] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [completedFilledQuantity, setCompletedFilledQuantity] = useState('');

  const cameraRef = useRef<RNCamera | null>(null);
  const pollInterval = useRef<NodeJS.Timeout>();

  const fillupDetails = fillupStore.use.fillupRequestDetails();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        await fillupService.fetchFillupRequestById({id: fillupId});
      } catch (error) {
        console.error('Failed to fetch fillup details:', error);
        Alert.alert('Error', 'Failed to load fillup details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [fillupId]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = undefined;
      }
    };
  }, []);

  // Initialize component and check existing state (like Vue's onMounted)
  useEffect(() => {
    const initializeComponent = async () => {
      if (fillupDetails) {
        console.log(
          'Initializing component with fillup state:',
          fillupDetails.state,
        );

        // Check if already waiting for approval
        if (fillupDetails.state === 'AWAITING_INDENT_UPLOAD_AUTHORIZATION') {
          console.log('Already awaiting approval, starting polling');
          setWaitingForApproval(true);
          startApprovalPolling();
        }
        // Check if already approved
        else if (fillupDetails.state === 'PURCHASE_INVOICE_REQUEST') {
          console.log('Already approved, showing mark complete button');
          setWaitingForApproval(false);
          setApproved(true);
        }
        // Check if rejected
        else if (fillupDetails.state === 'INDENT_UPLOAD_REJECTED') {
          console.log('Previously rejected, resetting for re-upload');
          setWaitingForApproval(false);
          setApproved(false);
        }
      }
    };

    initializeComponent();
  }, [fillupDetails]);

  const startApprovalPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }

    pollInterval.current = setInterval(async () => {
      try {
        await fillupService.fetchFillupRequestById({id: fillupId});
        const currentDetails = fillupStore.getState().fillupRequestDetails;

        console.log('Polling - Current fillup state:', currentDetails?.state);

        if (currentDetails?.state === 'PURCHASE_INVOICE_REQUEST') {
          console.log(
            'Indent approved! Stopping polling and showing mark complete button',
          );
          setWaitingForApproval(false);
          setApproved(true);
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = undefined;
          }
          // Show success alert like in Vue implementation
          Alert.alert(
            'Indent Approved!',
            'Your indent has been approved. Click "Mark Complete" to finish the fillup order.',
            [{text: 'OK'}],
          );
        } else if (currentDetails?.state === 'INDENT_UPLOAD_REJECTED') {
          console.log('Indent rejected! Stopping polling');
          setWaitingForApproval(false);
          setApproved(false);
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = undefined;
          }
          Alert.alert('Indent Rejected', 'Please re-upload the indent.');
        }
      } catch (error) {
        console.error('Error polling for approval:', error);
      }
    }, 5000);
  };

  const openCamera = async () => {
    const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA);
    if (cameraPermission === RESULTS.DENIED) {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result !== RESULTS.GRANTED) {
        console.log('Camera permission denied');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {quality: 0.5, base64: true};
      const data = await cameraRef.current.takePictureAsync(options);
      setShowCamera(false);
      setIndentImageData(data.uri);
      setIsIndentImageUploading(true);
      await uploadImage(data.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const blob = await (await fetch(uri)).blob();
      const {src, storeUrl} = await supportService.uploadFile({
        fileName: 'indent.jpg',
        contentType: 'image/jpeg',
        fileData: blob,
      });
      console.log('Image uploaded:', {src, storeUrl});

      if (storeUrl) {
        setIndentStoreUrl(storeUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsIndentImageUploading(false);
    }
  };

  const removeImage = () => {
    setIndentImageData(null);
    setIndentStoreUrl(null);
  };

  const isFormValid = () => {
    return (
      indentNumber.trim() !== '' &&
      filledQuantity.trim() !== '' &&
      indentStoreUrl !== null
    );
  };

  const validateInputs = () => {
    if (!indentNumber.trim()) {
      Alert.alert('Error', 'Please enter indent number');
      return false;
    }
    if (!filledQuantity.trim()) {
      Alert.alert('Error', 'Please enter filled quantity');
      return false;
    }
    if (!indentStoreUrl) {
      Alert.alert('Error', 'Please upload indent image');
      return false;
    }

    const filledQty = parseFloat(filledQuantity);
    const approvedQty = fillupDetails?.quantity_approved || 0;

    if (filledQty <= 0) {
      Alert.alert(
        'Error',
        'Filled quantity cannot be less than or equal to zero',
      );
      return false;
    }
    if (filledQty > approvedQty) {
      Alert.alert(
        'Error',
        'Filled quantity cannot be more than approved quantity',
      );
      return false;
    }

    return true;
  };

  const formatIndentNumber = () => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}${String(
      today.getMonth() + 1,
    ).padStart(2, '0')}${today.getFullYear()}`;

    const formattedTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(today);

    return `${indentNumber}-${formattedDate}-${formattedTime}`;
  };

  const uploadIndent = async () => {
    if (!validateInputs()) return;

    setUploading(true);
    try {
      const formattedIndentNumber = formatIndentNumber();

      // Check if indent number already exists
      const indentExists = await fillupService.checkIndentNumberExists({
        object: {
          fillup_request_id: fillupId,
          indent_number: formattedIndentNumber,
        },
      });

      if (indentExists) {
        Alert.alert('Error', 'Indent number already exists');
        return;
      }

      // Check if GRN ERP code already exists
      if (fillupDetails?.grn_erp_code) {
        Alert.alert('Error', 'GRN ERP code already exists');
        return;
      }

      // Check if purchase invoice ERP code already exists
      if (fillupDetails?.purchase_invoice_erp_code) {
        Alert.alert('Error', 'Purchase Invoice already exists');
        return;
      }

      const partnerOrderItemId =
        fillupDetails?.partner_order?.partner_order_items[0]?.id;

      if (!partnerOrderItemId) {
        Alert.alert('Error', 'Partner order item not found');
        return;
      }

      // Add indent data
      await fillupService.addIndent({
        objects: [
          {
            partner_order_item_id: partnerOrderItemId,
            is_active: true,
            key: 'INDENT_READING',
            value: formattedIndentNumber,
          },
          {
            partner_order_item_id: partnerOrderItemId,
            is_active: true,
            key: 'FILLED_QUANTITY',
            value: filledQuantity,
          },
          {
            partner_order_item_id: partnerOrderItemId,
            is_active: true,
            key: 'INDENT_UPLOAD',
            url: indentStoreUrl!,
            value: '0.0',
          },
        ],
      });

      // Update fillup request state to request approval
      await askApproval();

      // Store filled quantity for later use in markComplete
      setCompletedFilledQuantity(filledQuantity);

      Alert.alert(
        'Success',
        'Indent uploaded successfully. Waiting for approval...',
        [
          {
            text: 'OK',
            onPress: () => {
              setWaitingForApproval(true);
              startApprovalPolling();
            },
          },
        ],
      );

      // Reset form
      setIndentNumber('');
      setFilledQuantity('');
      setIndentImageData(null);
      setIndentStoreUrl(null);
    } catch (error) {
      console.error('Error uploading indent:', error);
      Alert.alert('Error', 'Failed to upload indent. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const askApproval = async () => {
    try {
      await fillupService.updateFillupRequestState({
        id: fillupId,
        state: Fillup_Request_Status_Enum.AwaitingIndentUploadAuthorization,
      });
    } catch (error) {
      console.error('Error asking for approval:', error);
      throw error;
    }
  };

  const markComplete = async () => {
    try {
      setUploading(true);

      console.log('Starting mark complete process...');
      console.log('fillupDetails:', JSON.stringify(fillupDetails, null, 2));
      console.log('completedFilledQuantity:', completedFilledQuantity);

      // Check if order is already completed
      if (fillupDetails?.state === 'COMPLETE') {
        Alert.alert(
          'Already Completed',
          'This fillup order has already been marked as complete.',
          [{text: 'OK'}],
        );
        return;
      }

      // Validate required data exists
      const partnerOrderItemId =
        fillupDetails?.partner_order?.partner_order_items[0]?.id;
      const partnerOrderId = fillupDetails?.partner_order?.id;
      const productVariationId =
        fillupDetails?.partner_order?.partner_order_items[0]?.product_variation
          ?.id;
      const vehicleId =
        fillupDetails?.partner_order?.fillup_requests[0]
          ?.vehicle_tank_type_product_variation?.vehicle_tank_type?.vehicle?.id;

      console.log('Checking required data:');
      console.log('- partnerOrderItemId:', partnerOrderItemId);
      console.log('- partnerOrderId:', partnerOrderId);
      console.log('- productVariationId:', productVariationId);
      console.log('- vehicleId:', vehicleId);
      console.log('- completedFilledQuantity:', completedFilledQuantity);

      // Use quantity_approved as fallback if completedFilledQuantity is not available
      const quantityToUse =
        completedFilledQuantity ||
        fillupDetails?.quantity_approved?.toString() ||
        '';

      console.log('- quantityToUse (final):', quantityToUse);

      // Check each field individually to see which one is missing
      const missingFields = [];
      if (!partnerOrderItemId) missingFields.push('partnerOrderItemId');
      if (!partnerOrderId) missingFields.push('partnerOrderId');
      if (!productVariationId) missingFields.push('productVariationId');
      if (!vehicleId) missingFields.push('vehicleId');
      if (!quantityToUse) missingFields.push('quantityToUse');

      if (missingFields.length > 0) {
        throw new Error(
          `Required data missing for completion: ${missingFields.join(', ')}`,
        );
      }

      console.log('All required data found, proceeding with API calls...');

      // Execute all updates - matching Vue implementation exactly
      await fillupService.updateFillupRequestState({
        id: fillupId,
        state: Fillup_Request_Status_Enum.Complete,
      });
      console.log('✅ Fillup request state updated to COMPLETE');

      await fillupService.updatePartnerOrderItemState({
        id: partnerOrderItemId,
        state: Partner_Order_Item_State_Enum.Delivered,
      });
      console.log('✅ Partner order item state updated to DELIVERED');

      await fillupService.updatePartnerOrderState({
        id: partnerOrderId,
        state: Partner_Order_State_Enum.Delivered,
      });
      console.log('✅ Partner order state updated to DELIVERED');

      await orderService.addTransactionLogs({
        quantity: parseFloat(quantityToUse),
        product_var_id: productVariationId,
        fillup_request_id: fillupId,
        customer_order_id: null,
        vehicle_id: vehicleId,
        transaction_type: 'IN',
      });
      console.log('✅ Transaction logs added');

      Alert.alert('Success!', 'Fillup order has been marked as complete!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to Home
            navigation.reset({
              index: 0,
              routes: [{name: 'home' as never}],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Error marking complete:', error);
      Alert.alert(
        'Error',
        `Failed to mark order as complete: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please try again.`,
      );
    } finally {
      setUploading(false);
    }
  };

  if (showCamera) {
    const cameraType = RNCamera.Constants.Type.back;

    return (
      <View style={cameraStyles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={cameraStyles.preview}
          type={cameraType}
          captureAudio={false}
        />
        <View style={cameraStyles.cameraButtonContainer}>
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={cameraStyles.capture}>
            <Text style={cameraStyles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCamera(false)}
            style={cameraStyles.capture}>
            <Text style={cameraStyles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <FullScreenLoader
        showLoader={true}
        loaderText="Loading indent upload..."
      />
    );
  }

  return (
    <HeaderAvoidingContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {waitingForApproval ? (
          <View style={styles.waitingContainer}>
            <Text size="lg" weight="bold" color="neutral">
              Waiting for indent approval
            </Text>
            <View style={styles.loadingIndicator}>
              <Text size="sm" color="steelBlue">
                Please wait while your indent is being reviewed...
              </Text>
            </View>
          </View>
        ) : approved ? (
          <View style={styles.approvedContainer}>
            <View style={styles.successIconContainer}>
              <Text size="4xl" style={styles.checkMark}>
                ✅
              </Text>
            </View>
            <Text
              size="xl"
              weight="bold"
              color="primary"
              style={styles.approvedTitle}>
              Indent Approved!
            </Text>
            <Text size="base" color="neutral" style={styles.approvedMessage}>
              Great news! Your indent has been approved by the supervisor. You
              can now mark this fillup order as complete.
            </Text>
            <View style={styles.fillupDetailsCard}>
              <Text size="sm" weight="600" color="steelBlue">
                Fillup Details:
              </Text>
              <Text size="sm" color="neutral">
                Approved Quantity: {fillupDetails?.quantity_approved} liters
              </Text>
              <Text size="sm" color="neutral">
                Request ID: {fillupDetails?.id}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.completeButton,
                uploading && styles.disabledButton,
              ]}
              onPress={markComplete}
              disabled={uploading}
              activeOpacity={0.8}>
              <Text
                size="lg"
                weight="bold"
                color="white"
                style={styles.completeButtonText}>
                {uploading
                  ? '⏳ Processing Order...'
                  : '✅ Mark Order Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Indent Number Input */}
            <View style={styles.inputContainer}>
              <Text size="sm" weight="600" color="steelBlue">
                Indent Number
              </Text>
              <TextInput
                style={styles.textInput}
                value={indentNumber}
                onChangeText={setIndentNumber}
                placeholder="Enter indent number"
                placeholderTextColor={FBColors.lightGray}
              />
            </View>

            {/* Filled Quantity Input */}
            <View style={styles.inputContainer}>
              <Text size="sm" weight="600" color="steelBlue">
                Filled Quantity (Liters)
              </Text>
              <TextInput
                style={styles.textInput}
                value={filledQuantity}
                onChangeText={setFilledQuantity}
                placeholder="Enter filled quantity"
                placeholderTextColor={FBColors.lightGray}
                keyboardType="numeric"
              />
              {fillupDetails?.quantity_approved && (
                <Text size="xs" color="steelBlue">
                  Approved quantity: {fillupDetails.quantity_approved} liters
                </Text>
              )}
            </View>

            {/* Image Upload */}
            <ImageContainer
              label="Indent Image"
              imageData={indentImageData}
              isUploading={isIndentImageUploading}
              onCameraPress={openCamera}
              onRemovePhoto={removeImage}
              uploadingText="Uploading indent image..."
              required={true}
            />
          </View>
        )}
      </ScrollView>

      {/* Fixed Upload Button at Bottom */}
      {!waitingForApproval && !approved && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              fillupDetails?.state === 'INDENT_UPLOAD_REJECTED'
                ? styles.retryButton
                : styles.uploadButton,
              (!isFormValid() || uploading) && styles.disabledButton,
            ]}
            onPress={uploadIndent}
            disabled={!isFormValid() || uploading}>
            <Text size="base" weight="bold" color="white">
              {uploading
                ? 'Uploading...'
                : fillupDetails?.state === 'INDENT_UPLOAD_REJECTED'
                ? 'Re-Upload'
                : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  approvedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  successIconContainer: {
    marginBottom: '20@vs',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: '60@s',
  },
  approvedTitle: {
    textAlign: 'center',
    marginBottom: '16@vs',
  },
  approvedMessage: {
    textAlign: 'center',
    lineHeight: '22@s',
    marginBottom: '24@vs',
    paddingHorizontal: '10@s',
  },
  fillupDetailsCard: {
    backgroundColor: FBBackground.input,
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '24@vs',
    width: '100%',
    borderLeftWidth: '4@s',
    borderLeftColor: FBColors.primary,
  },
  formContainer: {
    padding: '16@s',
    paddingBottom: '100@vs',
  },
  inputContainer: {
    marginBottom: '20@vs',
  },
  textInput: {
    borderWidth: 1,
    borderColor: FBColors.lightGray,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    fontSize: '14@s',
    backgroundColor: FBBackground.white,
    color: FBColors.neutral,
    marginTop: '8@vs',
  },
  button: {
    paddingVertical: '14@vs',
    borderRadius: '8@s',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20@vs',
  },
  uploadButton: {
    backgroundColor: FBColors.primary,
  },
  retryButton: {
    backgroundColor: FBColors.steelBlue,
  },
  disabledButton: {
    backgroundColor: FBColors.lightGray,
    opacity: 0.6,
  },
  buttonContainer: {
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: FBColors.lightGray,
  },
  completeButton: {
    backgroundColor: FBColors.primary,
    marginTop: '24@vs',
    paddingVertical: '20@vs',
    paddingHorizontal: '32@s',
    borderRadius: '16@s',
    shadowColor: FBColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    transform: [{scale: 1}],
    minHeight: '56@vs',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    textAlign: 'center',
    letterSpacing: '0.5@s',
  },
  loadingIndicator: {
    alignItems: 'center',
    marginTop: '20@vs',
  },
});

const cameraStyles = StyleSheet.create({
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

export default FillupIndent;
