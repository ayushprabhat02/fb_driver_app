// dependencies
import {Dimensions, Pressable, View, FlatList} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {Text} from '@/components';

// types & styles
import {FBBorders, FBColors} from '@/types/styles';
import {FetchCustomerSegmentationListQuery} from '@/generated/graphql';

type Props = {
  selectedCustomerType:
    | FetchCustomerSegmentationListQuery['customer_segmentation'][0]
    | undefined;
  setShowCustomerSegmentation: (value: boolean) => void;
  customerSegments: FetchCustomerSegmentationListQuery['customer_segmentation'];
  setSelectedCustomerType: (
    segment: FetchCustomerSegmentationListQuery['customer_segmentation'][0],
  ) => void;
};

const OrganisationSegmentList: React.FC<Props> = ({
  selectedCustomerType,
  setShowCustomerSegmentation,
  customerSegments,
  setSelectedCustomerType,
}) => {
  return (
    <View style={styles.businessListContainer}>
      <View style={styles.businessListHeadingContainer}>
        <Text color="slate" weight="600">
          Select Business Type
        </Text>
        <Pressable
          onPress={() => {
            setShowCustomerSegmentation(false);
          }}>
          <Icon name="close" size={24} color={FBColors.mediumGray} />
        </Pressable>
      </View>

      <FlatList
        data={customerSegments}
        keyExtractor={item => item.id}
        contentContainerStyle={{backgroundColor: 'white'}}
        renderItem={({item, index}) => (
          <BusinessOrgCard
            item={item}
            index={index}
            customerSegments={customerSegments}
            selectedCustomerType={selectedCustomerType}
            setSelectedCustomerType={setSelectedCustomerType}
            setShowCustomerSegmentation={setShowCustomerSegmentation}
          />
        )}
      />
    </View>
  );
};

interface BusinessOrgCard extends Props {
  index: number;
  item: FetchCustomerSegmentationListQuery['customer_segmentation'][0];
}

const BusinessOrgCard: React.FC<BusinessOrgCard> = ({
  setSelectedCustomerType,
  setShowCustomerSegmentation,
  customerSegments,
  index,
  item,
  selectedCustomerType,
}) => (
  <Pressable
    onPress={() => {
      setSelectedCustomerType(item);
      setTimeout(() => {
        setShowCustomerSegmentation(false);
      }, 300);
    }}
    style={[
      styles.businessOrgCard,
      {borderBottomWidth: index === customerSegments.length - 1 ? 0 : 1},
    ]}>
    <Text size="sm" color="steelBlue" weight="400">
      {item.name}
    </Text>
    {selectedCustomerType?.id === item.id && (
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
