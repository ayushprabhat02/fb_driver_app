import React from 'react';
import {View} from 'react-native';
import {Text as CustomText, Button} from '@/components';
import {s, ScaledSheet} from 'react-native-size-matters';
interface Props {
  heading: string;
  onBackPress: () => void;
}

const Header: React.FC<Props> = ({heading, onBackPress}) => {
  return (
    <View style={styles.header}>
      <Button
        variant="text"
        onPress={() => {
          onBackPress();
        }}
        style={{position: 'absolute', left: s(20)}}>
        go back
      </Button>
      <CustomText size="xl">{heading}</CustomText>
    </View>
  );
};

const styles = ScaledSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@mvs',
  },
});

export default Header;
