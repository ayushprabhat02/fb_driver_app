//dependencies
import React from 'react';
import {View, TextInput} from 'react-native';
// import debounce from 'lodash.debounce';
import {ScaledSheet, vs, s, ms} from 'react-native-size-matters';

// store
// import {addressStore} from '@/globalStore';

//imports
import ClearSearchIcon from '@/assets/common/clear-search.svg';
import SearchIcon from 'react-native-vector-icons/Feather';

//types
// import {Address_Type_Enum} from '@/generated/graphql';

//services
// import {AddressService} from '@/services';
// import {getActiveDelOrgUserId} from '@/utils/localStorage';

// styles
import {FBBackground, FBBorders, FBColors, FontSizeEnum} from '@/types/styles';
import {commonInputStyles} from '@/styles';

interface SearchBoxProps {
  value: string;
  changeText: (text: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({value, changeText}) => {
  //search query state

  //debounced function to search for shipping address based on query
  // React.useEffect(() => {
  //   const debouncedSearch = debounce(() => {
  //     if (searchTerm) {
  //       AddressService.searchShippingAddresses({
  //         address_type: Address_Type_Enum.Shipping,
  //         organization_user_id: getActiveDelOrgUserId(),
  //         name: searchTerm,
  //       });
  //     } else {
  //       AddressService.getShippingAddresses({
  //         address_type: Address_Type_Enum.Shipping,
  //         organization_user_id: getActiveDelOrgUserId(),
  //       });
  //     }
  //   }, 500);
  //   debouncedSearch(); // Execute the debounced search
  //   // Cleanup (optional for debounced scenarios):
  //   return () => {
  //     debouncedSearch.cancel(); // Cancel any pending searches
  //   };
  // }, [searchTerm]);

  return (
    <View style={styles.searchbar}>
      <SearchIcon name="search" size={20} color={FBColors.lightGray} />
      <TextInput
        style={[commonInputStyles, styles.inputStyles]}
        placeholder="Search from saved addresses"
        placeholderTextColor={FBColors.placeHolderPrimary}
        value={value}
        onChangeText={changeText}
      />
      {value && <ClearSearchIcon onPress={() => changeText('')} />}
    </View>
  );
};

const styles = ScaledSheet.create({
  inputStyles: {
    backgroundColor: 'transparent',
    borderRadius: ms(0),
    borderWidth: ms(0),
    paddingLeft: ms(0),
    width: '85%',
    fontSize: FontSizeEnum.base,
  },
  searchbar: {
    borderWidth: ms(1),
    borderColor: FBBorders.secondary,
    backgroundColor: FBBackground.primary,
    borderRadius: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(0),
    height: vs(44),
    paddingHorizontal: s(10),
    columnGap: s(8),
  },
});

export default SearchBox;
