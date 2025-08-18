// dependencies
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {Divider, Text} from '@/components';

// types
import {Colors} from '@/types/styles';

type Props = {
  title: string;
  description: string;
  cardStyle: any;
  color: Colors;
};

const StatsCard: React.FC<Props> = ({title, description, cardStyle, color}) => {
  return (
    <View style={{alignItems: 'center'}}>
      <Text size="xs" color="neutral" weight="600">
        {title}
      </Text>
      <Divider height={5} />

      <View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.textOverlay}>
          <Text size="xl" color={color} weight="600">
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  cardContainer: {
    width: '145@s',
    height: '120@s',
    borderRadius: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  textOverlay: {
    padding: 15,
  },
});

export default StatsCard;
