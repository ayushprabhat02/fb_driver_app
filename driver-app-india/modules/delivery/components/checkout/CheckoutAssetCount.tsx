// dependencies
import {Pressable, StyleSheet, View} from 'react-native';
import React, {useRef} from 'react';
import {GasCan, PencilSimpleLine} from 'phosphor-react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';

// store
import {deliveryStore, orderStore} from '@/globalStore';

// components
import {Divider, SimpleBottomSheet, Text, TextButton} from '@/components';
import {SelectAssets} from '../cart';

// styles
import {FBBorders, FBColors} from '@/types/styles';
import {commonBottomSheetView} from '@/styles';

const AssetCount: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  return (
    <View style={styles.container}>
      <GasCan size={24} />
      <View style={{flex: 1}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text weight="600">Assets Added</Text>
          {/* <Pressable onPress={openBottomSheet}> */}
          {/* <PencilSimpleLine size={20} color={FBColors.complementary} /> */}
          {/* </Pressable> */}
          {!isUpComingOrderVerify && (
            <TextButton
              onPress={openBottomSheet}
              underline
              textSize="sm"
              weight="400"
              style={{marginTop: 0}}>
              Edit
            </TextButton>
          )}
        </View>
        <Divider />
        <View style={{rowGap: 6}}>
          {selectedAssetsForDelivery.length ? (
            <Text weight="400" size="sm" appearance="light">
              {selectedAssetsForDelivery.length > 1
                ? `${selectedAssetsForDelivery[0]?.name} + ${
                    selectedAssetsForDelivery.length - 1
                  } others`
                : `${selectedAssetsForDelivery[0]?.name}`}
            </Text>
          ) : (
            <Text size="xs" color="error" weight="500">
              Please add assets to continue
            </Text>
          )}

          {/* //todo: delete later if not required */}
          {/* {selectedAssetsForDeliveryByType?.map(asset => {
            return (
              <View style={{flexDirection: 'row'}} key={asset.type}>
                <Text
                  weight="400"
                  size="sm"
                  appearance="light"
                  style={{textTransform: 'capitalize', width: 70}}>
                  {asset.type}
                </Text>
                <View style={styles.assetCountContainer}>
                  <Text size="sm" color="complementary" weight="500">
                    {asset.assetList[0]?.description}
                  </Text>
                  <Text size="sm" color="complementary">
                    {asset?.assetList.length > 1
                      ? `+ ${asset?.assetList.length} others`
                      : null}
                  </Text>
                </View>
              </View>
            );
          })} */}
        </View>
      </View>
      <SimpleBottomSheet closeSheet={closeBottomSheet} ref={bottomSheetRef}>
        <BottomSheetView style={commonBottomSheetView}>
          <SelectAssets onButtonPress={() => {}} />
        </BottomSheetView>
      </SimpleBottomSheet>
    </View>
  );
};

export default AssetCount;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 10,
  },

  assetCountContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.complementary,
  },
});
