import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';

// Components
import {Text, Button} from '@/components';
import {ImageContainer} from '@/modules/checkin/components';

// Services
import testService from '../services';

// Types
import {FBColors, FBBackground} from '@/types/styles';
import {Test, TestFormData} from '../types';

interface TestCardProps {
  test: Test;
  onTestComplete: (testId: string, isPassed: boolean) => void;
}

const TestCard: React.FC<TestCardProps> = ({test, onTestComplete}) => {
  const {t} = useTranslation();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<TestFormData>({});

  const isDensityTest = test.slug === 'density-test';
  const isDipTest = test.slug === 'dip-test';
  const requiresImage =
    test.slug === 'water-test' || test.slug === '5-litre-jar';

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const updateFormData = (key: keyof TestFormData, value: any) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  // Image capture handlers - using new ImageContainer API with automatic upload
  const handleTestImageCaptured = (imageUri: string, storeUrl: string) => {
    updateFormData('imageUri', imageUri);
    updateFormData('imageStoreUrl', storeUrl);
  };

  const removeImage = () => {
    updateFormData('imageUri', undefined);
    updateFormData('imageStoreUrl', undefined);
  };

  const canSubmitTest = (): boolean => {
    // Density test requires all 3 readings
    if (isDensityTest) {
      return !!(
        formData.hydrometerReading &&
        formData.thermometerReading &&
        formData.densityReading
      );
    }

    // Dip test requires reading
    if (isDipTest) {
      return !!formData.dipReading;
    }

    // Other tests require image AND successful upload
    if (requiresImage) {
      return !!formData.imageUri && !!formData.imageStoreUrl;
    }

    return false;
  };

  const handleMarkTest = async (isPassed: boolean) => {
    if (!canSubmitTest()) {
      Alert.alert('Incomplete', 'Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      let reading = '0';
      if (isDensityTest) {
        // For density test, we'll submit separate results for each reading
        // First: Hydrometer
        await testService.submitTestResult({
          testId: test.id,
          testSlug: 'hydrometer-reading',
          isPassed,
          reading: String(formData.hydrometerReading || 0),
          imageStoreUrl: formData.imageStoreUrl,
        });

        // Second: Thermometer
        await testService.submitTestResult({
          testId: test.id,
          testSlug: 'thermometer-reading',
          isPassed,
          reading: String(formData.thermometerReading || 0),
        });

        // Third: Density
        await testService.submitTestResult({
          testId: test.id,
          testSlug: test.slug,
          isPassed,
          reading: String(formData.densityReading || 0),
        });

        reading = String(formData.densityReading);
      } else if (isDipTest) {
        reading = String(formData.dipReading || 0);
        await testService.submitTestResult({
          testId: test.id,
          testSlug: test.slug,
          isPassed,
          reading,
          imageStoreUrl: formData.imageStoreUrl,
        });
      } else {
        // Other tests (water, jar)
        await testService.submitTestResult({
          testId: test.id,
          testSlug: test.slug,
          isPassed,
          reading: '0',
          imageStoreUrl: formData.imageStoreUrl,
        });
      }

      // Mark as passed/failed
      updateFormData('isPassed', isPassed);

      // Notify parent
      onTestComplete(test.id, isPassed);

      Alert.alert(
        'Success',
        `Test marked as ${isPassed ? 'passed' : 'failed'}`,
      );
    } catch (error) {
      console.error('Error submitting test:', error);
      Alert.alert('Error', 'Failed to submit test result. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity
          style={styles.header}
          onPress={toggleExpand}
          activeOpacity={0.7}>
          <Text size="lg" weight="bold" color="primary">
            {test.name}
          </Text>
          <Text size="lg" weight="bold" color="primary">
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.content}>
            {/* Density Test - 3 readings */}
            {isDensityTest && (
              <>
                <Text
                  size="sm"
                  weight="600"
                  color="secondary"
                  style={styles.label}>
                  Hydrometer Reading *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter hydrometer reading"
                  keyboardType="numeric"
                  value={String(formData.hydrometerReading || '')}
                  onChangeText={text =>
                    updateFormData('hydrometerReading', parseFloat(text) || 0)
                  }
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />

                <Text
                  size="sm"
                  weight="600"
                  color="secondary"
                  style={styles.label}>
                  Thermometer Reading *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter thermometer reading"
                  keyboardType="numeric"
                  value={String(formData.thermometerReading || '')}
                  onChangeText={text =>
                    updateFormData('thermometerReading', parseFloat(text) || 0)
                  }
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />

                <Text
                  size="sm"
                  weight="600"
                  color="secondary"
                  style={styles.label}>
                  Density Reading *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter density reading"
                  keyboardType="numeric"
                  value={String(formData.densityReading || '')}
                  onChangeText={text =>
                    updateFormData('densityReading', parseFloat(text) || 0)
                  }
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            )}

            {/* Dip Test - reading + image */}
            {isDipTest && (
              <>
                <Text
                  size="sm"
                  weight="600"
                  color="secondary"
                  style={styles.label}>
                  Dip Reading *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter dip reading"
                  keyboardType="numeric"
                  value={String(formData.dipReading || '')}
                  onChangeText={text =>
                    updateFormData('dipReading', parseFloat(text) || 0)
                  }
                  placeholderTextColor={FBColors.placeHolderPrimary}
                />
              </>
            )}

            {/* Image upload for all tests except density - using ImageContainer */}
            {!isDensityTest && (
              <ImageContainer
                label={`Test Result Image`}
                imageData={formData.imageUri || null}
                imageStoreUrl={formData.imageStoreUrl || null}
                isUploading={isUploadingImage}
                onImageCaptured={handleTestImageCaptured}
                onRemovePhoto={removeImage}
                uploadingText="Uploading test image..."
                required={requiresImage}
              />
            )}

            {/* Pass/Fail Buttons */}
            <View style={styles.actions}>
              <Button
                variant="outlined"
                onPress={() => handleMarkTest(false)}
                disabled={!canSubmitTest() || isSubmitting}
                loading={isSubmitting && formData.isPassed === false}
                style={[
                  styles.actionButton,
                  formData.isPassed === false && styles.failedButton,
                ]}>
                Test Failed
              </Button>

              <Button
                variant="solid"
                onPress={() => handleMarkTest(true)}
                disabled={!canSubmitTest() || isSubmitting}
                loading={isSubmitting && formData.isPassed === true}
                style={[
                  styles.actionButton,
                  formData.isPassed === true && styles.passedButton,
                ]}>
                Test Passed
              </Button>
            </View>

            {isSubmitting && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={FBColors.primary} />
                <Text
                  size="sm"
                  weight="600"
                  color="primary"
                  style={{marginTop: 8}}>
                  Submitting test result...
                </Text>
              </View>
            )}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: FBBackground.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FBColors.borderPrimary,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: FBBackground.white,
    borderBottomWidth: 1,
    borderBottomColor: FBColors.borderPrimary,
  },
  content: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: FBColors.borderPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: FBColors.textPrimary,
    backgroundColor: FBBackground.white,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
  },
  passedButton: {
    borderColor: FBColors.success,
    borderWidth: 2,
  },
  failedButton: {
    borderColor: FBColors.error,
    borderWidth: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TestCard;
