// dependencies
import {ActivityIndicator, Pressable, ScrollView, View} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {hasNotch} from 'react-native-device-info';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';

// components
import {Divider, HeaderAvoidingContainer, NewBottomSheet} from '@/components';
import {BrandLogo} from '../components/common';
import {Heading, BusinessAvatar} from '../components/ChooseBusinessDelivery';
import AddBusinessBtnIcon from '@/assets/business/add-business-btn.svg';

// services
import BusinessService from '../services';
import {setActiveDelOrgUserId} from '@/utils/localStorage';

// store
import {
  addressStore,
  assetStore,
  businessStore,
  deliveryStore,
  orderStore,
  walletStore,
} from '@/globalStore';

// types and interfaces
import {
  FetchAllOrgUsersByTypeQuery,
  Organization_User,
} from '@/generated/graphql';
import {commonBottomSheetView} from '@/styles';
import AddDefaultOrgForm from '@/modules/user/components/AddDefaultOrgForm';
import {WalletService} from '@/services';

const ChooseBusinessDelivery: React.FC = () => {
  const navigation = useNavigation();

  const [showIndividual, setShowIndividual] = useState<boolean>(false);

  const deliveryBusinessOrgs = businessStore.use.deliveryBusinessOrgs();
  const deliveryBusinessIndividual =
    businessStore.use.deliveryBusinessIndividual();
  const loaders = businessStore.use.loaders();
  const stopLoader = businessStore.use.stopLoader();

  const resetDeliveryStore = deliveryStore.use.resetDeliveryStore();
  const resetAssetStore = assetStore.use.resetAssetStore();
  const resetAddressStore = addressStore.use.resetAddressStore();
  const resetWalletStore = walletStore.use.resetWalletStore();
  const resetOrderStore = orderStore.use.resetOrderStore();

  // bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  const openBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const switchToOrg = useCallback(
    (
      orgUser:
        | Organization_User
        | FetchAllOrgUsersByTypeQuery['organization_user'][0],
    ) => {
      businessStore.setState(state => ({
        ...state,
        activeDeliveryOrgUser: orgUser,
      }));

      setActiveDelOrgUserId(orgUser.id);
      stopLoader('setActiveDelOrgUser');

      resetDeliveryStore();
      resetAssetStore();
      resetAddressStore();
      resetWalletStore();
      resetOrderStore();

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{name: 'home'}],
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    BusinessService.fetchAllOrgUsersByType({
      organization_user_type: 'DELIVERY',
      limit: 100,
    })
      .then(async response => {
        const individualUserLedger = await WalletService.getUserLedger({
          limit: 10,
          offset: 0,
          where: {
            organization_user_id: {
              _eq: response?.individualUser?.id,
            },
          },
        });

        setShowIndividual(individualUserLedger?.length > 0);

        if (!navigation.canGoBack()) {
          if (!response.businessOrgUsers.length) {
            navigation.replace('create-new-default-business');
          } else if (response.businessOrgUsers.length === 1) {
            switchToOrg(response?.businessOrgUsers[0]);
          }
        }
      })
      .finally(() => {
        stopLoader('fetchBusiness');
      });

    BusinessService.fetchOrganizationSegmentation();
  }, [navigation, openBottomSheet, stopLoader, switchToOrg]);

  return (
    <HeaderAvoidingContainer>
      <View style={{alignItems: 'center', paddingTop: hasNotch() ? 36 : 20}}>
        <BrandLogo />
      </View>
      {loaders.fetchBusiness ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <Divider height={24} />
          <Heading />
          <Divider height={25} />
          <View style={{flex: 1}}>
            {deliveryBusinessOrgs.length >= (navigation.canGoBack() ? 1 : 2) ? (
              <ScrollView
                contentContainerStyle={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}>
                {showIndividual ? (
                  <BusinessAvatar
                    item={
                      deliveryBusinessIndividual as FetchAllOrgUsersByTypeQuery['organization_user'][0]
                    }
                    switchToOrg={switchToOrg}
                  />
                ) : null}

                {deliveryBusinessOrgs.map(item => (
                  <BusinessAvatar
                    key={item.id}
                    item={item}
                    switchToOrg={switchToOrg}
                  />
                ))}
              </ScrollView>
            ) : null}
            <AddBusinessBtn />
          </View>
        </>
      )}

      {/* <SimpleBottomSheet
        ref={bottomSheetModalRef}
        closeSheet={closeBottomSheetModal}
        snapPoints={['90%']}>
        <BottomSheetView style={commonBottomSheetView}>
          <CreateBusinessForm closeBottomSheet={closeBottomSheetModal} />
        </BottomSheetView>
      </SimpleBottomSheet> */}

      {/* add default org */}
      <NewBottomSheet
        ref={bottomSheetRef}
        showCloseBtn={false}
        snapPoints={['70%']}>
        <BottomSheetView style={[commonBottomSheetView]}>
          <AddDefaultOrgForm closeBottomSheet={closeBottomSheet} />
        </BottomSheetView>
      </NewBottomSheet>
    </HeaderAvoidingContainer>
  );
};

const AddBusinessBtn: React.FC = () => {
  const navigation = useNavigation();

  return (
    <Pressable
      style={{alignItems: 'center', paddingBottom: 10}}
      onPress={() => navigation.navigate('create-new-business')}
      // onPress={openBottomSheetModal}
    >
      <AddBusinessBtnIcon />
    </Pressable>
  );
};

export default ChooseBusinessDelivery;
