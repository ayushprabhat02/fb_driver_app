import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

const TicketSkeleton = () => {
  return (
    <View style={styles.skeletonWrapper}>
      <SkeletonPlaceholder>
        <View style={styles.ticketListContainer}>
          <View style={{width: '50%', height: 10, marginBottom: 5}} />
          <View style={{width: '90%', height: 10, marginBottom: 5}} />
          <View style={{width: '90%', height: 10, marginBottom: 5}} />
          <View style={{width: '90%', height: 10, marginBottom: 5}} />
          <View style={{width: '90%', height: 10, marginBottom: 5}} />
          <View
            style={{width: '30%', height: 10, marginBottom: 5, marginTop: 10}}
          />
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = ScaledSheet.create({
  skeletonWrapper: {
    marginTop: '5@s',
  },
  ticketListContainer: {
    padding: '10@s',
    borderRadius: '10@s',
    borderWidth: 1,
  },
});

export default TicketSkeleton;
