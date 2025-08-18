// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {
  // SlidersHorizontal,
  Plus,
} from 'phosphor-react-native';

// components
import {IconButton, Text} from '@/components';

// styles
import {FBColors} from '@/types/styles';

interface HeadingProps {
  openBottomSheet: () => void;
}

const Heading: React.FC<HeadingProps> = ({openBottomSheet}) => {
  return (
    <View style={styles.container}>
      <Text style={{fontSize: 20}} weight="600">
        My Assets
      </Text>
      <View style={styles.btnContainer}>
        {/* <IconButton variant="outlined" onPress={() => {}} style={styles.btn}>
          <IconButton.Icon>
            <SlidersHorizontal color={FBColors.complementary} size={20} />
          </IconButton.Icon>
        </IconButton> */}
        <IconButton
          variant="outlined"
          onPress={openBottomSheet}
          style={styles.btn}>
          <IconButton.Icon>
            <Plus color={FBColors.complementary} size={20} />
          </IconButton.Icon>
        </IconButton>
      </View>
    </View>
  );
};

export default Heading;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  btnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },

  btn: {
    borderRadius: 10,
    width: 30,
    height: 30,
  },
});
