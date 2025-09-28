//dependencies
import {
  View,
  //  TextInput, //todo: add later
  FlatList,
} from 'react-native';
import React, {memo, useCallback} from 'react';
// import Icon from 'react-native-vector-icons/Feather'; //todo: add later
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {ScaledSheet, s, vs} from 'react-native-size-matters';

// components
import {
  Divider,
  Text,
  // Button,//todo: add later
  TextButton,
} from '@/components';

// store
import {deliveryStore} from '@/globalStore';
// import {assetStore} from '@/globalStore'; // Asset module deleted

// styles
import {FBBackground, FBBorders, FBColors, FontSizeEnum} from '@/types/styles';
// import {commonInputStyles} from '@/styles';

// types & utils
import {containsAllValues} from '@/utils/general';
import {CustomerAssetQuery} from '@/generated/graphql';

type SelectAssetsProps = {
  onButtonPress: (state: boolean) => void;
};
const SelectAssets: React.FC<SelectAssetsProps> = () => {
  return (
    <View style={{height: '100%'}}>
      <View>
        <Text size="lg" weight="500">
          Selected Assets
        </Text>
      </View>
      <Divider height={16} />
      {/* <SearchAssets onAddAssetButtonPress={state => onButtonPress(state)} /> */}
      <View style={{height: '60%'}}>
        <AssetList />
      </View>
    </View>
  );
};

// todo: add later
/**
 * Search bar to search for assets
 */
// type SearchAssetsProp = {
//   onAddAssetButtonPress: (state: boolean) => void;
// };
// const SearchAssets: React.FC<SearchAssetsProp> = ({onAddAssetButtonPress}) => {
//   return (
//     <View
//       style={{
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingTop: s(20),
//       }}>
//       <View style={styles.searchbar}>
//         <Icon name="search" size={20} color={FBColors.lightGray} />
//         <TextInput
//           style={[commonInputStyles, styles.inputStyles]}
//           placeholder="Find something"
//         />
//       </View>
//       <Button
//         variant="outlined"
//         onPress={() => {
//           onAddAssetButtonPress(true);
//         }}
//         style={styles.addAssetsBtn}>
//         <Text color="primary" size="sm">
//           Add Assets
//         </Text>
//       </Button>
//     </View>
//   );
// };

/**
 * List of all the assets currently in view
 * Only active assets are displayed
 * used to select assets on the delivery cart page
 */
const AssetList: React.FC = () => {
  // const assetsList = assetStore.use // Asset module deleted
  //   .allCustomerAssets()
  //   .filter(asset => asset.is_active);
  const assetsList = []; // Mock for deleted asset module
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  const setSelectedAssets = useCallback(
    (asset: CustomerAssetQuery['customer_asset'][0]) => {
      const existingAssets = [...selectedAssetsForDelivery];
      const existingAssetIds = existingAssets.map(item => item.id);

      if (existingAssetIds.includes(asset?.id)) {
        const assets = existingAssets.filter(existingAsset => {
          return existingAsset?.id !== asset.id;
        });
        deliveryStore.setState(state => ({
          ...state,
          selectedAssetsForDeliveryDetails: [...assets],
        }));
      } else {
        existingAssets.push(asset);
        deliveryStore.setState(state => ({
          ...state,
          selectedAssetsForDeliveryDetails: [...existingAssets],
        }));
      }
    },
    [selectedAssetsForDelivery],
  );

  return (
    <View style={{height: '100%'}}>
      <SelectUnselectAllAssets
        assetsList={assetsList}
        selectedAssetsForDelivery={selectedAssetsForDelivery}
      />
      <FlatList
        data={assetsList.filter(asset => asset?.is_active)}
        windowSize={10}
        renderItem={({item}) => (
          <AssetSelectionCard asset={item} onSelect={setSelectedAssets} />
        )}
        keyExtractor={item => item.id}
        style={{
          marginTop: s(12),
          flexGrow: 1,
        }}
        contentContainerStyle={{
          rowGap: s(16),
        }}
        initialNumToRender={7}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

/**
 * Select/Unselect all assets button
 * used to select all assets in view on the delivery cart page
 */
type SelectUnselectAllAssetsProps = {
  assetsList: CustomerAssetQuery['customer_asset'];
  selectedAssetsForDelivery: CustomerAssetQuery['customer_asset'];
};

const SelectUnselectAllAssets: React.FC<SelectUnselectAllAssetsProps> = ({
  assetsList,
  selectedAssetsForDelivery,
}) => {
  const selectUnselectAll = useCallback(
    (assetList: CustomerAssetQuery['customer_asset']) => {
      const existingAssets = [...selectedAssetsForDelivery];

      if (!containsAllValues(existingAssets, assetList)) {
        deliveryStore.setState(state => ({
          ...state,
          selectedAssetsForDeliveryDetails: [
            ...new Set([...existingAssets, ...assetList]),
          ],
        }));
      } else {
        const newArray = existingAssets.filter(
          item => !assetList.includes(item),
        );

        deliveryStore.setState(state => ({
          ...state,
          selectedAssetsForDeliveryDetails: newArray,
        }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedAssetsForDelivery],
  );

  return (
    <View style={{alignItems: 'flex-end'}}>
      {assetsList.length ? (
        <TextButton
          onPress={() => selectUnselectAll(assetsList)}
          textSize="sm"
          textStyles={{textAlign: 'right'}}
          style={{width: '25%'}}
          underline>
          {containsAllValues(
            selectedAssetsForDelivery.map(asset => asset.id),
            [...new Set(assetsList.map(asset => asset.id))],
          )
            ? 'Unselect'
            : 'Select all'}
        </TextButton>
      ) : null}
    </View>
  );
};

/**
 * Asset Selection Card
 * used to select assets on the delivery cart page
 */
type Asset = {
  asset: CustomerAssetQuery['customer_asset'][0];
  onSelect: (asset: CustomerAssetQuery['customer_asset'][0]) => void;
};

const AssetSelectionCard: React.FC<Asset> = memo(({asset, onSelect}) => {
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  return (
    <View style={styles.assetCardContainer}>
      <View style={{width: s(200)}}>
        <Text size="sm">{asset.description}</Text>
        <View style={{flexDirection: 'row', columnGap: 20}}>
          <Text size="xs" color="lightGray" style={{width: '60%'}}>
            {asset.name}
          </Text>
          <Text size="xs" color="lightGray">
            {asset.capacity}L
          </Text>
        </View>
      </View>
      <BouncyCheckbox
        fillColor={FBColors.primary}
        unfillColor="transparent"
        isChecked={selectedAssetsForDelivery
          .map(item => item.id)
          .includes(asset.id)}
        iconStyle={{borderColor: FBColors.primary}}
        disableBuiltInState
        onPress={() => onSelect(asset)}
      />
    </View>
  );
});

export default SelectAssets;

const styles = ScaledSheet.create({
  inputStyles: {
    borderRadius: 0,
    borderWidth: 0,
    width: '80%',
    paddingLeft: 0,
    fontSize: FontSizeEnum.base,
  },

  searchbar: {
    borderWidth: 1,
    borderColor: FBBorders.primary,
    backgroundColor: FBBackground.primary,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    height: vs(36),
    paddingHorizontal: s(10),
    width: '60%',
    columnGap: s(8),
  },

  addAssetsBtn: {width: s(100), borderRadius: 100, height: vs(36)},

  assetCardContainer: {
    borderWidth: 1,
    borderColor: FBBorders.primary,
    borderRadius: 10,
    padding: s(10),
    paddingRight: s(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
