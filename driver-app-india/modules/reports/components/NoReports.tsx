// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {ArrowRight} from 'phosphor-react-native';

// components
import {Divider, IconButton, Text} from '@/components';
import NoStatsPoster from '@/assets/home/no-stats.svg';

// styles and types
import {FBBackground, FBColors} from '@/types/styles';

type NoStatsProps = {
  onOrderNow: () => void;
  noStatsText1?: string;
  noStatsText2?: string;
  btnText?: string;
};

const NoReports: React.FC<NoStatsProps> = ({
  onOrderNow,
  noStatsText1 = 'No reports exist',
  noStatsText2 = 'for this date range',
  btnText = 'Order Now',
}) => {
  return (
    <View style={{paddingHorizontal: 0}}>
      <View style={styles.noStatsContainer}>
        <NoStatsPoster />
        <Divider height={40} />
        <View>
          <Text size="xl" weight="600" style={{textAlign: 'center'}}>
            {noStatsText1}
          </Text>
          <Text size="xl" weight="600" style={{textAlign: 'center'}}>
            {noStatsText2}
          </Text>
        </View>
        <Divider height={40} />
        <IconButton
          onPress={onOrderNow}
          variant="solid"
          style={{width: 220, height: 40}}>
          <IconButton.Text>{btnText}</IconButton.Text>
          <IconButton.Icon>
            <ArrowRight color={FBColors.white} size={16} />
          </IconButton.Icon>
        </IconButton>
      </View>
    </View>
  );
};

export default NoReports;

const styles = StyleSheet.create({
  noStatsContainer: {
    alignItems: 'center',
    backgroundColor: FBBackground.primary,
    borderRadius: 32,
    paddingVertical: 20,
    // paddingTop: 20,
    // paddingBottom: 20,
    // height: 520,
  },
});
