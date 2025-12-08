import React, {useEffect, useState, useRef, useCallback} from 'react';
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
  const [completedFilledQuantity, setCompletedFilledQuantity] = useState('');

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

  const startApprovalPolling = useCallback(() => {
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
  }, [fillupId]);

  // Initialize component and check existing state (like Vue's onMounted)
  useEffect(() => {
    const initializeComponent = async () => {
      if (fillupDetails) {
        console.log(
          'Initializing component with fillup state:',
          fillupDetails.state,
        );

        // Handle different fillup states for app resumption
        switch (fillupDetails.state) {
          case 'AWAITING_INDENT_UPLOAD_AUTHORIZATION':
            console.log(
              'App resumed: Already awaiting approval, starting polling',
            );
            setWaitingForApproval(true);
            setApproved(false);
            startApprovalPolling();
            break;

          case 'PURCHASE_INVOICE_REQUEST':
            console.log(
              'App resumed: Already approved, showing mark complete button',
            );
            setWaitingForApproval(false);
            setApproved(true);
            // Show user-friendly message about their progress
            setTimeout(() => {
              Alert.alert(
                'Welcome Back!',
                'Your indent has been approved. You can now mark this fillup order as complete.',
                [{text: 'OK'}],
              );
            }, 500);
            break;

          case 'PURCHASE_RECEIPT_REQUEST':
            console.log(
              'App resumed: Awaiting further approval (PURCHASE_RECEIPT_REQUEST)',
            );
            setWaitingForApproval(true);
            setApproved(false);
            startApprovalPolling();
            break;

          case 'INDENT_UPLOAD_REJECTED':
            console.log(
              'App resumed: Previously rejected, resetting for re-upload',
            );
            setWaitingForApproval(false);
            setApproved(false);
            // Clear any existing form data for fresh start
            setIndentNumber('');
            setFilledQuantity('');
            setIndentImageData(null);
            setIndentStoreUrl(null);
            // Show rejection message
            setTimeout(() => {
              Alert.alert(
                'Indent Rejected',
                'Your previous indent was rejected. Please upload a new one.',
                [{text: 'OK'}],
              );
            }, 500);
            break;

          case 'AUTHORIZED':
          case 'INDENT_UPLOAD_AUTHORIZED':
            console.log('App resumed: Ready for indent upload');
            setWaitingForApproval(false);
            setApproved(false);
            break;

          case 'COMPLETE':
            console.log('App resumed: Fillup already completed');
            Alert.alert(
              'Already Completed',
              'This fillup order has already been completed.',
              [
                {
                  text: 'Go to Home',
                  onPress: () => navigation.navigate('home' as never),
                },
              ],
            );
            break;

          default:
            console.log('App resumed: Default state, ready for indent upload');
            setWaitingForApproval(false);
            setApproved(false);
            break;
        }
      }
    };

    initializeComponent();
  }, [fillupDetails, navigation, startApprovalPolling]);

  // Image capture handlers - using new ImageContainer API with automatic upload
  const handleIndentImageCaptured = (imageUri: string, storeUrl: string) => {
    setIndentImageData(imageUri);
    setIndentStoreUrl(storeUrl);
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
    if (!validateInputs()) {
      return;
    }

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

      // Use quantity_approved as fallback if completedFilledQuantity is not available
      const quantityToUse =
        completedFilledQuantity ||
        fillupDetails?.quantity_approved?.toString() ||
        '';

      console.log('- quantityToUse (final):', quantityToUse);

      // Check each field individually to see which one is missing
      const missingFields = [];
      if (!partnerOrderItemId) {
        missingFields.push('partnerOrderItemId');
      }
      if (!partnerOrderId) {
        missingFields.push('partnerOrderId');
      }
      if (!productVariationId) {
        missingFields.push('productVariationId');
      }
      if (!vehicleId) {
        missingFields.push('vehicleId');
      }
      if (!quantityToUse) {
        missingFields.push('quantityToUse');
      }

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
      fillupStore.setState(state => ({
        ...state,
        activeFillupHistory: [],
        fillupHistory: [],
      }));

      Alert.alert('Success!', 'Fillup order has been marked as complete!', [
        {
          text: 'OK',
          onPress: () => {
            // // Clear the current activeFillupHistory state first
            fillupStore.setState(state => ({
              ...state,
              activeFillupHistory: [],
              fillupHistory: [],
            }));
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
            <View style={styles.waitingIconContainer}>
              <Text size="4xl" style={styles.waitingIcon}>
                ⏳
              </Text>
            </View>
            <Text size="lg" weight="bold" color="neutral">
              Waiting for Indent Approval
            </Text>
            <View style={styles.loadingIndicator}>
              <Text
                size="sm"
                color="steelBlue"
                style={styles.waitingDescription}>
                Your indent has been uploaded successfully and is currently
                being reviewed by the supervisor.
              </Text>
              <Text size="sm" color="steelBlue" style={styles.waitingNote}>
                You can safely close the app - we'll notify you when it's
                approved!
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={async () => {
                await fillupService.fetchFillupRequestById({id: fillupId});
              }}>
              <Text size="sm" weight="600" color="primary">
                🔄 Check Status
              </Text>
            </TouchableOpacity>
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
                keyboardType="decimal-pad"
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
              imageStoreUrl={indentStoreUrl}
              isUploading={isIndentImageUploading}
              onImageCaptured={handleIndentImageCaptured}
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
  waitingIconContainer: {
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  waitingIcon: {
    fontSize: '48@s',
  },
  waitingDescription: {
    textAlign: 'center',
    lineHeight: '20@vs',
    marginBottom: '12@vs',
    paddingHorizontal: '20@s',
  },
  waitingNote: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: '8@vs',
  },
  refreshButton: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: FBColors.primary,
    paddingHorizontal: '24@s',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    marginTop: '24@vs',
    alignItems: 'center',
  },
});

export default FillupIndent;
