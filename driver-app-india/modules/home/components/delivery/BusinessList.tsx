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
// import {BusinessCard} from '@/modules/business/components'; // Business module deleted

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
            <View style={styles.businessCard}>
              <Text weight="600" size="md">
                {item?.organization?.brand || 'Business'}
              </Text>
              <Text size="sm" color="gray" style={{marginTop: 4}}>
                Business features unavailable
              </Text>
            </View>
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
  businessCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 4,
  },
});
