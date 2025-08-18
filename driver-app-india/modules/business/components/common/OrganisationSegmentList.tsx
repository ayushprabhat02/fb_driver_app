// dependencies
import {Dimensions, Pressable, View, FlatList} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {Text} from '@/components';

// types & styles
import {FBBorders, FBColors} from '@/types/styles';
import {FetchOrganizationSegmentationQuery} from '@/generated/graphql';

type Props = {
  selectedBusinessType:
    | FetchOrganizationSegmentationQuery['organization_segmentation'][0]
    | undefined;
  setShowOrganisations: (value: boolean) => void;
  organizationSegments: FetchOrganizationSegmentationQuery['organization_segmentation'];
  setSelectedBusinessType: (
    segment: FetchOrganizationSegmentationQuery['organization_segmentation'][0],
  ) => void;
};

const OrganisationSegmentList: React.FC<Props> = ({
  selectedBusinessType,
  setShowOrganisations,
  organizationSegments,
  setSelectedBusinessType,
}) => {
  return (
    <View style={styles.businessListContainer}>
      <View style={styles.businessListHeadingContainer}>
        <Text color="slate" weight="600">
          Select Business Type
        </Text>
        <Pressable
          onPress={() => {
            setShowOrganisations(false);
          }}>
          <Icon name="close" size={24} color={FBColors.mediumGray} />
        </Pressable>
      </View>

      <FlatList
        data={organizationSegments}
        keyExtractor={item => item.id}
        contentContainerStyle={{backgroundColor: 'white'}}
        renderItem={({item, index}) => (
          <BusinessOrgCard
            item={item}
            index={index}
            organizationSegments={organizationSegments}
            selectedBusinessType={selectedBusinessType}
            setSelectedBusinessType={setSelectedBusinessType}
            setShowOrganisations={setShowOrganisations}
          />
        )}
      />
    </View>
  );
};

interface BusinessOrgCard extends Props {
  index: number;
  item: FetchOrganizationSegmentationQuery['organization_segmentation'][0];
}

const BusinessOrgCard: React.FC<BusinessOrgCard> = ({
  setSelectedBusinessType,
  setShowOrganisations,
  organizationSegments,
  index,
  item,
  selectedBusinessType,
}) => (
  <Pressable
    onPress={() => {
      setSelectedBusinessType(item);
      setTimeout(() => {
        setShowOrganisations(false);
      }, 300);
    }}
    style={[
      styles.businessOrgCard,
      {borderBottomWidth: index === organizationSegments.length - 1 ? 0 : 1},
    ]}>
    <Text size="sm" color="steelBlue" weight="400">
      {item.name}
    </Text>
    {selectedBusinessType?.id === item.id && (
      <Icon name="check-circle" size={24} color={FBColors.primary} />
    )}
  </Pressable>
);

export default OrganisationSegmentList;

const styles = ScaledSheet.create({
  businessListContainer: {
    backgroundColor: 'white',
    height: Dimensions.get('window').height / 1.4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  businessListHeadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },

  businessOrgCard: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: FBBorders.secondary,
  },
});
