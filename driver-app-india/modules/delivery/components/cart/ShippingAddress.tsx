// dependencies
import {View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// store
import deliveryStore from '../../store';

// components
import {DetailsComponent} from '..';
import {Text, IconButton} from '@/components';
import {StackNavigationProp} from '@react-navigation/stack';
import {ProtectedStackParamList} from '@/navigator';

// types
import {FBColors} from '@/types/styles';

// todo: add later after discussion with product team
// const AddAdressNote: React.FC = () => (
//   <>
//     <TextButton
//       style={{marginTop: 20}}
//       textSize="sm"
//       underline
//       textColor="primary"
//       onPress={() => {}}>
//       Add Address Note
//     </TextButton>
//   </>
// );

const ShippingAddress: React.FC = () => {
  const selectedShippingAddress = deliveryStore.use.selectedShippingAddress();
  const navigation =
    useNavigation<StackNavigationProp<ProtectedStackParamList>>();

  const navigateToSelectAddress = () => navigation.navigate('select-address');

  return (
    <>
      <DetailsComponent
        showAddBtn={selectedShippingAddress ? true : false}
        title="Shipping Address"
        cardStyle={{marginTop: 10}}
        onPress={navigateToSelectAddress}>
        {selectedShippingAddress ? (
          <View>
            <Text weight="600" size="sm">
              {selectedShippingAddress?.address_line1}
            </Text>

            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              {/* <AddAdressNote /> // todo: add later after discussion with product team
               */}
            </View>
          </View>
        ) : (
          <View
            style={{
              height: 80,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <IconButton
              onPress={navigateToSelectAddress}
              variant="outlined"
              style={{borderRadius: 100, width: '65%'}}>
              <IconButton.Icon>
                <Icon name="plus" size={20} color={FBColors.primary} />
              </IconButton.Icon>
              <IconButton.Text>Add new address</IconButton.Text>
            </IconButton>
          </View>
        )}
      </DetailsComponent>
    </>
  );
};

export default ShippingAddress;
