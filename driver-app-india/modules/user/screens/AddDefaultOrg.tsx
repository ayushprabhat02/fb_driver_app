// dependencies
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import React, {useRef} from 'react';

// components
import {HeaderAvoidingContainer, NewBottomSheet, Text} from '@/components';
import AddDefaultOrgForm from '../components/AddDefaultOrgForm';

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
          <AddDefaultOrgForm closeBottomSheet={closeBottomSheet} />
        </BottomSheetView>
      </NewBottomSheet>
    </HeaderAvoidingContainer>
  );
};

export default AddDefaultOrg;
