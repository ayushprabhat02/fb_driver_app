// dependencies
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

// components
import {Text, TextButton, SimpleBottomSheet} from '@/components'; // Assuming you have a separate TextButton component
import {TermsConditionsPrivacy} from '@/modules/auth/components';

const TermsAndConditionsButton: React.FC = () => {
  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  // variables
  const snapPoints = React.useMemo(() => ['65%'], []);
  // callbacks
  const openModal = React.useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const closeModal = React.useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  return (
    <View style={styles.tNcContainer}>
      <Text size="xxs" weight="600">
        By continuing you’re accepting the
      </Text>
      <TextButton
        underline
        textSize="xs"
        textColor="primary"
        onPress={() => {
          openModal();
        }}
        style={{marginLeft: 4}}>
        Terms and Conditions
      </TextButton>
      <SimpleBottomSheet
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        closeSheet={closeModal}>
        <TermsConditionsPrivacy />
      </SimpleBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  tNcContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TermsAndConditionsButton;
