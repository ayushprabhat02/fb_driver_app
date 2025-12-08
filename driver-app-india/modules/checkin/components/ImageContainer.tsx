import React, {useRef, useState} from 'react';
import {View, TouchableOpacity, Image, StyleSheet, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RNCamera} from 'react-native-camera';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {Text, FullScreenLoader} from '@/components';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import SupportService from '@/modules/support/services';

// Polyfill Buffer for React Native
global.Buffer = Buffer;

interface ImageContainerProps {
  label: string;
  imageData?: string | null;
  imageStoreUrl?: string | null;
  isUploading: boolean;
  onImageCaptured?: (imageUri: string, storeUrl: string) => void;
  onCameraPress?: () => void;
  onRemovePhoto?: () => void;
  uploadingText: string;
  required?: boolean;
}

const ImageContainer: React.FC<ImageContainerProps> = ({
  label,
  imageData,
  imageStoreUrl,
  isUploading,
  onImageCaptured,
  onCameraPress,
  onRemovePhoto,
  uploadingText,
  required = false,
}) => {
  const cameraRef = useRef<RNCamera | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Use old API if onCameraPress is provided
  const useOldAPI = !!onCameraPress;

  const openCamera = async () => {
    if (useOldAPI && onCameraPress) {
      onCameraPress();
      return;
    }
    const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA);
    if (cameraPermission === RESULTS.DENIED) {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result !== RESULTS.GRANTED) {
        Toast.show({
          type: 'error',
          text1: 'Camera Permission Denied',
          text2: 'Please enable camera permission to capture images',
          visibilityTime: 4000,
        });
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
      setUploading(true);
      await uploadImage(data.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const base64Data = await RNFS.readFile(uri, 'base64');
      const buffer = Buffer.from(base64Data, 'base64');

      console.log('📸 Image upload debug:', {
        uri,
        base64Length: base64Data.length,
        bufferLength: buffer.length,
      });

      if (buffer.length === 0) {
        throw new Error('Image file is empty');
      }

      const {src, storeUrl} = await SupportService.uploadFile({
        fileName: `${Date.now()}_image.jpg`,
        contentType: 'image/jpeg',
        fileData: buffer,
      });
      
      console.log('✅ Upload successful:', {src, storeUrl});

      if (storeUrl && onImageCaptured) {
        onImageCaptured(uri, storeUrl);
        Toast.show({
          type: 'success',
          text1: 'Image Uploaded',
          text2: 'Image uploaded successfully',
          visibilityTime: 3000,
        });
      } else {
        console.error('❌ Upload failed: storeUrl is missing');
        throw new Error('Upload failed: No store URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Failed to upload image. Please try again.',
        visibilityTime: 4000,
      });
    } finally {
      setUploading(false);
    }
  };

  const renderCameraModal = () => {
    if (useOldAPI) return null;
    
    const cameraType = RNCamera.Constants.Type.back;

    return (
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}>
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
      </Modal>
    );
  };

  return (
    <>
      {renderCameraModal()}
      <View style={styles.container}>
      {!imageData ? (
        <View style={styles.compactSectionHeader}>
          <Text size="base" weight="600" color="secondary">
            {label}
            {required && <Text style={styles.asterisk}> *</Text>}
          </Text>
          <TouchableOpacity
            onPress={openCamera}
            style={styles.minimalistCameraButton}
            disabled={isUploading || uploading}>
            <Icon name="camera-alt" size={20} color={FBColors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text
            size="base"
            weight="600"
            color="secondary"
            style={styles.compactLabel}>
            {label}
            {required && <Text style={styles.asterisk}> *</Text>}
          </Text>
          <View style={styles.compactImageView}>
            <Image source={{uri: imageData}} style={styles.image} />
          </View>
          {onRemovePhoto && !isUploading && !uploading && (
            <TouchableOpacity
              onPress={onRemovePhoto}
              style={styles.crossButton}>
              <Icon name="close" size={16} color={FBColors.white} />
            </TouchableOpacity>
          )}
        </>
      )}
      {(isUploading || uploading) && (
        <FullScreenLoader showLoader={true} loaderText={uploadingText} />
      )}
      </View>
    </>
  );
};

export default ImageContainer;

const cameraStyles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  capture: {
    backgroundColor: FBColors.primary,
    borderRadius: 50,
    padding: 15,
    paddingHorizontal: 30,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: FBBackground.white,
    borderWidth: 1,
    borderColor: FBBorders.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  compactSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  },
  compactImageView: {
    height: 140,
    backgroundColor: FBBackground.softBlue,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  asterisk: {
    color: FBColors.error,
  },
  crossButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
