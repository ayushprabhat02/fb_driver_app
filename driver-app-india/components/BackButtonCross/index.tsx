// dependencies
import React, {useEffect} from 'react';
import Icon from 'react-native-vector-icons/Feather';
import {BackHandler, Pressable} from 'react-native';

// types
import {Colors, FBColors} from '@/types/styles';

interface ButtonProps {
  onPress: () => void;
  iconColor?: Colors;
  styles?: any;
}

const BackButtonCross: React.FC<ButtonProps> = ({
  onPress,
  iconColor = 'neutral',
  styles,
}) => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onPress();
        return true; // Prevent default behavior
      },
    );

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      onPress={e => {
        e.preventDefault();
        onPress();
      }}
      style={[styles, {paddingLeft: 16}]}>
      <Icon name="x" color={FBColors[iconColor]} size={20} />
    </Pressable>
  );
};

export default BackButtonCross;
