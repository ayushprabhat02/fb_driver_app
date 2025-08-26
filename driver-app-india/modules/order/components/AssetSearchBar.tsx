import React from 'react';
import {View, TextInput, TextStyle, ViewStyle} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {FBColors, FBBackground, FBBorders, FontSizeEnum} from '@/types/styles';
import {Search} from 'lucide-react-native';

interface AssetSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const AssetSearchBar: React.FC<AssetSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search Assets',
}) => {
  return (
    <View style={styles.container}>
      {/* <Text size="base" weight="600" color="neutral" style={styles.title as TextStyle}>
        Search Assets
      </Text> */}

      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={FBColors.lightGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={FBColors.placeHolderPrimary}
        />
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: '16@vs',
  },
  title: {
    marginBottom: '8@vs',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FBBackground.input,
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: FBBorders.input,
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
  },
  searchIcon: {
    marginRight: '8@s',
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizeEnum.base,
    color: FBColors.neutral,
    paddingVertical: 0,
  },
});

export default AssetSearchBar;
