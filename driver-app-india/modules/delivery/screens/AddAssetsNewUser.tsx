// dependencies
import React from 'react';

// components
import {Divider, HeaderAvoidingContainer} from '@/components';
import {AddAssetFormNewUser, AssetsAdded} from '../components/addasset';

// store
import {deliveryStore} from '@/globalStore';

const SelectAsset: React.FC = () => {
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  return (
    <HeaderAvoidingContainer paddingHorizontal={24}>
      {selectedAssetsForDelivery?.length ? <AssetsAdded /> : null}
      <Divider />
      <AddAssetFormNewUser />
    </HeaderAvoidingContainer>
  );
};

export default SelectAsset;
