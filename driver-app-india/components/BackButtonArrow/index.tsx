import {Pressable} from 'react-native';
import React from 'react';
import {ArrowCircleLeft} from 'phosphor-react-native';
import {useNavigation} from '@react-navigation/native';

const DeliveryBackButton: React.FC = () => {
  const navigation = useNavigation();

  return (
    <Pressable
      style={{paddingLeft: 16, paddingTop: 10}}
      onPress={() => {
        navigation.goBack();
      }}>
      <ArrowCircleLeft size={32} weight="regular" />
    </Pressable>
  );
};

export default DeliveryBackButton;
