import React from 'react';
import {View, Platform} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import StatsCard from './StatsCard';

// styles & types
import {FBColorPalette} from '@/types/styles';
import {DeliveryStat} from '@/modules/home/types';
import {Divider, Text} from '@/components';

interface StatsCardGridProps {
  data: DeliveryStat[];
}

const StatsCardGrid: React.FC<StatsCardGridProps> = ({data}) => {
  const getStatsCardStyle = (index: number) => {
    return index % 2 === 0 ? styles.darkCard : styles.lightCard;
  };

  return (
    <View style={{paddingHorizontal: 10}}>
      {/* <Text size="3xl" letterSpacing="widest" weight="400">
        Your Statistics
      </Text> */}
      {/* <Divider height={20} /> */}
      {/* <View style={styles.cardGrid}>
        {data.map((stat, index) => (
          <StatsCard
            key={index}
            color={index % 2 === 0 ? 'white' : 'neutral'}
            title={stat.key}
            description={`${stat.value}`}
            cardStyle={getStatsCardStyle(index)} // Shorten type casting
          />
        ))}
      </View> */}
    </View>
  );
};

const styles = ScaledSheet.create({
  cardGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20@ms',
  },
  darkCard: {
    backgroundColor: FBColorPalette.secondary,
    color: FBColorPalette.white,
    padding: 0,
  },
  lightCard: {
    backgroundColor: FBColorPalette.lightGreen,
    color: FBColorPalette.secondary,
    borderWidth: 1,
    borderColor: FBColorPalette.complementary,
    padding: 0,
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
});

export default StatsCardGrid;
