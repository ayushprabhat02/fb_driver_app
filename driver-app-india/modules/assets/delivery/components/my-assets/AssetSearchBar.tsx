// dependencies
import {StyleSheet, View, TextInput} from 'react-native';
import React, {useState} from 'react';
import {MagnifyingGlass} from 'phosphor-react-native';

// components
import {commonInputStyles} from '@/styles';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

const AssetSearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const changeText = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <View style={styles.searchBarContainer}>
      <MagnifyingGlass color={FBColors.placeHolderPrimary} style={{flex: 1}} />
      <TextInput
        value={searchTerm}
        onChangeText={changeText}
        style={[commonInputStyles, styles.textInput]}
        placeholder="Search Assets"
      />
    </View>
  );
};

export default AssetSearchBar;

const styles = StyleSheet.create({
  searchBarContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: FBBorders.secondary,
    backgroundColor: FBBackground.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    columnGap: 0,
  },
  textInput: {
    height: 48,
    backgroundColor: FBBackground.white,
    borderWidth: 0,
    color: FBColors.neutral,
    flex: 2,
  },
});
