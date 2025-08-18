import React from 'react';
import { Dimensions, Pressable, View, StyleSheet } from 'react-native';
import { X, WarningOctagon } from 'phosphor-react-native';
import { Text } from '@/components';
import { FBColors } from '@/types/styles';

const OverDueMessage: React.FC<{ closeModal: () => void; message: string }> = ({ closeModal, message }) => {
  return (
    <View>
      <View style={styles.content}>
        <Pressable style={styles.closeButton} onPress={closeModal}>
          <X size={20} color={FBColors.mediumGray} />
        </Pressable>
        <View>
          <WarningOctagon size={48} color={FBColors.amber} weight="fill" />
        </View>
        <View>
        <Text weight='bold' color='amber'>Warning!</Text>
        <Text weight='bold' color='amber'>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: FBColors.white,
    padding: 24,
    borderRadius: 16,
    width: Dimensions.get('window').width * 0.85,
    alignItems: 'center',
    elevation: 5,
    shadowColor: FBColors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    gap: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
});

export default OverDueMessage;