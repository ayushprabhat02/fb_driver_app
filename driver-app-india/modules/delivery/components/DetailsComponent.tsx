// dependencies
import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// components
import {CardElevated, Text as CustomText, IconButton} from '@/components';

// types
import {FBColorPalette} from '@/types/styles';

interface Props {
  title: string;
  children?: React.ReactNode;
  componentStyle?: ViewStyle;
  cardStyle?: ViewStyle;
  showAddBtn?: boolean;
  onPress?: () => void;
}

const AssetsSummary: React.FC<Props> = ({
  title,
  children,
  componentStyle,
  cardStyle,
  showAddBtn = false,
  onPress,
}) => {
  return (
    <View style={[componentStyle]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <CustomText size="lg" weight="600">
          {title}
        </CustomText>
        {showAddBtn && (
          <IconButton
            variant="outlined"
            onPress={onPress as () => void}
            style={styles.iconBtn}>
            <Icon name="plus" color={FBColorPalette.primary} />
          </IconButton>
        )}
      </View>
      <CardElevated cardStyle={cardStyle}>{children}</CardElevated>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20, // Adjust font size for mobile
    fontWeight: 'bold',
  },
  iconBtn: {
    height: 30,
    width: 30,
    paddingHorizontal: 0,
  },
});

export default AssetsSummary;
