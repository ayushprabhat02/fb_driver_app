/**
 * OCR Reading Screen - Simple Single Page Implementation
 * Captures maintenance form photos and auto-fills fields using OCR
 */

import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {OrderStackParamList} from '@/navigator/containers/Order';
import {orderStore} from '@/globalStore';
import Toast from 'react-native-toast-message';

interface FormData {
  dg_hours: string;
  eb_hours: string;
  battery_hours: string;
  technician_at_site: string;
  cumulative_ebrh: string;
  cumulative_bbrh: string;
  cumulative_dgrh: string;
  dg_status: string;
  dg_type: string;
  qrc: string;
  opening_stock: string;
  filled_quantity: string;
  dg_hmr: string;
  piu_hmr: string;
  tank_depth_before: string;
  tank_depth_after: string;
  location: string;
  coordinates: string;
  date_time: string;
}

const {width, height} = Dimensions.get('window');

const OCRReadingScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<OrderStackParamList>>();
  const cameraRef = useRef<RNCamera>(null);

  // State
  const [formData, setFormData] = useState<FormData>({
    dg_hours: '',
    eb_hours: '',
    battery_hours: '',
    technician_at_site: '',
    cumulative_ebrh: '',
    cumulative_bbrh: '',
    cumulative_dgrh: '',
    dg_status: '',
    dg_type: '',
    qrc: '',
    opening_stock: '',
    filled_quantity: '',
    dg_hmr: '',
    piu_hmr: '',
    tank_depth_before: '',
    tank_depth_after: '',
    location: '',
    coordinates: '',
    date_time: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrCompleted, setOcrCompleted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const OCR_API_URL = 'https://easyocr.fuelbuddy.in/extract-smart-form';

  // Open Camera
  const openCamera = () => {
    setShowCamera(true);
  };

  // Close Camera
  const closeCamera = () => {
    setShowCamera(false);
  };

  // Take Picture
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = {
          quality: 0.8,
          base64: true,
          pauseAfterCapture: true,
        };

        const data = await cameraRef.current.takePictureAsync(options);

        closeCamera();

        if (data.base64) {
          processImage(data.base64);
        } else {
          Alert.alert('Error', 'Failed to capture image');
        }
      } catch (error) {
        console.error('Camera Error:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  // Process OCR
  const processImage = async (base64Image: string) => {
    setIsProcessing(true);

    try {
      const response = await axios.post(
        OCR_API_URL,
        {image: base64Image},
        {
          headers: {'Content-Type': 'application/json'},
          timeout: 30000,
        },
      );

      // Auto-fill form
      const extracted = response.data.extracted_fields || {};
      const updated = {...formData};

      Object.keys(extracted).forEach(key => {
        if (key in updated) {
          (updated as any)[key] = extracted[key].toString();
        }
      });

      setFormData(updated);
      setOcrCompleted(true);

      Toast.show({
        type: 'success',
        text1: 'OCR Success',
        text2: `Extracted ${Object.keys(extracted).length} fields`,
        position: 'top',
      });
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('OCR Failed', 'Please try again or enter data manually');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update field
  const updateField = (key: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  // Reset form
  const resetForm = () => {
    Alert.alert('Reset Form', 'Clear all fields?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setFormData({
            dg_hours: '',
            eb_hours: '',
            battery_hours: '',
            technician_at_site: '',
            cumulative_ebrh: '',
            cumulative_bbrh: '',
            cumulative_dgrh: '',
            dg_status: '',
            dg_type: '',
            qrc: '',
            opening_stock: '',
            filled_quantity: '',
            dg_hmr: '',
            piu_hmr: '',
            tank_depth_before: '',
            tank_depth_after: '',
            location: '',
            coordinates: '',
            date_time: '',
          });
          setOcrCompleted(false);
        },
      },
    ]);
  };

  // Check if all fields filled
  const allFieldsFilled = () => {
    return Object.values(formData).every(
      v => v && v.toString().trim() !== '',
    );
  };

  // Proceed
  const handleProceed = () => {
    if (!allFieldsFilled()) {
      Alert.alert('Incomplete', 'Please fill all fields before proceeding');
      return;
    }

    // Save to store
    orderStore.setState(state => ({
      ...state,
      ocrData: formData,
    }));

    Toast.show({
      type: 'success',
      text1: 'Data Saved',
      text2: 'OCR data saved successfully',
      position: 'top',
    });

    // Navigate based on order type
    const currentDriverOrder = orderStore.getState().currentDriverOrder;
    if (currentDriverOrder?.is_enable_buddycan_flow) {
      navigation.navigate('buddy-challan');
    } else {
      navigation.navigate('delivery-challan');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OCR Form Reading</Text>
        <TouchableOpacity onPress={resetForm}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Capture Button */}
        <TouchableOpacity
          style={[styles.captureBtn, ocrCompleted && styles.captureBtnSuccess]}
          onPress={openCamera}
          disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.captureBtnText}>
              {ocrCompleted ? '✓ Captured - Tap to Retake' : '📷 Capture Form'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingText}>
              Processing OCR... (15-20 sec)
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Information</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DG Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_hours}
                onChangeText={v => updateField('dg_hours', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>EB Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.eb_hours}
                onChangeText={v => updateField('eb_hours', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Battery Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.battery_hours}
                onChangeText={v => updateField('battery_hours', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Technician *</Text>
              <TextInput
                style={styles.input}
                value={formData.technician_at_site}
                onChangeText={v => updateField('technician_at_site', v)}
                placeholder="Yes/No"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cumulative Data</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>EBRH *</Text>
              <TextInput
                style={styles.input}
                value={formData.cumulative_ebrh}
                onChangeText={v => updateField('cumulative_ebrh', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>BBRH *</Text>
              <TextInput
                style={styles.input}
                value={formData.cumulative_bbrh}
                onChangeText={v => updateField('cumulative_bbrh', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <TextInput
            style={styles.inputFull}
            value={formData.cumulative_dgrh}
            onChangeText={v => updateField('cumulative_dgrh', v)}
            placeholder="Cumulative DGRH *"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel & DG Data</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DG Status *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_status}
                onChangeText={v => updateField('dg_status', v)}
                placeholder="Auto/Manual"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>DG Type *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_type}
                onChangeText={v => updateField('dg_type', v)}
                placeholder="A/B/C"
              />
            </View>
          </View>
          <TextInput
            style={styles.inputFull}
            value={formData.qrc}
            onChangeText={v => updateField('qrc', v)}
            placeholder="QRC *"
          />
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Opening Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.opening_stock}
                onChangeText={v => updateField('opening_stock', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Filled Qty *</Text>
              <TextInput
                style={styles.input}
                value={formData.filled_quantity}
                onChangeText={v => updateField('filled_quantity', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DG HMR *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_hmr}
                onChangeText={v => updateField('dg_hmr', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>PIU HMR *</Text>
              <TextInput
                style={styles.input}
                value={formData.piu_hmr}
                onChangeText={v => updateField('piu_hmr', v)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tank Information</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Depth Before *</Text>
              <TextInput
                style={styles.input}
                value={formData.tank_depth_before}
                onChangeText={v => updateField('tank_depth_before', v)}
                keyboardType="numeric"
                placeholder="0.0"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Depth After *</Text>
              <TextInput
                style={styles.input}
                value={formData.tank_depth_after}
                onChangeText={v => updateField('tank_depth_after', v)}
                keyboardType="numeric"
                placeholder="0.0"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Time</Text>
          <TextInput
            style={styles.inputFull}
            value={formData.location}
            onChangeText={v => updateField('location', v)}
            placeholder="Location *"
          />
          <TextInput
            style={styles.inputFull}
            value={formData.coordinates}
            onChangeText={v => updateField('coordinates', v)}
            placeholder="Coordinates *"
          />
          <TextInput
            style={styles.inputFull}
            value={formData.date_time}
            onChangeText={v => updateField('date_time', v)}
            placeholder="Date & Time *"
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            !allFieldsFilled() && styles.proceedBtnDisabled,
          ]}
          onPress={handleProceed}
          disabled={!allFieldsFilled()}>
          <Text style={styles.proceedBtnText}>Proceed</Text>
        </TouchableOpacity>
      </View>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={closeCamera}>
        <View style={styles.cameraContainer}>
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.auto}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}>
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  onPress={closeCamera}
                  style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraFooter}>
                <TouchableOpacity
                  onPress={takePicture}
                  style={styles.captureButton}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </RNCamera>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  captureBtn: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  captureBtnSuccess: {
    backgroundColor: '#10b981',
  },
  captureBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color:'black'
  },
  inputFull: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: 'black',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  proceedBtn: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedBtnDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  proceedBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});

export default OCRReadingScreen;
