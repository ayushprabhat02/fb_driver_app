// depedencies
import {ActivityIndicator, View} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';

// components
import Text from '../Text';

// styles & types
import {FBBackground} from '@/types/styles';

interface Props {
  showLoader: boolean;
  loaderText?: string;
}

const FullScreenLoader: React.FC<Props> = ({
  showLoader,
  loaderText = 'Please wait',
}) => {
  return (
    <Modal
      isVisible={showLoader}
      backdropTransitionOutTiming={0}
      backdropTransitionInTiming={0}
      backdropOpacity={0.8}
      animationIn="fadeIn"
      animationOut="slideOutDown">
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: FBBackground.white,
            borderRadius: 8,
            height: 90,
            width: 350,
            columnGap: 12,
          }}>
          <Text size="lg">{loaderText}</Text>
          <ActivityIndicator />
        </View>
      </View>
    </Modal>
  );
};

export default FullScreenLoader;
