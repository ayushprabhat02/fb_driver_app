import {StyleSheet, Switch, View} from 'react-native';
import React, {useState} from 'react';

//components
import {Divider, Text} from '@/components';
import Genset from '@/assets/assets/genset.svg';
import Tank from '@/assets/assets/tank.svg';
import Dot from '@/assets/assets/dot.svg';
import Others from '@/assets/assets/others.svg';

//service
import {AssetService} from '@/services';
import {CustomerAssetQuery, Order_By} from '@/generated/graphql';

//styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {getActiveDelOrgUserId} from '@/utils/localStorage';
import {assetStore} from '@/globalStore';

type Props = {
  assetDetails: CustomerAssetQuery['customer_asset'][0];
};
const AssetCard: React.FC<Props> = ({assetDetails}) => {
  const [isActive, setIsActive] = useState(assetDetails.is_active);

  /*function to toggle asset activation and then rerender list or fetch all assets again */
  const toggleSwitch = async () => {
    setIsActive(!isActive);

    if (assetDetails) {
      try {
        await AssetService.toggleAssetActivation({
          assetId: assetDetails?.id,
          isActive: !isActive,
        });

        // Fetch the updated asset list
        const response = await AssetService.getAllCustomerAssets({
          organization_user_id: getActiveDelOrgUserId(),
          limit: 100,
          search_key: '%%',
        });

        // Update the global state with the new list
        assetStore.setState(state => ({
          ...state,
          currentAssetsInView: response,
        }));
      } catch (error) {
        // Revert the switch state if the API call fails
        setIsActive(assetDetails.is_active);
      }
    }
  };

  const getAssetIcon = (
    assetType: CustomerAssetQuery['customer_asset'][0]['asset_type']['slug'],
  ) => {
    if (assetType === 'genset') {
      return <Genset width={24} height={24} />;
    }

    if (assetType === 'tank') {
      return <Tank width={24} height={24} />;
    }

    if (assetType === 'dot') {
      return <Dot width={24} height={24} />;
    }

    return <Others width={24} height={24} />;
  };

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: isActive ? FBBackground.white : FBBackground.primary,
      }}>
      <View style={{flex: 1}}>
        <View style={styles.iconBackground}>
          {getAssetIcon(assetDetails?.asset_type?.slug)}
        </View>
      </View>
      <View
        style={{
          flexDirection: 'column',
          flex: 4.5,
          paddingLeft: 4,
        }}>
        <Text weight="600" lines={1}>
          {assetDetails.name}
        </Text>
        <Divider />
        <Text lines={1} color="steelBlue">
          {assetDetails.description}
        </Text>
        <Divider height={16} />
        <Text color="primary" weight="600">
          {assetDetails.asset_type?.name}
        </Text>
        <Divider height={16} />
        <Text weight="600" color="steelBlue" lines={1}>
          Total Capacity : {assetDetails.capacity} litres
        </Text>
      </View>
      <View style={{flex: 1, paddingRight: 8}}>
        <Switch
          trackColor={{false: FBColors.lightGray, true: FBColors.primary}}
          thumbColor={isActive ? FBColors.white : FBColors.white}
          ios_backgroundColor={FBColors.faded}
          onValueChange={toggleSwitch}
          value={isActive}
        />
      </View>
    </View>
  );
};

export default AssetCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: FBBorders.disabledInputText,
  },

  iconBackground: {
    backgroundColor: FBBackground.complementary,
    borderRadius: 100,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
