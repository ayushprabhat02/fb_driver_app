// dependencies
import {View} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Feather';

// components
import DetailsComponent from '../DetailsComponent';
import {IconButton, Text} from '@/components';

// store
import {deliveryStore} from '@/globalStore';

// styles
import {FBColors} from '@/types/styles';

type Props = {
  onPress: () => void;
};

const AssetSelection: React.FC<Props> = ({onPress}) => {
  return (
    <DetailsComponent
      showAddBtn
      title="Assets"
      cardStyle={{marginTop: 10}}
      onPress={onPress}>
      <View>
        <SelectedAsset onPress={onPress} />
      </View>
    </DetailsComponent>
  );
};

type SelectedAssetProps = {
  onPress: () => void;
};

const SelectedAsset: React.FC<SelectedAssetProps> = ({onPress}) => {
  const selectedAssetsForDeliveryDetails =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  return (
    <>
      {selectedAssetsForDeliveryDetails.length ? (
        <View
          style={{
            flexDirection: 'row',
          }}>
          <Text size="sm" weight="600">
            {`${selectedAssetsForDeliveryDetails[0]?.name}`}
          </Text>
          <Text
            color="primary"
            style={{textDecorationLine: 'underline'}}
            size="sm">
            {selectedAssetsForDeliveryDetails.length > 1
              ? ` + ${selectedAssetsForDeliveryDetails?.length - 1} more`
              : ''}
          </Text>
        </View>
      ) : (
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <IconButton
            variant="outlined"
            style={{width: '50%'}}
            onPress={onPress}>
            <IconButton.Icon>
              <Icon name="plus" size={20} color={FBColors.primary} />
            </IconButton.Icon>
            <IconButton.Text>Add Assets</IconButton.Text>
          </IconButton>
        </View>
      )}
    </>
  );
};

export default AssetSelection;
