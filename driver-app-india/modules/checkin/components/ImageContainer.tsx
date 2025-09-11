import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Text, FullScreenLoader} from '@/components';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

interface ImageContainerProps {
  label: string;
  imageData?: string | null;
  isUploading: boolean;
  onCameraPress: () => void;
  onRemovePhoto?: () => void;
  uploadingText: string;
  required?: boolean;
}

const ImageContainer: React.FC<ImageContainerProps> = ({
  label,
  imageData,
  isUploading,
  onCameraPress,
  onRemovePhoto,
  uploadingText,
  required = false,
}) => {
  return (
    <View style={styles.container}>
      {!imageData ? (
        <View style={styles.compactSectionHeader}>
          <Text size="base" weight="600" color="secondary">
            {label}
            {required && <Text style={styles.asterisk}> *</Text>}
          </Text>
          <TouchableOpacity
            onPress={onCameraPress}
            style={styles.minimalistCameraButton}>
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
          {onRemovePhoto && (
            <TouchableOpacity
              onPress={onRemovePhoto}
              style={styles.crossButton}>
              <Icon name="close" size={16} color={FBColors.white} />
            </TouchableOpacity>
          )}
        </>
      )}
      {isUploading && (
        <FullScreenLoader showLoader={true} loaderText={uploadingText} />
      )}
    </View>
  );
};

export default ImageContainer;

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
