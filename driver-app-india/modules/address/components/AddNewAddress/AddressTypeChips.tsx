// dependencies
import {Pressable, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

// store
import {locationStore} from '@/globalStore';

// types and styles
import {FBBackground, FBBorders} from '@/types/styles';

type AddressType = 'home' | 'work' | 'other';

const addressTypes: AddressType[] = ['home', 'work', 'other'];

const AddressTypeChip: React.FC = () => {
  const addressType = locationStore.use.addressType();

  const changeAddressType = (type: AddressType) => {
    locationStore.setState(state => ({
      ...state,
      addressType: type,
    }));
  };

  return (
    <View>
      <Text size="sm" color="steelBlue" weight="600">
        Location name
      </Text>
      <Divider />
      <View style={{flexDirection: 'row', columnGap: 12}}>
        {addressTypes.map(type => {
          return (
            <Pressable
              onPress={() => changeAddressType(type)}
              key={type}
              style={{
                borderWidth: addressType === type ? 1.5 : 1,
                borderColor:
                  addressType === type
                    ? FBBorders.complementary
                    : FBBorders.secondary,
                backgroundColor:
                  addressType === type
                    ? FBBackground.pastelGreen
                    : FBBackground.white,
                width: 70,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: 10,
              }}>
              <Text
                color={addressType === type ? 'complementary' : 'steelBlue'}
                weight={addressType === type ? '600' : '400'}
                style={{textTransform: 'capitalize'}}>
                {type}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default AddressTypeChip;
