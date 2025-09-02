import React, {useRef, useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {Button, Divider, HeaderAvoidingContainer, Text} from '@/components';
import {FBBackground, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import {orderStore} from '@/globalStore';
import {ImageContainer} from '@/modules/checkin/components';
import {RNCamera} from 'react-native-camera';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import supportService from '@/modules/support/services';
import orderStoreModule from '@/modules/order/store';
type LoaderTypes = 'totalizerImage' | 'quantityImage';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import orderService from '../services';

type RootStackParamList = {
  home: undefined;
};

const UploadImageAsset: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const cameraRef = useRef<RNCamera | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  type ImageCaptureType = 'totalizer' | 'quantity';

  const [imageType, setImageType] = useState<ImageCaptureType | null>(null);
  const [totalizerReading, setTotalizerReading] = useState('');
  const [quantityDispensed, setQuantityDispensed] = useState('');
  const [taskId, setTaskId] = useState<string>(
    '1fba7895-235b-49d0-8e67-060662de395c',
  ); // Example task ID

  // Use orderStore for image data
  const totalizerImageData = orderStore.use.totalizerImageData();
  const quantityImageData = orderStore.use.quantityImageData();
  const totalizerImageUploading = orderStore.use.loaders().totalizerImage;
  const quantityImageUploading = orderStore.use.loaders().quantityImage;
  const currentDriverOrder = orderStore.use.currentDriverOrder();

  // Fetch task value on component mount
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const response = await orderService.fetchTaskValue({
          task_id: currentDriverOrder?.[0]?.id,
        });
        if (response.task_value && response.task_value.length > 0) {
          const totalizerData = response.task_value.find(
            item => item.key === 'TOTALIZER_BEFORE_READING',
          );
          if (totalizerData && totalizerData.value) {
            setTotalizerReading(totalizerData.value);
          }
        }
      } catch (error) {
        console.error('Error fetching task value:', error);
      }
    };

    if (taskId) {
      fetchTaskData();
    }
  }, [taskId]);

  const validateAndSubmit = () => {
    if (
      !totalizerImageData ||
      !quantityImageData ||
      !totalizerReading ||
      !quantityDispensed
    ) {
      Alert.alert('Error', 'Please fill all required fields and upload images');
      return;
    }

    try {
      // Prepare fillup data for submission
      const fillupData = {
        totalizerReading: parseFloat(totalizerReading),
        quantityDispensed: parseFloat(quantityDispensed),
        totalizerImageUrl: totalizerImageData,
        quantityImageUrl: quantityImageData,
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage for now (replace with actual API call)
      localStorage.setItem('fillupData', JSON.stringify(fillupData));

      Alert.alert('Success', 'Fillup data submitted successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Failed to submit fillup data');
    }
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
        case 'totalizer':
          loaderType = 'totalizerImage';
          orderStore.setState({
            totalizerImageData: data.uri,
          });
          break;
        case 'quantity':
          loaderType = 'quantityImage';
          orderStore.setState({
            quantityImageData: data.uri,
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
      const {src, storeUrl} = await supportService.uploadFile({
        fileName: `${type}.jpg`,
        contentType: 'image/jpeg',
        fileData: blob,
      });
      console.log('Image uploaded:', {src, storeUrl});
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      orderStore.getState().stopLoader(loaderType);
    }
  };

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
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCamera(false)}
            style={styles.capture}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <HeaderAvoidingContainer paddingHorizontal={0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View>
          <Text
            size="base"
            weight="normal"
            color="secondary"
            style={styles.requiredLabel}>
            Totalizer Reading *
          </Text>
          <TextInput
            editable={true}
            keyboardType="numeric"
            style={[
              styles.inputStyle,
              !totalizerReading && styles.requiredInput,
            ]}
            placeholder="Totalizer reading"
            placeholderTextColor={FBColors.placeHolderPrimary}
            value={totalizerReading}
            onChangeText={setTotalizerReading}
          />
        </View>
        <Divider height={10} />

        <ImageContainer
          label="Totalizer Reading"
          imageData={totalizerImageData}
          isUploading={totalizerImageUploading}
          onCameraPress={() => openCamera('totalizer')}
          uploadingText="Uploading totalizer image..."
          required={true}
        />
        <Divider height={10} />
        <View>
          <Text
            size="base"
            weight="normal"
            color="secondary"
            style={styles.requiredLabel}>
            Enter Quantity Dispensed *
          </Text>
          <TextInput
            editable={true}
            keyboardType="numeric"
            style={[
              styles.inputStyle,
              !quantityDispensed && styles.requiredInput,
            ]}
            placeholder="Enter quantity dispensed"
            placeholderTextColor={FBColors.placeHolderPrimary}
            value={quantityDispensed}
            onChangeText={setQuantityDispensed}
          />
        </View>
        <Divider height={10} />

        <ImageContainer
          label="Quantity Dispensed"
          imageData={quantityImageData}
          isUploading={quantityImageUploading}
          onCameraPress={() => openCamera('quantity')}
          uploadingText="Uploading quantity image..."
          required={true}
        />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          style={[
            styles.button,
            (!totalizerImageData ||
              !quantityImageData ||
              !totalizerReading ||
              !quantityDispensed) &&
              styles.disabledButton,
          ]}
          variant="solid"
          onPress={validateAndSubmit}
          loading={false}
          disabled={
            !totalizerImageData ||
            !quantityImageData ||
            !totalizerReading ||
            !quantityDispensed
          }>
          {'Submit Fillup Data'}
        </Button>
      </View>
    </HeaderAvoidingContainer>
  );
};

export default UploadImageAsset;

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: FBBackground.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  placeholderView: {
    height: 200,
    backgroundColor: FBBackground.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  buttonContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginVertical: 20,

    backgroundColor: FBBackground.white,
  },
  button: {
    width: '100%',
  },
  inputStyle: {
    ...commonInputStyles,
    height: 50,
    fontSize: 14,
    fontWeight: '400',
    width: '100%',
  },
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
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  quantityCheckText: {
    textDecorationLine: 'none',
    color: FBColors.darkGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cameraIconButton: {
    backgroundColor: FBBackground.softBlue,
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageOnlyView: {
    height: 200,
    backgroundColor: FBBackground.softBlue,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  compactSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 12,
  },
  minimalistCameraButton: {
    backgroundColor: FBColors.primary,
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compactLabel: {
    marginBottom: 3,
    marginTop: 12,
  },
  compactImageView: {
    height: 140,
    backgroundColor: FBBackground.softBlue,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  requiredLabel: {
    marginBottom: 4,
    marginTop: 8,
  },
  requiredInput: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selfieBoxContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  vehicleDetailsContainer: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleDetailItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  vehicleLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleValue: {
    color: FBColors.darkGray,
  },
});
