import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Image,
  TouchableOpacity,
} from 'react-native';
import {Text, Button, Input, Container, CardElevated, FullScreenLoader} from '@/components';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import OCRService, {ExtractedOrderData} from '@/modules/order/services/OCRService';
import ImagePreprocessing from '@/modules/order/utils/ImagePreprocessing';
import {getTestData, createMockOCRResult} from '@/modules/order/utils/OCRTestData';
import {FBColors, FBBackground} from '@/types/styles';
import {commonHeaderStyles} from '@/styles';
import {BackButtonArrow} from '@/components';

interface OCRReading {
  orderId: string;
  quantity: string;
  customerName: string;
  location: string;
  fuelType: string;
  confidence: number;
}

interface ProcessedOCRData {
  text: string;
  extractedData: ExtractedOrderData;
  confidence: number;
  imageQuality?: number;
  qualityIssues?: string[];
  recommendations?: string[];
}

const OCRReadingScreen: React.FC = ({navigation}: any) => {
  const [imageUri, setImageUri] = useState<string>('');
  const [processedData, setProcessedData] = useState<ProcessedOCRData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageQuality, setImageQuality] = useState<number>(0);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Form fields matching the Vue project structure
  const [formData, setFormData] = useState({
    orderId: '',
    quantity: '',
    customerName: '',
    location: '',
    fuelType: '',
  });

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose an option to select image',
      [
        {text: 'Camera', onPress: openCamera},
        {text: 'Gallery', onPress: openGallery},
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true}
    );
  };

  const openCamera = () => {
    const options = ImagePreprocessing.getOptimalCameraSettings();

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to open camera');
      } else if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        if (uri) {
          setImageUri(uri);
          processImage(uri);
        }
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled gallery');
      } else if (response.errorCode) {
        console.log('Gallery Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to open gallery');
      } else if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        if (uri) {
          setImageUri(uri);
          processImage(uri);
        }
      }
    });
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    setIsProcessing(true);
    
    try {
      // Check image quality first
      const qualityScore = await ImagePreprocessing.getImageQualityScore(uri);
      const validation = await ImagePreprocessing.validateImageQuality(uri);
      
      setImageQuality(qualityScore);
      setQualityIssues(validation.issues);
      setRecommendations(validation.recommendations);
      
      // Preprocess image
      const processedImagePath = await ImagePreprocessing.preprocessImage(uri);
      
      // Use the OCR service for high-accuracy text extraction
      const result = await OCRService.processImage(processedImagePath);
      
      setProcessedData({
        text: result.text,
        extractedData: result.extractedData,
        confidence: result.extractedData.confidence || 0,
        imageQuality: qualityScore,
        qualityIssues: validation.issues,
        recommendations: validation.recommendations,
      });
      
      // Auto-fill form with extracted data
      setFormData(prev => ({
        orderId: result.extractedData.orderId || prev.orderId,
        quantity: result.extractedData.quantity || prev.quantity,
        customerName: result.extractedData.customerName || prev.customerName,
        location: result.extractedData.location || prev.location,
        fuelType: result.extractedData.fuelType || prev.fuelType,
      }));
      
      // Show quality warning if needed
      if (qualityScore < 70) {
        Alert.alert(
          'Low Image Quality',
          `Image quality: ${qualityScore}%. ${validation.recommendations.join('. ')}.`,
          [{text: 'OK'}]
        );
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };



  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testOCRWithSample = async (sampleIndex: number) => {
    try {
      setIsProcessing(true);
      
      const testData = getTestData('good');
      const sample = testData[sampleIndex];
      
      if (!sample) {
        Alert.alert('Error', 'Invalid test sample');
        return;
      }
      
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResult = createMockOCRResult(sample.text);
      const processedData = await OCRService.processImage(mockResult);
      
      // Update form fields with extracted data
      setFormData(prev => ({
        orderId: processedData.extractedData.orderId || prev.orderId,
        quantity: processedData.extractedData.quantity || prev.quantity,
        fuelType: processedData.extractedData.fuelType || prev.fuelType,
        customerName: processedData.extractedData.customerName || prev.customerName,
        location: processedData.extractedData.location || prev.location,
      }));
      
      // Set image quality info
      setImageQuality(85);
      setQualityIssues([]);
      setRecommendations(['Good quality image', 'All fields extracted successfully']);
      
      Alert.alert('Success', `Test OCR completed! Extracted Order ID: ${processedData.extractedData.orderId}`);
      
    } catch (error) {
      console.error('Test OCR failed:', error);
      Alert.alert('Test Error', 'Failed to process test image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.orderId || !formData.quantity || !formData.fuelType) {
      Alert.alert('Validation Error', 'Please fill in Order ID, Quantity, and Fuel Type');
      return;
    }

    // Submit form data
    Alert.alert('Success', 'Order data submitted successfully!', [
      {
        text: 'OK',
        onPress: () => {
          // Reset form after successful submission
          setFormData({
            orderId: '',
            quantity: '',
            fuelType: '',
            location: '',
            customerName: '',
          });
          setImageUri('');
          setProcessedData(null);
          setImageQuality(0);
          setQualityIssues([]);
          setRecommendations([]);
        },
      },
    ]);
  };

  return (
    <Container style={styles.container}>
      <FullScreenLoader visible={isProcessing} text="Processing image..." />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>OCR Reading</Text>
        <Text style={styles.subtitle}>Upload or capture an image to extract order details</Text>
        
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => setShowHelp(!showHelp)}
        >
          <Text style={styles.helpButtonText}>
            {showHelp ? 'Hide Tips' : 'Show OCR Tips'}
          </Text>
        </TouchableOpacity>

        {showHelp && (
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>OCR Best Practices:</Text>
            {ImagePreprocessing.getOCRBestPractices().map((tip, index) => (
              <Text key={index} style={styles.helpItem}>• {tip}</Text>
            ))}
          </View>
        )}

        {/* Test Mode Section */}
        {testMode && (
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>🧪 Test Mode</Text>
            <Text style={styles.testDescription}>Test OCR with sample documents:</Text>
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testOCRWithSample(0)}
                disabled={isProcessing}
              >
                <Text style={styles.testButtonText}>Test Standard Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testOCRWithSample(1)}
                disabled={isProcessing}
              >
                <Text style={styles.testButtonText}>Test Petrol Delivery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testOCRWithSample(2)}
                disabled={isProcessing}
              >
                <Text style={styles.testButtonText}>Test Bulk Order</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.disableTestButton}
              onPress={() => setTestMode(false)}
            >
              <Text style={styles.disableTestButtonText}>Disable Test Mode</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Image Selection */}
        <CardElevated style={styles.imageCard}>
          <Pressable style={styles.imageContainer} onPress={showImagePicker}>
            {imageUri ? (
              <Image source={{uri: imageUri}} style={styles.selectedImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Tap to select image</Text>
                <Text style={styles.placeholderSubtext}>Camera or Gallery</Text>
              </View>
            )}
          </Pressable>
        </CardElevated>

        {/* Recognized Text Display */}
        {processedData && (
          <CardElevated style={styles.textCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recognized Text</Text>
              <View style={[styles.confidenceBadge, processedData.confidence >= 80 ? styles.highConfidence : processedData.confidence >= 60 ? styles.mediumConfidence : styles.lowConfidence]}>
                <Text style={styles.confidenceText}>
                  {processedData.confidence}% Accuracy
                </Text>
              </View>
            </View>
            
            {processedData.imageQuality && (
              <View style={styles.qualityIndicator}>
                <Text style={styles.qualityLabel}>Image Quality:</Text>
                <View style={[styles.qualityBadge, processedData.imageQuality >= 80 ? styles.highQuality : processedData.imageQuality >= 60 ? styles.mediumQuality : styles.lowQuality]}>
                  <Text style={styles.qualityText}>{processedData.imageQuality}%</Text>
                </View>
              </View>
            )}
            
            <Text style={styles.recognizedText} numberOfLines={5}>
              {processedData.text}
            </Text>
            
            {processedData.confidence < 70 && (
              <Text style={styles.lowConfidenceWarning}>
                ⚠️ Low confidence reading. Please verify and correct the details below.
              </Text>
            )}
            
            {processedData.qualityIssues && processedData.qualityIssues.length > 0 && (
              <View style={styles.qualityIssues}>
                <Text style={styles.issuesTitle}>Image Issues:</Text>
                {processedData.qualityIssues.map((issue, index) => (
                  <Text key={index} style={styles.issueText}>• {issue}</Text>
                ))}
              </View>
            )}
            
            {processedData.recommendations && processedData.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {processedData.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </CardElevated>
        )}

        {/* Form Fields */}
        <CardElevated style={styles.formCard}>
          <Text style={styles.cardTitle}>Extracted Information</Text>
          
          <Input
            label="Order ID"
            placeholder="Enter Order ID"
            value={formData.orderId}
            onChangeText={(text) => handleInputChange('orderId', text)}
            style={styles.input}
          />
          
          <Input
            label="Quantity (Litres)"
            placeholder="Enter Quantity"
            value={formData.quantity}
            onChangeText={(text) => handleInputChange('quantity', text)}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Input
            label="Customer Name"
            placeholder="Enter Customer Name"
            value={formData.customerName}
            onChangeText={(text) => handleInputChange('customerName', text)}
            style={styles.input}
          />
          
          <Input
            label="Location"
            placeholder="Enter Location"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            style={styles.input}
          />
          
          <Input
            label="Fuel Type"
            placeholder="Enter Fuel Type"
            value={formData.fuelType}
            onChangeText={(text) => handleInputChange('fuelType', text)}
            style={styles.input}
          />
        </CardElevated>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Process Order"
            onPress={handleSubmit}
            disabled={loading || !formData.orderId || !formData.quantity}
            style={styles.submitButton}
          />
          
          <Button
            title="Select New Image"
            onPress={showImagePicker}
            variant="secondary"
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: FBColors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: FBColors.mediumGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  imageCard: {
    marginBottom: 16,
    padding: 16,
  },
  imageContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: FBBackground.input,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: FBColors.mediumGray,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: FBColors.slate,
  },
  textCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: FBColors.primary,
  },
  confidenceBadge: {
    backgroundColor: FBColors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: FBColors.white,
    fontWeight: '600',
  },
  recognizedText: {
    fontSize: 12,
    color: FBColors.neutral,
    lineHeight: 18,
  },
  lowConfidenceWarning: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },
  helpButton: {
    backgroundColor: FBColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 10,
    alignSelf: 'center',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: FBColors.textPrimary,
    marginBottom: 8,
  },
  helpItem: {
    fontSize: 12,
    color: FBColors.textSecondary,
    marginVertical: 2,
    lineHeight: 16,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  qualityLabel: {
    fontSize: 12,
    color: FBColors.textSecondary,
    marginRight: 8,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  highQuality: {
    backgroundColor: '#28a745',
  },
  mediumQuality: {
    backgroundColor: '#ffc107',
  },
  lowQuality: {
    backgroundColor: '#dc3545',
  },
  qualityIssues: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  issuesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 11,
    color: '#721c24',
    marginVertical: 1,
  },
  recommendations: {
    backgroundColor: '#d1ecf1',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0c5460',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 11,
    color: '#0c5460',
    marginVertical: 1,
  },
  testSection: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 12,
    color: '#424242',
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  disableTestButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  disableTestButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  submitButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: FBColors.primary,
  },
});

export default OCRReadingScreen;