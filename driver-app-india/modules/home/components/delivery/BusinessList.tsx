// dependencies
import {FlatList, StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text, TextButton} from '@/components';

// types
import {FBBorders} from '@/types/styles';
import {
  FetchAllOrgUsersByTypeQuery,
  Organization_User,
} from '@/generated/graphql';
import {BusinessCard} from '@/modules/business/components';

interface Props {
  deliveryBusinessOrgs: FetchAllOrgUsersByTypeQuery['organization_user'];
  switchToOrg: (
    orgUser:
      | Organization_User
      | FetchAllOrgUsersByTypeQuery['organization_user'][0],
  ) => void;
  switchToBusiness: () => void;
  closeBottomSheet: () => void;
}

const BusinessList: React.FC<Props> = ({
  deliveryBusinessOrgs,
  switchToOrg,
  switchToBusiness,
  closeBottomSheet,
}) => {
  return (
    <>
      <View style={styles.bottomSheetContainer}>
        <Text size="lg" weight="600">
          Select Profile
        </Text>
        <TextButton onPress={switchToBusiness} underline>
          Create new profile
        </TextButton>
      </View>

      <View style={{marginTop: 8, flex: 1}}>
        <FlatList
          contentContainerStyle={{paddingBottom: 20}}
          showsVerticalScrollIndicator={false}
          data={deliveryBusinessOrgs}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={Divider}
          renderItem={({item}) => (
            <BusinessCard
              orgUser={item}
              switchToOrg={switchToOrg}
              closeBottomSheet={closeBottomSheet}
            />
          )}
        />
      </View>
    </>
  );
};

export default BusinessList;

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.secondary,
  },
});
