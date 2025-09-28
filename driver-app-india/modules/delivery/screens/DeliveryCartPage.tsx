// todo: legacy page. keep for reference. to de deleted later
// dependencies
import {SafeAreaView, View} from 'react-native';
import React, {useRef, useCallback, useState, useEffect} from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {ScaledSheet, s} from 'react-native-size-matters';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

// components
import {
  Container,
  GradientPrimary,
  Divider,
  IconButton,
  Text,
  SimpleBottomSheet,
} from '@/components';
import {
  ShippingAddress,
  AssetSelection,
  AddProducts,
  DateTime,
  SelectAssets,
} from '../components/cart';
// import {AssetTypeTabs} from '@/modules/assets/delivery/components'; // Asset module deleted
// import {AddDeliveryAssetForm} from '@/modules/assets/delivery/components'; // Asset module deleted

// store
import {deliveryStore} from '@/globalStore';
// import {assetStore} from '@/globalStore'; // Asset module deleted

// service
// import {AssetService} from '@/services'; // Asset module deleted

// local storage
import {getActiveDelOrgUserId} from '@/utils/localStorage';

//styles
import {commonInputStyles, headerTransparentContainer} from '@/styles';
import {FBColors} from '@/types/styles';
// types
import {DeliveryStackParamList} from '@/navigator/containers/Delivery';
import {FBBorders} from '@/types/styles';
import {CustomerAssetQuery, Order_By} from '@/generated/graphql';

export type Props = StackScreenProps<DeliveryStackParamList, 'delivery-cart'>;

type AssetTypeTabss = 'genset' | 'tank' | 'dot' | 'others';

