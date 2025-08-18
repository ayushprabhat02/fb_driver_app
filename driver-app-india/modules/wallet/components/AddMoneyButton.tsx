// dependencies
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

// components
import {IconButton} from '@/components';

// types
import {FBColors} from '@/types/styles';

interface AddMoneyButtonProps {
  onPress: () => void;
}

const AddMoneyButton: React.FC<AddMoneyButtonProps> = ({onPress}) => {
  return (
    <IconButton variant="solid" onPress={onPress}>
      <IconButton.Text>Add Money</IconButton.Text>
      <IconButton.Icon>
        <Icon name="send" color={FBColors.white} size={16} />
      </IconButton.Icon>
    </IconButton>
  );
};

export default AddMoneyButton;
