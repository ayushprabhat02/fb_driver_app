import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';

// Components
import {
  Container,
  Text,
  Button,
  CardElevated,
  Input,
  ImageUploader,
} from '@/components';

// Store
import {orderStore} from '@/globalStore';

// Services
import orderService from '../services';

// Types
import {FBColors, FBBackground} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';

type DeliveryChallanNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'delivery-challan'
>;

interface DropdownOption {
  label: string;
  value: string;
}

interface ChallanFormData {
  fuelDeliveredTo: string;
  challanNumber: string;
  technicianName: string;
  technicianPhone: string;
  remarks: string;
  challanImage: string;
  technicianImage: string;
}

const DeliveryChallanScreen: React.FC = () => {
  const navigation = useNavigation<DeliveryChallanNavigationProp>();

  // State
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState<ChallanFormData>({
    fuelDeliveredTo: '',
    challanNumber: '',
    technicianName: '',
    technicianPhone: '',
    remarks: '',
    challanImage: '',
    technicianImage: '',
  });

  // Store
  const selectedOrder = orderStore.use.currentDriverOrder();
  const dispenseCompletedAssets = orderStore.use.dispenseCompletedAssets();

  // Dropdown options for fuel delivery
  const fuelDeliveryOptions: DropdownOption[] = [
    {label: 'Jerry Can', value: 'jerry_can'},
    {label: 'Tank', value: 'tank'},
    {label: 'Other', value: 'other'},
  ];

  const validateForm = (): boolean => {
    if (!formData.fuelDeliveredTo) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select fuel delivery method',
      });
      return false;
    }

    if (!formData.challanNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter challan number',
      });
      return false;
    }

    if (!formData.technicianName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter technician name',
      });
      return false;
    }

    if (!formData.challanImage) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload challan image',
      });
      return false;
    }

    if (!formData.technicianImage) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please upload technician image',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedOrder?.id || !selectedOrder?.customer_order?.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Order data is missing',
      });
      return;
    }

    try {
      setLoading(true);

      const totalDispensed = getTotalDispensed();

      // Get current location for task actions
      const getCurrentLocation = (): Promise<{
        latitude: number;
        longitude: number;
      }> => {
        return new Promise(resolve => {
          // Use fallback coordinates for now (actual implementation would use proper geolocation)
          resolve({
            latitude: 28.626330828,
            longitude: 77.218499126,
          });
        });
      };

      const coordinates = await getCurrentLocation();

      // Step 1: Upload images and create challan task with location
      await orderService.upsertStepTaskAction({
        object: {
          key: 'CHALLAN',
          url: formData.challanImage,
          value: formData.challanNumber,
          quantity_dispensed: totalDispensed,
          task_id: selectedOrder.id,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Step 2: Create technician task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'TECHNICIAN',
          url: formData.technicianImage,
          value: formData.technicianName,
          task_id: selectedOrder.id,
        },
      });

      // Step 3: Create delivery method task
      await orderService.upsertStepTaskAction({
        object: {
          key: 'FUEL_DELIVERY_METHOD',
          url: '',
          value: formData.fuelDeliveredTo,
          task_id: selectedOrder.id,
        },
      });

      // Step 4: Create invoice (following Vue.js pattern)
      try {
        // Calculate rate and invoice items
        let rate = 0;
        if (
          selectedOrder.customer_order?.organization_user?.organization
            ?.is_credit_available
        ) {
          // For postpaid orders, fetch rate from serviceability check
          const franchise = await orderService.checkServiceability({
            lat: coordinates.latitude,
            lng: coordinates.longitude,
          });

          if (
            franchise?.partner_localities?.[0]
              ?.product_partner_localities_prices?.[0]?.parent_id
          ) {
            const priceData =
              await orderService.fetchDeliveryProductsWithPrices({
                id: franchise.partner_localities[0]
                  .product_partner_localities_prices[0].parent_id,
              });
            rate = priceData[0]?.sale_price || 0;
          }
        } else {
          // For prepaid orders, use unit price from order items
          rate =
            selectedOrder.customer_order?.customer_order_items?.[0]
              ?.unit_price || 0;
        }

        // Create invoice items from dispensed assets
        const invoicedItems =
          dispenseCompletedAssets?.map((asset: any) => ({
            unit_price: rate,
            actual_amount: (asset.quantity_dispensed || 0) * rate,
            actual_qty: asset.quantity_dispensed || 0,
            amount: (asset.quantity_dispensed || 0) * rate,
            customer_asset_id: asset.customer_asset?.id,
            discount: 0.0,
            is_active: true,
            order_item_id:
              selectedOrder.customer_order?.customer_order_items?.[0]?.id,
            product_variation_id:
              selectedOrder.customer_order?.customer_order_items?.[0]
                ?.product_variation_id,
            qty: asset.quantity_dispensed || 0,
            service_tax:
              selectedOrder.customer_order?.customer_order_items?.[0]
                ?.service_tax || 0,
            state: 'DELIVERED',
            tax: 0.0,
            unit: 'LTRS',
          })) || [];

        const totalAmount = totalDispensed * rate;

        // Fetch delivery fee
        const deliveryFeeData = await orderService.fetchDeliveryFee({
          customer_order_id: selectedOrder.customer_order.id,
          total_dispensed_qty: totalDispensed,
        });

        const finalAmount =
          totalAmount +
          (deliveryFeeData?.delivery_fees || 0) -
          (deliveryFeeData?.discount || 0);

        // Create invoice
        await orderService.createInvoice({
          delivery_fee: String(deliveryFeeData?.delivery_fees || 0),
          actual_amount: String(finalAmount),
          dispensedQty: String(totalDispensed),
          invoiced_items: invoicedItems,
          charges: deliveryFeeData?.delivery_fees_no_tax || 0,
          tax: deliveryFeeData?.total_tax || 0,
          discount: deliveryFeeData?.discount || 0,
          customer_order_id: selectedOrder.customer_order.id,
        });
      } catch (invoiceError) {
        console.warn(
          'Invoice creation failed, continuing with order completion:',
          invoiceError,
        );
      }

      // Step 5: Add transaction logs (if vehicle details are available)
      try {
        // Note: This requires vehicle details which may not be available in current context
        // In a real implementation, you would get vehicle info from driver store or API
        // For now, we'll skip this step if vehicle info is not available
        const vehicleId = null; // orderStore.getState().driverVehicleDetails?.id;
        if (vehicleId && dispenseCompletedAssets?.[0]) {
          await orderService.addTransactionLogs({
            quantity: totalDispensed,
            product_var_id:
              selectedOrder.customer_order.customer_order_items?.[0]
                ?.product_variation_id || '',
            fillup_request_id: null,
            customer_order_id: selectedOrder.customer_order.id,
            vehicle_id: vehicleId,
            transaction_type: 'OUT',
          });
        }
      } catch (transactionError) {
        console.warn(
          'Transaction logs creation failed, continuing with order completion:',
          transactionError,
        );
      }

      // Step 6: Mark order as completed
      await orderService.markOrderCompleted({
        id: selectedOrder.id,
      });

      Toast.show({
        type: 'success',
        text1: 'Order Completed',
        text2: 'Delivery challan has been submitted successfully',
      });

      // Navigate back to orders list or dashboard
      navigation.reset({
        index: 0,
        routes: [{name: 'delivery-orders'}],
      });
    } catch (error) {
      console.error('Error submitting challan:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Failed to submit delivery challan. Please try again.',
      });
    } finally {
      setLoading(false);
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

  const renderDropdownOption = ({item}: {item: DropdownOption}) => (
    <TouchableOpacity
      style={styles.dropdownOption}
      onPress={() => {
        setFormData(prev => ({...prev, fuelDeliveredTo: item.value}));
        setShowDropdown(false);
      }}>
      <Text size="lg" color="neutral">
        {item.label}
      </Text>
    </TouchableOpacity>
  );

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

  const getSelectedDeliveryLabel = () => {
    const option = fuelDeliveryOptions.find(
      opt => opt.value === formData.fuelDeliveredTo,
    );
    return option?.label || 'Select delivery method';
  };

  return (
    <Container style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <CardElevated>
          <Text weight="700" size="lg" color="neutral">
            Delivery Summary
          </Text>

          <View style={styles.summaryRow}>
            <Text size="sm" color="lightGray">
              Order Code:
            </Text>
            <Text size="sm" color="primary" weight="600">
              #{selectedOrder?.customer_order?.order_code || 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text size="sm" color="lightGray">
              Total Dispensed:
            </Text>
            <Text size="lg" color="primary" weight="700">
              {getTotalDispensed()}L
            </Text>
          </View>

          <View style={styles.separator} />

          <Text weight="600" size="sm" color="neutral">
            Dispensed Assets:
          </Text>
          {renderDispensedAssets()}
        </CardElevated>

        {/* Delivery Challan Form */}
        <CardElevated>
          <Text weight="700" size="lg" color="neutral">
            Delivery Challan Details
          </Text>

          {/* Fuel Delivered To Dropdown */}
          <View style={styles.fieldContainer}>
            <Text>Fuel Delivered To *</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowDropdown(true)}>
              <Text
                size="lg"
                color={formData.fuelDeliveredTo ? 'neutral' : 'lightGray'}>
                {getSelectedDeliveryLabel()}
              </Text>
              <Text size="lg" color="lightGray">
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          {/* Challan Number */}
          <View style={styles.fieldContainer}>
            <Text>Challan Number *</Text>
            <Input
              value={formData.challanNumber}
              onChangeText={text =>
                setFormData(prev => ({...prev, challanNumber: text}))
              }
              placeholder="Enter challan number"
            />
          </View>

          {/* Technician Details */}
          <View style={styles.fieldContainer}>
            <Text>Technician Name *</Text>
            <Input
              value={formData.technicianName}
              onChangeText={text =>
                setFormData(prev => ({...prev, technicianName: text}))
              }
              placeholder="Enter technician name"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text>Technician Phone</Text>
            <Input
              value={formData.technicianPhone}
              onChangeText={text =>
                setFormData(prev => ({...prev, technicianPhone: text}))
              }
              placeholder="Enter technician phone"
              type="phone-pad"
            />
          </View>

          {/* Remarks */}
          <View style={styles.fieldContainer}>
            <Text>Remarks</Text>
            <Input
              value={formData.remarks}
              onChangeText={text =>
                setFormData(prev => ({...prev, remarks: text}))
              }
              placeholder="Enter any remarks"
              style={{}}
            />
          </View>
        </CardElevated>

        {/* Image Uploads */}
        <CardElevated>
          <Text weight="700" size="lg" color="neutral">
            Upload Images
          </Text>

          {/* Challan Image */}
          <View style={styles.imageContainer}>
            <Text>Challan Image *</Text>
            <View
              style={{
                height: 100,
                backgroundColor: '#f0f0f0',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text>Image Upload Placeholder - Challan</Text>
            </View>
          </View>

          {/* Technician Image */}
          <View style={styles.imageContainer}>
            <Text>Technician Image *</Text>
            <View
              style={{
                height: 100,
                backgroundColor: '#f0f0f0',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text>Image Upload Placeholder - Technician</Text>
            </View>
          </View>
        </CardElevated>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          variant="solid"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}>
          Complete Order
        </Button>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownModal}>
            <Text weight="600" size="lg" color="neutral">
              Select Fuel Delivery Method
            </Text>
            <FlatList
              data={fuelDeliveryOptions}
              renderItem={renderDropdownOption}
              keyExtractor={item => item.value}
              style={styles.dropdownList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: '16@s',
    padding: '16@s',
  },
  formCard: {
    marginHorizontal: '16@s',
    marginBottom: '16@vs',
    padding: '16@s',
  },
  imageCard: {
    marginHorizontal: '16@s',
    marginBottom: '16@vs',
    padding: '16@s',
  },
  cardTitle: {
    marginBottom: '16@vs',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  separator: {
    height: 1,
    backgroundColor: FBColors.lightGray,
    marginVertical: '12@vs',
  },
  assetsTitle: {
    marginBottom: '8@vs',
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4@vs',
  },
  noAssetsText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fieldContainer: {
    marginBottom: '16@vs',
  },
  fieldLabel: {
    fontSize: '14@s',
    fontWeight: '600',
    color: FBColors.neutral,
    marginBottom: '8@vs',
  },
  input: {
    borderWidth: 1,
    borderColor: FBColors.lightGray,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    fontSize: '16@s',
  },
  textArea: {
    borderWidth: 1,
    borderColor: FBColors.lightGray,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    fontSize: '16@s',
    minHeight: '80@vs',
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FBColors.lightGray,
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
  },
  imageContainer: {
    marginBottom: '16@vs',
  },
  footer: {
    padding: '16@s',
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: FBColors.lightGray,
  },
  submitButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: FBBackground.white,
    borderRadius: '12@s',
    padding: '20@s',
    minWidth: '280@s',
    maxHeight: '300@vs',
  },
  dropdownTitle: {
    marginBottom: '16@vs',
    textAlign: 'center',
  },
  dropdownList: {
    maxHeight: '200@vs',
  },
  dropdownOption: {
    paddingVertical: '12@vs',
    paddingHorizontal: '16@s',
    borderBottomWidth: 1,
    borderBottomColor: FBColors.lightGray,
  },
});

export default DeliveryChallanScreen;
