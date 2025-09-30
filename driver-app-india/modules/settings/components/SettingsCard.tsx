// depenedcies
import {Pressable, View} from 'react-native';
import React from 'react';
import {ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// components
import {Text} from '@/components';

// types
import {
  FBBackground,
  FBBorders,
  FBColorPalette,
  FBColors,
} from '@/types/styles';

interface SettingsCardProps {
  settings: {
    title: string;
    icon: string;
    module: string;
    screen?: string;
  };
  color?: string;
  bgColor?: string;
  onPress: () => void;
  borderWidth?: number;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  settings,
  onPress,
  color = FBColors.lightGray,
  bgColor = FBBackground.pastelGreen,
  borderWidth = 1,
}) => {
  return (
    <Pressable
      style={[styles.settingsCard, {borderBottomWidth: borderWidth}]}
      onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 12,
        }}>
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: bgColor,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={settings.icon} size={20} color={color} />
        </View>
        <Text size="base" weight="400">
          {settings.title}
        </Text>
      </View>
      <Icon
        name="chevron-right"
        size={24}
        color={FBColorPalette.complementary}
      />
    </Pressable>
  );
};

export default SettingsCard;

const styles = ScaledSheet.create({
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: FBBorders.primary,
    height: 65,
  },
});