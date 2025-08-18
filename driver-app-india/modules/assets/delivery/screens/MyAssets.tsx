// dependencies
import React, {useEffect, useRef} from 'react';
import {BottomSheetView, BottomSheetModal} from '@gorhom/bottom-sheet';

// components
import {
  HeaderAvoidingContainer,
  Divider,
  SimpleBottomSheet,
} from '@/components';
import {
  MyAssetsHeading,
  AssetList,
  AssetFormBottomSheet,
} from '../components/my-assets';

//services
import {AssetService} from '@/services';
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// store
import {assetStore} from '@/globalStore';

// types
import {commonBottomSheetView} from '@/styles';

const MyAssets: React.FC = () => {
  const stopLoader = assetStore.use.stopLoader();
  const startLoader = assetStore.use.startLoader();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    // bottomSheetRef.current?.expand();
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  // state
  useEffect(() => {
    startLoader('fetchAssets');

    AssetService.getAllCustomerAssets({
      organization_user_id: getActiveDelOrgUserId(),
      search_key: '%%',
    }).then(assets => {
      assetStore.setState(state => ({
        ...state,
        currentAssetsInView: assets,
      }));

      stopLoader('fetchAssets');
    });
  });

  return (
    <HeaderAvoidingContainer paddingHorizontal={24}>
      {/* heading */}
      <MyAssetsHeading openBottomSheet={openBottomSheet} />

      {/* assets list */}
      <Divider height={16} />
      <AssetList />

      {/* add new asset bottom sheet */}
      <SimpleBottomSheet
        ref={bottomSheetRef}
        closeSheet={closeBottomSheet}
        snapPoints={['90%']}>
        <BottomSheetView style={[commonBottomSheetView, {zIndex: 99}]}>
          <AssetFormBottomSheet closeBottomSheet={closeBottomSheet} />
        </BottomSheetView>
      </SimpleBottomSheet>
    </HeaderAvoidingContainer>
  );
};

export default MyAssets;
