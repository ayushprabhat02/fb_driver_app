import {StyleSheet, View, ScrollView, Platform} from 'react-native';
import React from 'react';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import Toast from 'react-native-toast-message';

// services
import AssetService from '../../../services';
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// store
import assetStore from '../../../store';

// components
import {Button, Divider, Text} from '@/components';
import AssetTypeTabs from '../AssetTypeTabs';

// styles and types
import {FBBorders, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

interface Props {
  closeBottomSheet: () => void;
}

type FormData = {
  assetName: string;
  assetCapacity: string;
  identificationNo: string;
};

const schema = z.object({
  assetName: z.string(),
  assetCapacity: z.string().regex(/^[1-9][0-9]*$/),
  identificationNo: z.string(),
});

const AddressFormBottomSheet: React.FC<Props> = ({closeBottomSheet}) => {
  const {
    control,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const selectedAssetType = assetStore.use.selectedAssetType();
  const allCustomerAssets = assetStore.use.allCustomerAssets();

  const loader = assetStore.use.loaders();

  const stopLoader = assetStore.use.stopLoader();
  const startLoader = assetStore.use.startLoader();

  const onSubmit = async (data: FormData) => {
    const duplicateAsset = allCustomerAssets.find(asset => {
      return asset.description === data.identificationNo;
    });

    if (duplicateAsset) {
      Toast.show({
        type: 'error',
        text1: 'Asset already exists',
      });

      return;
    }

    startLoader('addAsset');

    await AssetService.addCustomerAsset({
      asset_type_id: selectedAssetType?.id,
      capacity: data.assetCapacity,
      description: data.identificationNo,
      slug: data.identificationNo,
      name: data.assetName,
      color: '',
      is_active: true,
      organization_user_id: getActiveDelOrgUserId() as string,
      make: '',
      modal: '',
      registration_number: data.identificationNo,
      state_id: '56e84cb7-d4e7-435e-82dc-2eee6cc7e186',
    })
      .then(() => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Asset added successfully',
        });
        startLoader('fetchAssets');

        AssetService.getAllCustomerAssets({
          organization_user_id: getActiveDelOrgUserId(),
          search_key: '%%',
        }).then(assets => {
          closeBottomSheet();

          assetStore.setState(state => ({
            ...state,
            currentAssetsInView: assets,
          }));
        });
      })
      .catch(err => {
        Toast.show({
          type: 'error',
          text1: 'Failed to add asset. Please try again.',
        });
        throw new Error(err);
      })
      .finally(() => {
        stopLoader('fetchAssets');
        setTimeout(() => {
          stopLoader('addAsset');
        }, 1200);
      });
  };

  return (
    <View style={{flex: 1}}>
      <FormHeading />
      <Divider />
      <View style={{flex: 1}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 16}}>
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 16}}
            enableOnAndroid={true}
            extraScrollHeight={50}
            keyboardShouldPersistTaps="handled">
            <View>
              <Text color="steelBlue" size="sm">
                Select type of asset
                <Text color="error" size="sm">
                  *
                </Text>
              </Text>
              <View>
                <AssetTypeTabs />
              </View>
            </View>
            <Divider height={16} />
            {/* asset name */}
            <View>
              <Text color="steelBlue" size="sm">
                Asset Name
                <Text color="error" size="sm">
                  *
                </Text>
              </Text>
              <Divider />
              <Controller
                control={control}
                rules={{
                  required: true,
                }}
                render={({field: {onChange, value}}) => (
                  <BottomSheetTextInput
                    placeholder="Enter asset name"
                    placeholderTextColor={FBColors.placeHolderPrimary}
                    onChangeText={onChange}
                    value={value}
                    style={[
                      commonInputStyles,
                      {
                        height: 36,
                        fontSize: 14,
                        color: FBColors.neutral,
                        paddingVertical: 0,
                      },
                    ]}
                  />
                )}
                name="assetName"
              />
            </View>

            {/* asset capacity */}
            <Divider height={16} />
            <View>
              <Text color="steelBlue" size="sm">
                Asset Capacity
                <Text color="error" size="sm">
                  *
                </Text>
              </Text>
              <Divider />
              <Controller
                control={control}
                rules={{
                  required: true,
                }}
                render={({field: {onChange, value}}) => (
                  <BottomSheetTextInput
                    placeholder="Enter asset capacity"
                    placeholderTextColor={FBColors.placeHolderPrimary}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9]/g, ''); // Only allow numbers
                      if (
                        numericValue === '' ||
                        parseInt(numericValue, 10) <= 100000
                      ) {
                        onChange(numericValue);
                      }
                    }}
                    value={value}
                    keyboardType="numeric"
                    style={[
                      commonInputStyles,
                      {
                        height: 36,
                        fontSize: 14,
                        color: FBColors.neutral,
                        paddingVertical: 0,
                        borderColor: errors?.assetCapacity
                          ? FBBorders.error
                          : FBBorders.secondary,
                      },
                    ]}
                  />
                )}
                name="assetCapacity"
              />
            </View>

            {/* indentification number */}
            <Divider height={16} />
            <View>
              <Text color="steelBlue" size="sm">
                Identification No. ( Plate no, Serial no, etc.)
                <Text color="error" size="sm">
                  *
                </Text>
              </Text>
              <Divider />
              <Controller
                control={control}
                rules={{
                  required: true,
                }}
                render={({field: {onChange, value}}) => (
                  <BottomSheetTextInput
                    placeholder="Plate no, Serial no, etc."
                    placeholderTextColor={FBColors.placeHolderPrimary}
                    onChangeText={onChange}
                    value={value}
                    style={[
                      commonInputStyles,
                      {
                        height: 36,
                        fontSize: 14,
                        color: FBColors.neutral,
                        paddingVertical: 0,
                      },
                    ]}
                  />
                )}
                name="identificationNo"
              />
            </View>
            <Divider height={16} />
            <View>
              <Divider height={25} />
              <Button
                variant="solid"
                onPress={handleSubmit(onSubmit)}
                disabled={loader.addAsset}
                loading={loader.addAsset}>
                Save
              </Button>
            </View>
          </KeyboardAwareScrollView>
        </ScrollView>
      </View>
    </View>
  );
};

const FormHeading: React.FC = () => {
  return (
    <View style={styles.heading}>
      <Text size="lg" weight="500">
        Add Assets
      </Text>
      <Divider height={16} />
      <Text size="sm" color="complementary" style={{maxWidth: '90%'}}>
        An asset refers to receiving unit, that facilitates fuel intake and
        storage.
      </Text>
    </View>
  );
};

export default AddressFormBottomSheet;

const styles = StyleSheet.create({
  heading: {
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderColor: FBBorders.secondary,
  },
});
