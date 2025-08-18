// dependencies
import {Platform, Pressable} from 'react-native';
import React, {useState} from 'react';
import {useHeaderHeight} from '@react-navigation/elements';

import {
  GooglePlaceData,
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteProps,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';

import Icon from 'react-native-vector-icons/MaterialIcons';
import {ms} from 'react-native-size-matters';
import MapView from 'react-native-maps';

// store
import {locationStore} from '@/globalStore';

// types
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

interface Props {
  mapRef: React.MutableRefObject<MapView | undefined>;
}

const LocationBarUpdated: React.FC<Props> = ({mapRef}) => {
  const currentCoords = locationStore.use.currentCoords();
  const [showClearButton, setShowClearButton] = useState<boolean>(false);

  const searchRef = React.useRef<GooglePlacesAutocompleteRef | null>(null);

  const onLocationClick = (
    data: GooglePlaceData,
    detail: GooglePlaceDetail | null,
  ) => {
    if (detail) {
      mapRef.current?.animateToRegion({
        latitude: detail.geometry.location.lat,
        longitude: detail.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      clearInput();
      setShowClearButton(false);
    }
  };

  const clearInput = () => {
    setShowClearButton(false);
    searchRef.current?.setAddressText('');
  };

  const headerHeight = useHeaderHeight();

  return (
    <GooglePlacesAutocomplete
      textInputProps={{
        placeholderTextColor: FBColors.placeHolderPrimary,
        clearButtonMode: 'never',
        numberOfLines: 1,
        scrollEnabled: false,
      }}
      keepResultsAfterBlur={false}
      currentLocation={false}
      ref={searchRef}
      renderLeftButton={() => (
        <Pressable>
          <Icon name="search" size={ms(20)} color={FBColors.lightGray} />
        </Pressable>
      )}
      renderRightButton={() => (
        <Pressable
          style={{display: showClearButton ? 'flex' : 'none'}}
          onPress={clearInput}>
          <Icon name="cancel" size={20} color={FBColors.lightGray} />
        </Pressable>
      )}
      placeholder="Search for area, street name..."
      minLength={2}
      debounce={500}
      styles={{
        container: {
          alignSelf: 'center',
          flex: 0,
          position: 'absolute',
          width: '95%',
          zIndex: 1,
          paddingTop: headerHeight,
        },
        ...googleStyles,
      }}
      fetchDetails
      GooglePlacesSearchQuery={{
        rankby: 'distance',
      }}
      onPress={onLocationClick}
      query={{
        key:
          Platform.OS === 'android'
            ? 'AIzaSyCRZYvzF6ESgvhSYFPydbQqe5T4fSzch4A'
            : 'AIzaSyCfIkG3UgZi8Yqs6bJX1inU7YX40ugzNQg',
        language: 'en',
        components: 'country:ind',
        location: `${currentCoords?.lat as number}, ${
          currentCoords?.lng as number
        }`,
      }}
    />
  );
};

export default LocationBarUpdated;

const googleStyles: GooglePlacesAutocompleteProps['styles'] = {
  row: {
    backgroundColor: FBBackground.white,
    borderBottomWidth: 1,
    borderBottomColor: FBBorders.secondary,
  },
  textInputContainer: {
    backgroundColor: FBBackground.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 0,
    paddingHorizontal: 10,
  },

  listView: {
    backgroundColor: FBBackground.darkGreen,
    width: '92%',
    alignSelf: 'center',
    borderRadius: ms(10),
  },
  description: {color: FBColors.neutral, fontSize: ms(12)},
  textInput: {
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
    position: 'relative',
    color: FBColors.neutral,
    fontSize: ms(12),
    textAlign: 'left',
    flex: 1,
  },
};
