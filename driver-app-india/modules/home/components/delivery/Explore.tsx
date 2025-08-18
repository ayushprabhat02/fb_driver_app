// dependencies
import {StyleSheet, View, ScrollView, Pressable} from 'react-native';
import React from 'react';
import {GasCan, MapPinLine, ChartBar, FileText} from 'phosphor-react-native';

//components
import {Divider, Text} from '@/components';
import {FBBackground, FBColors} from '@/types/styles';
import {useNavigation} from '@react-navigation/native';

const exploreOptions = [
  {
    label1: 'Saved',
    label2: 'Assets',
    icon: <GasCan size={28} color={FBColors.white} />,
    route: 'assets',
    bg: FBBackground.darkGreen,
  },
  {
    label1: 'Saved',
    label2: 'Addresses',
    icon: <MapPinLine size={28} color={FBColors.white} />,
    route: 'address',
    bg: FBBackground.deepTeal,
  },
  {
    label1: 'My',
    label2: 'Reports',
    icon: <ChartBar size={28} color={FBColors.white} />,
    route: 'reports',
    bg: FBBackground.darkGreen,
  },
  {
    label1: 'My',
    label2: 'Orders',
    icon: <FileText size={28} color={FBColors.white} />,
    route: 'order',
    bg: FBBackground.deepTeal,
  },
];

const Explore: React.FC = () => {
  return (
    <View style={{paddingHorizontal: 10}}>
      <Text size="3xl" letterSpacing="widest" weight="400">
        Explore
      </Text>
      <Divider height={20} />
      <ScrollView
        horizontal
        contentContainerStyle={{columnGap: 12}}
        showsHorizontalScrollIndicator={false}>
        {exploreOptions.map((option, index) => (
          <ExploreCard key={index} option={option} />
        ))}
      </ScrollView>
    </View>
  );
};

type ExploreCardProps = {
  option: {
    label1: string;
    label2: string;
    icon: React.ReactNode;
    route: string;
    bg: string;
  };
};

const ExploreCard: React.FC<ExploreCardProps> = ({option}) => {
  const navigation = useNavigation();

  const onPress = () => {
    navigation.navigate(option.route);
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.exploreCard, {backgroundColor: option.bg}]}>
      {option.icon}
      <Divider height={8} />
      <View>
        <Text
          color="white"
          size="sm"
          weight="600"
          style={{textAlign: 'center'}}>
          {option.label1}
        </Text>
        <Text
          color="white"
          size="sm"
          weight="600"
          style={{textAlign: 'center'}}>
          {option.label2}
        </Text>
      </View>
    </Pressable>
  );
};

export default Explore;

const styles = StyleSheet.create({
  exploreCard: {
    height: 120,
    width: 92,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
