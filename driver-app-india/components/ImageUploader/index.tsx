import React, {useState} from 'react';
import {StyleSheet, Image, Pressable, Text, View, ActivityIndicator} from 'react-native';
import DocumentPicker, {types as DocumentPickerTypes} from 'react-native-document-picker';
import supportService from '@/modules/support/services';

interface Props {
  /**
   * Callback fired once the image is successfully uploaded
   * @param urls.src - Publicly accessible url returned by backend
   * @param urls.storeUrl - Internal storage url (if needed later)
   */
  onUploadComplete?: (urls: {src: string | null; storeUrl: string | null}) => void;
  /** Placeholder label shown when no image is selected */
  placeholder?: string;
  /** Component style overrides */
  style?: object;
}

const ImageUploader: React.FC<Props> = ({
  onUploadComplete,
  placeholder = 'Tap to select image',
  style,
}) => {
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async () => {
    try {
      // Pick a single image
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPickerTypes.images],
        copyTo: 'cachesDirectory',
      });

      // res.fileCopyUri ensures we have access to the file even if original uri becomes inaccessible
      const uri = res.fileCopyUri || res.uri;
      setUploading(true);

      // Convert file uri to blob (works on RN >= 0.63)
      const blob = await (await fetch(uri)).blob();

      const {src, storeUrl} = await supportService.uploadFile({
        fileName: res.name || 'image.jpg',
        contentType: res.type || 'image/jpeg',
        fileData: blob,
      });

      setImageUri(src || uri);
      onUploadComplete?.({src, storeUrl});
    } catch (err) {
      if (DocumentPicker.isCancel(err)) return;
      console.error('Image upload error', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable style={[styles.container, style]} onPress={pickAndUpload}>
      {uploading ? (
        <ActivityIndicator />
      ) : imageUri ? (
        <Image source={{uri: imageUri}} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderWrapper}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#f0f4fa',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#64748b',
  },
});

export default ImageUploader;