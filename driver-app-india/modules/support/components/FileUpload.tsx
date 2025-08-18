// todo: r&d needed. improve later
// dependencies
import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
// import RNBlobUtil from 'react-native-blob-util';

// components
import {Text, TextButton} from '@/components';

// types
import {FBColorPalette} from '@/types/styles';

type FileUploadProps = {
  fileData: DocumentPickerResponse | null;
  setFileData: React.Dispatch<
    React.SetStateAction<DocumentPickerResponse | null>
  >;
  setAttachmentData: React.Dispatch<
    React.SetStateAction<DocumentPickerResponse | null>
  >;
};

const FileUpload: React.FC<FileUploadProps> = ({
  fileData,
  setFileData,
  setAttachmentData,
}) => {
  const openDocumentPicker = async () => {
    // try {
    //   const selectedFile = await DocumentPicker.pick({
    //     type: [DocumentPicker.types.images],
    //   });
    //   setFileData(selectedFile[0]);
    //   if (selectedFile[0]) {
    //     const decodedData = await RNBlobUtil.fs
    //       .readFile(selectedFile[0]?.uri, 'base64')
    //       .then(RNBlobUtil.base64.decode);
    //     const blob = await RNBlobUtil.polyfill.Blob.build(decodedData, {
    //       type: selectedFile[0].type,
    //     });
    //     setAttachmentData(blob);
    //   }
    // } catch (E) {
    //   if (DocumentPicker.isCancel(E)) {
    //     console.log('User cancelled without selecting');
    //   } else {
    //     console.error('Error opening document picker', E);
    //   }
    // }
  };

  return (
    <>
      {fileData ? (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Image source={{uri: fileData.uri}} height={20} width={20} />
          <Text style={styles.fileName}>{fileData.name}</Text>
          <Icon
            name="close"
            color="red"
            size={15}
            style={{marginLeft: 10}}
            onPress={() => setFileData(null)}
          />
        </View>
      ) : (
        <TextButton underline onPress={() => openDocumentPicker()}>
          Add Your Attachment
        </TextButton>
      )}
    </>
  );
};

export const styles = StyleSheet.create({
  iconButton: {
    height: 30,
    width: 150,
    padding: 5,
    borderRadius: 5,
    justifyContent: 'space-evenly',
    color: FBColorPalette.complementary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    color: FBColorPalette.complementary,
    fontSize: 12,
    textDecorationLine: 'underline',
    marginLeft: 5,
  },
  uploadText: {
    color: FBColorPalette.complementary,
    fontSize: 12,
  },
});

export default FileUpload;
