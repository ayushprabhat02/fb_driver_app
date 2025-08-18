//dependencies
import React from 'react';
import {View} from 'react-native';
import {Text} from '@/components';
import {vs, s} from 'react-native-size-matters';

// styles
import {FBColorPalette} from '@/types/styles';

//imports
import NoSearchResultIcon from '@/assets/common/no-search-result.svg';

const NoSearchResult: React.FC = () => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: s(10),
      }}>
      <NoSearchResultIcon />
      <View style={{flexDirection: 'column', paddingLeft: s(10)}}>
        <Text weight="bold" style={{color: FBColorPalette.error}}>
          Sorry , Something Went Wrong
        </Text>

        <Text size="xs" style={{color: FBColorPalette.error, marginTop: vs(5)}}>
          Please enter a different location and try again
        </Text>
      </View>
    </View>
  );
};

export default NoSearchResult;
