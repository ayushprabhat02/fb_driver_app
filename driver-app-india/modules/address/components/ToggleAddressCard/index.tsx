import {Switch, View} from 'react-native';
import React, {useState} from 'react';
import {ms} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
//components
import {CardElevated, Text} from '@/components';
//styles
import {FBBackground, FBColors} from '@/types/styles';
//service
import {AddressService} from '@/services';

type Props = {
  addressDetails: any;
  callbackOnToggle: () => void;
};

const ToggleAddressCard: React.FC<Props> = ({
  addressDetails,
  callbackOnToggle,
}) => {
  const [isActive, setIsActive] = useState(addressDetails.is_active);

  /*function to toggle address activation and then rerender list or fetch all addresses again */
  const toggleSwitch = async () => {
    setIsActive(!isActive);

    try {
      await AddressService.toggleAddressActivation({
        orgAddressId: addressDetails.id,
        is_Active: !isActive,
      });
      callbackOnToggle();
    } catch (error) {
      setIsActive(addressDetails.is_active);
      console.error('Failed to toggle address activation', error);
    }
  };

  return (
    <CardElevated
      cardStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 150,
        marginBottom: 15,
        backgroundColor: isActive ? FBColors.white : FBBackground.primary,
      }}>
      <Icon name="home-work" color={FBColors.primary} size={ms(40)} />
      <View style={{flexDirection: 'column', width: '60%'}}>
        <Text weight="bold" style={{marginVertical: 2}} lines={1} ending="tail">
          {addressDetails.address_type}
        </Text>
        <Text size="sm" style={{marginVertical: 2}} lines={1} ending="tail">
          {addressDetails.address_line1}
        </Text>
        <Text size="sm" style={{marginVertical: 2}} lines={1} ending="tail">
          {addressDetails.address_line2}
        </Text>
        <Text size="sm" style={{marginVertical: 2}} lines={1} ending="tail">
          {addressDetails.city?.name} , {addressDetails.state?.name}
        </Text>
        <Text size="sm" style={{marginVertical: 2}} lines={1} ending="tail">
          {addressDetails.country?.name}
        </Text>
      </View>
      <Switch
        trackColor={{false: FBColors.lightGray, true: FBColors.primary}}
        thumbColor={isActive ? FBColors.white : FBColors.white}
        ios_backgroundColor={FBColors.faded}
        onValueChange={toggleSwitch}
        value={isActive}
      />
    </CardElevated>
  );
};

export default ToggleAddressCard;
