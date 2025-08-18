// todo: legacy. using <LocationBarUpdated /> instead. delete before production
// dependencies
import {Platform, Pressable} from 'react-native';
import React, {useCallback, useState, useEffect} from 'react';
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteProps,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ms, vs} from 'react-native-size-matters';
import MapView from 'react-native-maps';
import {StackNavigationProp} from '@react-navigation/stack';

// store
import locationStore from '../store';

// types & styles
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import {ProtectedStackParamList} from '@/navigator';
import {getAddressFromCoords} from '@/utils/general';

type Props = {
  navigation: StackNavigationProp<ProtectedStackParamList>;
  mapRef: React.MutableRefObject<MapView | undefined>;
  // showClearButton: boolean;
  // setShowClearButton: Dispatch<SetStateAction<boolean>>;
  searchRef: React.MutableRefObject<GooglePlacesAutocompleteRef | null>;
  address: string;
};

const LocationSearchbar: React.FC<Props> = ({
  navigation,
  mapRef,
  // showClearButton,
  // setShowClearButton,
  searchRef,
  address,
}) => {
  const [region, setRegion] = useState({
    latitude: 28.503134760218046,
    longitude: 77.08282435387322,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [showClearButton, setShowClearButton] = useState<boolean>(false);

  const searchPlace = useCallback((details: GooglePlaceDetail | null) => {
    setShowClearButton(true);

    setRegion({
      latitude: details?.geometry.location.lat as number,
      longitude: details?.geometry.location.lng as number,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    (mapRef?.current as MapView).animateToRegion(
      {
        latitude: details?.geometry.location.lat as number,
        longitude: details?.geometry.location.lng as number,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );

    const getReverseGeocodedAddress = async (coords: Coords) => {
      const response = await getAddressFromCoords(coords);
      setShowClearButton(true);

      locationStore.setState(state => ({
        ...state,
        addressComponents: response,
      }));

      return response;
    };

    setTimeout(() => {
      locationStore.setState(state => ({
        ...state,
        currentCoords: {
          lat: details?.geometry.location.lat as number,
          lng: details?.geometry.location.lng as number,
        },
      }));
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearInput = () => {
    setShowClearButton(false);
    searchRef.current?.setAddressText('');
  };

  useEffect(() => {
    if (address) {
      searchRef.current?.setAddressText(address);
    }
  }, [address, searchRef]);

  return (
    <GooglePlacesAutocomplete
      textInputProps={{
        placeholderTextColor: FBColors.placeHolderPrimary,
        clearButtonMode: 'never',
        numberOfLines: 1,
        scrollEnabled: false,
      }}
      keepResultsAfterBlur={false}
      currentLocation={true}
      currentLocationLabel="Current location"
      ref={searchRef}
      renderLeftButton={() => (
        <Icon
          onPress={() => navigation.goBack()}
          name="search"
          size={ms(20)}
          color={FBColors.lightGray}
        />
      )}
      renderRightButton={() => (
        <Pressable
          style={{opacity: showClearButton ? 1 : 0}}
          onPress={clearInput}>
          <Icon name="cancel" size={20} color={FBColors.lightGray} />
        </Pressable>
      )}
      placeholder="Enter location"
      minLength={2}
      debounce={300}
      styles={googleStyles}
      fetchDetails
      GooglePlacesSearchQuery={{
        rankby: 'distance',
      }}
      onPress={(data, details) => {
        searchPlace(details);
      }}
      query={{
        key:
          Platform.OS === 'android'
            ? 'AIzaSyDcwMtmUoyBtgv3xQgyyY62IiY_jNwtpCI'
            : 'AIzaSyCfIkG3UgZi8Yqs6bJX1inU7YX40ugzNQg',
        language: 'en',
        components: 'country:ind',
        location: `${region.latitude}, ${region.longitude}`,
      }}
    />
  );
};

export default LocationSearchbar;

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
  container: {
    alignSelf: 'center',
    flex: 0,
    position: 'absolute',
    width: Platform.OS === 'android' ? '95%' : '95%',
    zIndex: 1,
    top: vs(48),
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
    maxWidth: '100',
  },
};
