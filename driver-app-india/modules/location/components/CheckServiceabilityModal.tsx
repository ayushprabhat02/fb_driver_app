// dependencies
import React from 'react';
import {Image, View} from 'react-native';
import {
  // TextButton,
  Text,
  Button,
} from '@/components';

const NonServiceableImage = require('@/assets/map/not-serviceable.png');

type Props = {
  // closeModal: () => void;
  showNearestServiceableZone: () => void;
  // navigation: any;
};

const CheckServiceabilityModal: React.FC<Props> = ({
  // closeModal,
  // navigation,
  showNearestServiceableZone,
}) => {
  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <Image source={NonServiceableImage} alt="not serviceable" />
      <Text
        lines={2}
        style={{
          maxWidth: 200,
          textAlign: 'center',
          marginVertical: 20,
        }}>
        We are currently not delivering at this pincode
      </Text>
      <Button
        variant="solid"
        style={{width: '100%'}}
        onPress={() => showNearestServiceableZone()}>
        Go to nearest deliverable area →
      </Button>
      {/* <TextButton
        textSize="lg"
        onPress={() => {
          closeModal();
          navigation.navigate('address', {screen: 'search-location'});
        }}
        underline
        style={{marginVertical: 20}}>
        Enter location manually
      </TextButton> */}
    </View>
  );
};

export default CheckServiceabilityModal;
