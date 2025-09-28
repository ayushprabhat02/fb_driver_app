// todo: need discussion on flow. !DO NOT DELETE COMMENTED CODE
import {StyleSheet, View, TextInput, Keyboard} from 'react-native';
import React from 'react';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod'; // Import zodResolver
import Toast from 'react-native-toast-message';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useNavigation} from '@react-navigation/native';

// services
// import {AssetService} from '@/services'; // Asset module deleted
import {getActiveDelOrgUserId} from '@/utils/localStorage';

// store
import {deliveryStore} from '@/globalStore';
// import {assetStore} from '@/globalStore'; // Asset module deleted

// components
import {Button, Divider, Text} from '@/components';
// import {AssetTypeTabs} from '@/modules/assets/delivery/components'; // Asset module deleted

// styles and types
import {FBBorders, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';

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

const AddressFormBottomSheet: React.FC = () => {
  const navigation = useNavigation();

  // const selectedAssetType = assetStore.use.selectedAssetType(); // Asset module deleted
  const selectedAssetType = null; // Mock for deleted asset module
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDeliveryDetails();

  // const stopLoader = assetStore.use.stopLoader(); // Asset module deleted
  // const startLoader = assetStore.use.startLoader(); // Asset module deleted
  // const loaders = assetStore.use.loaders(); // Asset module deleted
  const stopLoader = () => {}; // Mock for deleted asset module
  const startLoader = () => {}; // Mock for deleted asset module
  const loaders = {addAsset: false}; // Mock for deleted asset module

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const proceedToCheckout = () => {
    navigation.navigate('delivery', {screen: 'delivery-checkout'});
  };

  const saveAndAddMore = async (data: FormData) => {
    // startLoader('addAsset'); // Asset module deleted

    Keyboard.dismiss();
    // await AssetService.addCustomerAsset({ // Asset module deleted
    //   asset_type_id: selectedAssetType?.id,
    //   capacity: data.assetCapacity,
    //   description: data.identificationNo,
    //   slug: data.identificationNo,
    //   name: data.assetName,
    //   color: '',
    //   is_active: true,
    //   organization_user_id: getActiveDelOrgUserId() as string,
    //   make: '',
    //   modal: '',
    //   registration_number: data.identificationNo,
    //   state_id: '56e84cb7-d4e7-435e-82dc-2eee6cc7e186',
    // })
    //   .then(() => {
    //     reset();
    //     Toast.show({
    //       type: 'success',
    //       text1: 'Asset added successfully',
    //     });

    //     startLoader('fetchAssets');

    //     AssetService.getAllCustomerAssets({
    //       organization_user_id: getActiveDelOrgUserId(),
    //       search_key: '%%',
    //     }).then(assets => {
    //       assetStore.setState(state => ({
    //         ...state,
    //         currentAssetsInView: assets,
    //       }));

    //       deliveryStore.setState(state => ({
    //         ...state,
    //         selectedAssetsForDeliveryDetails: assets,
    //       }));
    //     });
    //   })
    //   .catch(err => {
    //     Toast.show({
    //       type: 'error',
    //       text1: 'Failed to add asset. Please try again.',
    //     });
    //     throw new Error(err);
    //   })
    //   .finally(() => {
    //     stopLoader('fetchAssets');
    //     stopLoader('addAsset');
    //   });

    Toast.show({
      type: 'info',
      text1: 'Asset features unavailable',
    });
  };

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={100}
      style={{flex: 1}}
      contentContainerStyle={{paddingBottom: 10}}
      showsVerticalScrollIndicator={false}>
      <FormHeading />
      <Divider />
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          <View>
            <Text color="steelBlue" size="sm">
              Select type of asset
              <Text color="error" size="sm">
                *
              </Text>
            </Text>
            <View>
              {/* <AssetTypeTabs /> */} {/* Asset module deleted */}
              <Text style={{padding: 10, textAlign: 'center'}}>Asset type selection unavailable</Text>
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
                <TextInput
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
                      borderColor: errors?.assetName
                        ? FBBorders.error
                        : FBBorders.secondary,
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
                <TextInput
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
              Identification No.
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
                <TextInput
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
                      borderColor: errors?.identificationNo
                        ? FBBorders.error
                        : FBBorders.secondary,
                    },
                  ]}
                />
              )}
              name="identificationNo"
            />
          </View>
          <Divider height={16} />
          <View>
            <Button
              onPress={handleSubmit(saveAndAddMore)}
              variant="solid"
              loading={loaders.addAsset}>
              {/* Save and Add more */}
              Add Asset
            </Button>
            {selectedAssetsForDelivery?.length ? (
              <>
                <Divider />
                <Button variant="solid" onPress={proceedToCheckout}>
                  Checkout
                </Button>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
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
        Adding assets to your FuelBuddy business profile is essential for
        efficient order placement.
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
