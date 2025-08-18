import React from 'react';
import {FlatList, View, StyleSheet} from 'react-native';

// types
// import {CustomerOrderReportQuery} from '@/generated/graphql';
import {
  StatsChart,
  //  StatsCard
} from './index';

interface StatsCardComponentProps {
  data: any;
}

const StatsCardComponent: React.FC<StatsCardComponentProps> = ({data}) => {
  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      ListHeaderComponent={<StatsChart data={data} />}
      renderItem={() => (
        // <View style={styles.cardContainer}>
        //   <StatsCard data={[item]} />
        // </View>
        <View />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
  },
});

export default StatsCardComponent;
