// dependencies
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import React, {useRef} from 'react';
import {View, Text as RNText, StyleSheet} from 'react-native';

// components
import {HeaderAvoidingContainer, NewBottomSheet, Text, Button} from '@/components';

// styles
import {commonBottomSheetView} from '@/styles';

const AddDefaultOrg: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <HeaderAvoidingContainer>
      <Text>AddDefaultOrg</Text>
      <NewBottomSheet
        ref={bottomSheetRef}
        closeSheet={closeBottomSheet}
        index={0}
        snapPoints={['80%']}>
        <BottomSheetView style={[commonBottomSheetView]}>
          <View style={styles.container}>
            <RNText style={styles.title}>Organization Setup</RNText>
            <RNText style={styles.subtitle}>Organization functionality has been simplified</RNText>
            <Button
              variant="solid"
              onPress={closeBottomSheet}
              style={styles.button}>
              Close
            </Button>
          </View>
        </BottomSheetView>
      </NewBottomSheet>
    </HeaderAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '80%',
  },
});

export default AddDefaultOrg;
