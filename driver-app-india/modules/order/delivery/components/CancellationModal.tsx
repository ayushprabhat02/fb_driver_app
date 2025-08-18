import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';

// components
import {Button, Divider, FullScreenLoader, Text} from '@/components';
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';
import Toast from 'react-native-toast-message';

//imports
import CancellationReasonList from './CancellationReasonList';
import {orderStore} from '@/globalStore';

interface CancellationModalProps {
  comment: string;
  onChangeComment: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  comment,
  onChangeComment,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [showCancelReasons, setShowCancelReasons] = useState<boolean>(false);
  const [loadingCancel, setLoadingCancel] = useState<boolean>(false);
  const cancellationReason = orderStore.use.cancellationReason();

  const selectedReason = orderStore.use.cancellationReason();

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a reason',
      });
      return;
    }

    setLoadingCancel(true);
    try {
      await onSubmit(); // Wait for the submission to complete
    } catch (error) {
      console.error('Cancellation error:', error);
    } finally {
      setLoadingCancel(false); // Hide loader once the operation is complete
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.modalContent}>
          <Text weight="bold">Please select a reason</Text>
          <Divider height={10} />
          <Pressable
            disabled={showCancelReasons ? true : false}
            onPress={() => {
              setShowCancelReasons(true);
            }}
            style={[
              styles.textInput,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}>
            <Text
              style={{flex: 1}}
              lines={1}
              color={showCancelReasons ? 'disabledInputText' : 'neutral'}>
              {cancellationReason?.reason}
            </Text>
            <Icon name="arrow-drop-down" size={24} color={FBColors.steelBlue} />
          </Pressable>

          <Divider height={10} />
          <Text weight="bold">Cancellation Comment</Text>
          <Divider height={10} />
          <TextInput
            style={[styles.textArea, {fontSize: 12}]}
            textAlignVertical="top"
            placeholderTextColor={FBColors.steelBlue}
            multiline
            numberOfLines={3}
            placeholder="Additional Comments for cancellation"
            value={comment}
            onChangeText={onChangeComment}
          />
          <Divider height={20} />
          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              onPress={onCancel}
              style={{width: '45%', borderColor: FBBorders.error, height: 40}}>
              <Text color="error">Close</Text>
            </Button>
            <Button
              variant="solid"
              loading={loading}
              onPress={handleCancelOrder}
              style={{
                width: '45%',
                backgroundColor: FBBorders.error,
                height: 40,
              }}>
              Cancel Order
            </Button>
          </View>
        </View>
        <Modal
          onBackdropPress={() => {
            setShowCancelReasons(false);
          }}
          isVisible={showCancelReasons}
          backdropTransitionOutTiming={0}
          backdropTransitionInTiming={1000}
          backdropOpacity={0.5}
          animationIn="slideInUp"
          animationOut="slideOutDown">
          <View>
            <CancellationReasonList
              closeList={() => {
                setShowCancelReasons(false);
              }}
            />
          </View>
        </Modal>
        <FullScreenLoader
          showLoader={loadingCancel}
          loaderText="Cancelling Order..."
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = ScaledSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: FBBackground.white,
    padding: '20@s',
    borderRadius: '10@s',
    alignSelf: 'center',
    shadowColor: FBColorPalette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  textArea: {
    borderColor: FBBorders.input,
    borderWidth: 1,
    padding: '10@s',
    borderRadius: '5@s',
    height: '60@s',
    color: FBColorPalette.black,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  textInput: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    height: 36,
    backgroundColor: FBBackground.input,
    borderRadius: 6,
    paddingVertical: 0,
    paddingLeft: 10,
    color: FBColors.steelBlue,
  },
});

export default CancellationModal;
