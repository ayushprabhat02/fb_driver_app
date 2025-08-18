// dependencies
import {View, ScrollView, Pressable} from 'react-native';
import React, {useEffect} from 'react';
import {s} from 'react-native-size-matters';

// components
import {Divider, Text} from '@/components';
import Genset from '@/assets/assets/genset.svg';
import Tank from '@/assets/assets/tank.svg';
import Dot from '@/assets/assets/dot.svg';
import Others from '@/assets/assets/others.svg';

//services
import {AssetService} from '@/services';

//store
import {assetStore} from '@/globalStore';

// imports
import {FBBackground} from '@/types/styles';

const AssetTypeTabs: React.FC = () => {
  const fetchedAssetTypes = assetStore.use.assetTypes();
  const selectedAssetType = assetStore.use.selectedAssetType();

  useEffect(() => {
    AssetService.fetchAssetTypes({
      limit: 100,
      offset: 0,
    }).then(assetTypes => {
      assetStore.setState(state => ({
        ...state,
        selectedAssetType: assetTypes[0],
      }));
    });
  }, []);

  return (
    <ScrollView
      style={{marginTop: 16}}
      horizontal={true}
      contentContainerStyle={{columnGap: 16}}
      showsHorizontalScrollIndicator={false}>
      {fetchedAssetTypes.length
        ? fetchedAssetTypes.map(assetType => (
            <Pressable
              onPress={() => {
                assetStore.setState(state => ({
                  ...state,
                  selectedAssetType: assetType,
                }));
              }}
              key={assetType?.id}
              style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={{alignItems: 'center'}}>
                <View
                  style={{
                    backgroundColor:
                      selectedAssetType?.id === assetType?.id
                        ? FBBackground.complementary
                        : FBBackground.disabled,
                    height: 48,
                    width: 48,
                    borderRadius: 100,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {assetType?.slug === 'vehicle' ? (
                    <Others width={24} height={24} />
                  ) : assetType?.slug === 'genset' ? (
                    <Genset width={24} height={24} />
                  ) : assetType?.slug === 'tank' ? (
                    <Tank width={24} height={24} />
                  ) : (
                    <Dot width={24} height={24} />
                  )}
                </View>
                <Divider />
                <Text size="sm" style={{textTransform: 'capitalize'}}>
                  {assetType?.description}
                </Text>
              </View>
              <View style={{width: s(14)}} />
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
};

export default AssetTypeTabs;
