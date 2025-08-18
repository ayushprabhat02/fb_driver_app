// dependencies
import {View} from 'react-native';
import React, {useEffect} from 'react';
import {X} from 'phosphor-react-native';
import {useNavigation} from '@react-navigation/native';

// components
import {Divider, HeaderAvoidingContainer, Text} from '@/components';
import {FBBackground} from '@/types/styles';

const IciciFailure: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.goBack();
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HeaderAvoidingContainer>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            backgroundColor: FBBackground.error,
            height: 120,
            width: 120,
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <X size={80} color={'#fff'} weight="bold" />
        </View>
        <Divider />
        <View>
          <Text size="2xl" style={{textAlign: 'center'}}>
            Payment Failed
          </Text>
          <Text size="sm" style={{textAlign: 'center'}}>
            Your payment was unsuccessful. Please try again.
          </Text>
        </View>
      </View>
    </HeaderAvoidingContainer>
  );
};

export default IciciFailure;
