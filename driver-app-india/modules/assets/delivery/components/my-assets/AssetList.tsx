// dependencies
import {View, FlatList} from 'react-native';
import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

// components
import AssetCard from './AssetCard';
import {Divider, Text} from '@/components';

// store
import assetStore from '../../../store';

const loaderCount = Array.from({length: 6}, (_, index) => index); // number of loaders. depends on screen size

const AssetList: React.FC = () => {
  const deliveryAssets = assetStore.use.currentAssetsInView();
  const loaders = assetStore.use.loaders();

  return (
    <View style={{flex: 1}}>
      {!loaders.fetchAssets ? (
        deliveryAssets.length ? (
          <FlatList
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 16}}
            data={deliveryAssets}
            renderItem={({index}) => {
              return <AssetCard assetDetails={deliveryAssets[index]} />;
            }}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={Divider}
          />
        ) : (
          <Text>No assets found</Text>
        )
      ) : (
        <>
          {loaderCount.map(item => {
            return (
              <React.Fragment key={item}>
                <SkeletonPlaceholder>
                  <SkeletonPlaceholder.Item
                    height={140}
                    width={'100%'}
                    borderRadius={10}
                  />
                </SkeletonPlaceholder>
                <Divider height={24} />
              </React.Fragment>
            );
          })}
        </>
      )}
    </View>
  );
};

export default AssetList;