const DeliveryCart: React.FC<Props> = ({navigation}) => {
  // const allAssets = assetStore.use.allCustomerAssets(); // Asset module deleted
  const allAssets = []; // Mock for deleted asset module
  const selectedAssetsForDelivery =
    deliveryStore.use.selectedAssetsForDelivery();

  const selectedShippingAddress = deliveryStore.use.selectedShippingAddress();
  const selectedDeliveryDate = deliveryStore.use.selectedDate();
  const selectedDeliverySlot = deliveryStore.use.selectedSlot();
  const selectedDeliveryProducts = deliveryStore.use.selectedDeliveryProducts();

  const [addAssetsFormVisible, setAddAssetsFormVisible] = React.useState(false);
  const [selectedTab, setSelectedTab] = useState<AssetTypeTabss>('genset');

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const onCheckout = () => {
    navigation.navigate('delivery-checkout');
  };

  // callbacks
  const openBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  useEffect(() => {
    // AssetService.getAllCustomerAssets({ // Asset module deleted
    //   organization_user_id: getActiveDelOrgUserId(),
    //   search_key: '%%',
    // }).then(response => {
    //   /**
    //    * Here we filter all the fetched assets by asset type for the first time and set it to currentAssetsInView
    //    * This is done to show the assets of the selected tab initially
    //    * If we skip this, no the assets will be shown initially until the user manually selects a tab
    //    * This is done only once when the component mounts
    //    */
    //   assetStore.setState(state => ({
    //     ...state,
    //     currentAssetsInView: response.filter(asset => {
    //       return asset.asset_type?.slug === selectedTab;
    //     }),
    //   }));
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Acts as a listener for the selectedTab state
   * This effect is used to filter the assets based on the selected tab
   */
  useEffect(() => {
    // if (selectedTab) { // Asset module deleted
    //   assetStore.setState(state => ({
    //     ...state,
    //     currentAssetsInView: state.allCustomerAssets.filter(asset => {
    //       return asset.asset_type?.slug === selectedTab;
    //     }),
    //   }));
    // }
  }, [selectedTab]);

  return (
    <GradientPrimary>
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAwareScrollView
          style={styles.containerTop}
          showsVerticalScrollIndicator={false}>
          <Container>
            {/* Shipping Address */}
            <ShippingAddress />

            {/* Asset Selection */}
            {selectedShippingAddress ? (
              <>
                <Divider height={24} />
                <AssetSelection onPress={openBottomSheet} />
              </>
            ) : null}

            {/* Products */}
            {selectedShippingAddress && selectedAssetsForDelivery.length ? (
              <>
                <Divider height={24} />
                <AddProducts />
              </>
            ) : null}

            {/* Date & Time Slot */}
            {selectedShippingAddress && selectedAssetsForDelivery.length ? (
              <>
                <Divider height={24} />
                <DateTime />
              </>
            ) : null}

            {/* Checkout Button */}
            {selectedShippingAddress &&
            selectedAssetsForDelivery.length &&
            selectedDeliveryDate &&
            selectedDeliveryProducts[0].product.qty &&
            selectedDeliverySlot ? (
              <>
                <Divider height={24} />
                <View style={{alignItems: 'center'}}>
                  <IconButton
                    onPress={onCheckout}
                    variant="solid"
                    style={{
                      marginHorizontal: 'auto',
                      width: '80%',
                      height: s(40),
                    }}>
                    <IconButton.Text>Checkout</IconButton.Text>
                    <IconButton.Icon>
                      <Icon name="arrowright" color="white" />
                    </IconButton.Icon>
                  </IconButton>
                </View>
              </>
            ) : null}

            {/* Bottom Sheet for Selecting Assets */}
            <SimpleBottomSheet
              ref={bottomSheetModalRef}
              closeSheet={closeBottomSheet}
              snapPoints={['75%']}
              onDismiss={() => {
                const visibleAssets: CustomerAssetQuery['customer_asset'] = [];

                allAssets.forEach(vehicle => {
                  selectedAssetsForDelivery.forEach(assetId => {
                    if (vehicle.id === assetId) {
                      visibleAssets.push(vehicle);
                    }
                  });
                });

                deliveryStore.setState(state => ({
                  ...state,
                  selectedAssetsForDeliveryDetails: visibleAssets,
                }));
              }}>
              <View style={styles.bottomSheetContainer}>
                <View style={{flexDirection: 'row', position: 'relative'}}>
                  {addAssetsFormVisible && (
                    <MaterialIcon
                      onPress={() => {
                        setAddAssetsFormVisible(false);
                      }}
                      name="arrow-back"
                      size={20}
                      color={FBColors.primary}
                      style={{position: 'absolute', top: 5, left: -10}}
                    />
                  )}
                  <Text
                    size="lg"
                    weight="600"
                    style={{marginLeft: addAssetsFormVisible ? 20 : 0}}>
                    {addAssetsFormVisible ? 'Add new asset' : 'Select Assets'}
                  </Text>
                </View>
                {/* <AssetTypeTabs /> */} {/* Asset module deleted */}
              </View>
              <View style={{paddingHorizontal: s(20)}}>
                {addAssetsFormVisible ? (
                  // <AddDeliveryAssetForm // Asset module deleted
                  //   formContainerStyles={styles.formContainter}
                  //   selectedTab={selectedTab}
                  //   closeModal={() => {
                  //     closeBottomSheet();
                  //     setAddAssetsFormVisible(false);
                  //   }}
                  // />
                  <View style={{padding: 20}}>
                    <Text>Asset features unavailable</Text>
                  </View>
                ) : (
                  <SelectAssets
                    onButtonPress={(state: boolean) => {
                      setAddAssetsFormVisible(state);
                    }}
                  />
                )}
              </View>
            </SimpleBottomSheet>
          </Container>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </GradientPrimary>
  );
};

const styles = ScaledSheet.create({
  bottomSheetContainer: {
    paddingHorizontal: s(20),
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.secondary,
    paddingBottom: s(10),
  },
  contentInput: {
    ...commonInputStyles,
    height: 45,
    marginTop: 6,
  },

  formContainter: {marginTop: '22@s', rowGap: 20},

  containerTop: {
    ...headerTransparentContainer,
  },
});

export default DeliveryCart;
