//dependencies
import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {ScaledSheet, ms, vs} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView from 'react-native-maps';

//imports
import {Text, Button, CardElevated, IconButton, Divider} from '@/components';
import LocationPinIcon from '@/assets/map/location-pin.svg';

// services
import {fetchCurrentLocation} from '@/utils/general';

// store
import {locationStore} from '@/globalStore';

// types & styles
import {FBBackground, FBColorPalette, FBColors} from '@/types/styles';

type Props = {
  mapRef: React.MutableRefObject<MapView | undefined>;
  isServiceable: boolean;
  addNewAddress: () => void;
  goToServiceableArea: () => void;
  loading: boolean;
};
const CurrentLocationCard: React.FC<Props> = ({
  isServiceable,
  addNewAddress,
  mapRef,
  goToServiceableArea,
  loading,
}) => {
  const addressComponents = locationStore.use.addressComponents();

  /**
   * this function pans the map to the user's current location
   */
  const goToCurrentLocation = async () => {
    const response = await fetchCurrentLocation();

    (mapRef.current as MapView).animateToRegion(
      {
        latitude: response?.lat as number,
        longitude: response?.lng as number,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  };

  //create our styling code:
  const styles = ScaledSheet.create({
    cardElevated: {
      marginTop: 4,
      zIndex: 0,
      borderRadius: ms(20),
    },
    currentLocationText: {
      width: '83%',
      maxHeight: ms(80),
      padding: 10,
      borderWidth: ms(1),
      borderColor: FBColorPalette.inputBorder,
      borderRadius: 10,
      backgroundColor: FBColorPalette.input,
    },
    locationPin: {
      backgroundColor: FBColorPalette.secondary,
      padding: 0,
      height: ms(35),
      width: ms(35),
      borderRadius: ms(25),
    },
    enterAddressButton: {
      width: '100%',
      alignSelf: 'center',
      backgroundColor: FBColors.complementary,
    },
    goToServiceableAreaButton: {
      backgroundColor: FBBackground.darkGreen,
    },
  });

  return (
    <View
      style={{
        position: 'absolute',
        bottom: vs(30),
        alignSelf: 'center',
        width: '90%',
      }}>
      <IconButton
        onPress={goToCurrentLocation}
        variant="outlined"
        style={{
          width: '60%',
          alignSelf: 'center',
          height: 30,
          backgroundColor: 'white',
        }}>
        <IconButton.Icon>
          <Icon name="my-location" size={20} color={FBColors.primary} />
        </IconButton.Icon>
        <IconButton.Text textStyle={{fontSize: 12}}>
          Use current location
        </IconButton.Text>
      </IconButton>

      <CardElevated cardStyle={styles.cardElevated}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <IconButton
            variant="rounded"
            style={styles.locationPin}
            onPress={() => {}}>
            <LocationPinIcon />
          </IconButton>

          <View style={styles.currentLocationText}>
            <Text color="lightGray">{addressComponents?.formattedAddress}</Text>
          </View>
        </View>
        <Divider height={20} />
        {!loading ? (
          isServiceable ? (
            <Button
              variant="solid"
              textStyle={{fontSize: ms(12)}}
              style={styles.enterAddressButton}
              onPress={addNewAddress}>
              Enter complete address →
            </Button>
          ) : (
            <Button
              variant="solid"
              textStyle={{fontSize: ms(12)}}
              style={styles.goToServiceableAreaButton}
              onPress={goToServiceableArea}>
              Go to nearest deliverable area →
            </Button>
          )
        ) : (
          <Button
            variant="solid"
            textStyle={{fontSize: ms(12)}}
            style={styles.enterAddressButton}
            onPress={() => null}>
            <ActivityIndicator color={'white'} />
          </Button>
        )}
      </CardElevated>
    </View>
  );
};

export default CurrentLocationCard;
