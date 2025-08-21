//dependencies,
import React, {
  LegacyRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import MapView, {PROVIDER_GOOGLE, Region} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {CommonActions} from '@react-navigation/native';
//@ts-ignore
navigator.geolocation = require('react-native-geolocation-service');

//services
import {AddressService, LocationService} from '@/services';
import {fetchCurrentLocation, getAddressFromCoords} from '@/utils/general';

//store
import {locationStore} from '@/globalStore';

// components
import CurrentLocationCardUpdated from '@/modules/location/components/CurrentLocationCardUpdated';
import LocationBarUpdated from '@/modules/location/components/LocationBarUpdated';
import {CheckServiceabilityModal} from '@/modules/location/components';
import {SimpleBottomSheet} from '@/components';
import {AddNewAddressForm} from '@/modules/fillupRequest/components/AddNewAddress';

//styles & types
import {FBColors} from '@/types/styles';
import {commonBottomSheetView} from '@/styles';
import {StackScreenProps} from '@react-navigation/stack';
import {DeliveryStackParamList} from '@/navigator/containers/Delivery';

type Props = StackScreenProps<DeliveryStackParamList>;

const AddShippingNewUser: React.FC<Props> = ({navigation}) => {
  const [loading, setLoading] = useState(true);

  const currentCoords = locationStore.use.currentCoords();

  const isServiceable = locationStore.use.isServiceable();

  const mapRef = useRef<MapView>();

  // add address form bottom sheet start
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    // setShowLocationBar(true);
    bottomSheetRef.current?.close();
  };
  // add address form bottom sheet end

  //serviceability modal bottom sheet start
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const openModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const closeModal = useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  //serviceability modal bottom sheet end

  const checkServiceability = useCallback(async () => {
    if (!currentCoords?.lat || !currentCoords?.lng) {
      return;
    }

    const response = await LocationService.checkServiceability({
      latitude: currentCoords?.lat as number,
      longitude: currentCoords?.lng as number,
    });

    if (response) {
      setLoading(false);
      locationStore.setState(state => ({
        ...state,
        isServiceable: true,
      }));
      // setIsServiceable(true);
      locationStore.setState(state => ({
        ...state,
        deliveryPartner: response,
      }));
      closeModal();
    } else {
      setLoading(false);
      locationStore.setState(state => ({
        ...state,
        isServiceable: false,
      }));
      openModal();
    }
  }, [currentCoords, openModal, closeModal]);

  /**
   * fired when the user stops dragging the map
   * we update the currentCoords in the store with the center of the current map region
   */
  const onRegionChangeComplete = (region: Region) => {
    locationStore.setState(state => ({
      ...state,
      currentCoords: {
        lat: region.latitude,
        lng: region.longitude,
      },
    }));
  };

  // got to nearest serviceable area
  const goToServiceableArea = async () => {
    try {
      const response = await LocationService.fetchNearestZones({
        distance_meters: 999999999999,
        latitude: currentCoords?.lat,
        longitude: currentCoords?.lng,
      });

      (mapRef.current as MapView).animateToRegion(
        {
          latitude: response?.nearestCentroid[1] as number,
          longitude: response?.nearestCentroid[0] as number,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    } catch (err) {
      console.warn(err);
    }
  };

  const goToHomeScreen = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'home'}],
      }),
    );
  };

  useEffect(() => {
    if (!currentCoords?.lat || !currentCoords?.lng) {
      fetchCurrentLocation();
      return;
    }

    getAddressFromCoords({
      lat: currentCoords.lat as number,
      lng: currentCoords.lng as number,
    })
      .then(response => {
        locationStore.setState(state => ({
          ...state,
          addressComponents: response,
        }));
      })
      .finally(() => {
        checkServiceability();
      });
    return () => {
      closeBottomSheet();
      closeModal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCoords]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      getAddressFromCoords({
        lat: currentCoords?.lat as number,
        lng: currentCoords?.lng as number,
      });
    }

    AddressService.fetchAllCountries();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      locationStore.setState(state => ({
        ...state,
        selectedState: undefined,
        selectedCity: undefined,
        addressType: 'home',
        postalCode: '',
        addressLine: '',
        // currentCoords: null,
      }));
    };
  }, []);

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, position: 'relative'}}>
        {/* todo: some styles may be redundant. cleanup later */}
        <LocationBarUpdated mapRef={mapRef} />

        <MapView
          provider={PROVIDER_GOOGLE}
          zoomEnabled={true}
          style={{flex: 1}}
          ref={mapRef as LegacyRef<MapView>}
          onRegionChangeComplete={onRegionChangeComplete}
          initialRegion={{
            latitude: currentCoords?.lat as number,
            longitude: currentCoords?.lng as number,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          // initialRegion={{
          //   latitude: 28.6139, // Latitude for Delhi //todo: replace with current location lat
          //   longitude: 77.209, // Longitude for Delhi //todo: replace with current location lat
          //   latitudeDelta: 0.02, // Adjust delta values for appropriate zoom level
          //   longitudeDelta: 0.02, // Adjust delta values for appropriate zoom level
          // }}
        />

        <CurrentLocationCardUpdated
          loading={loading}
          isServiceable={isServiceable}
          mapRef={mapRef}
          addNewAddress={openBottomSheet}
          goToServiceableArea={goToServiceableArea}
        />

        <View style={styles.marker}>
          <Icon name="location-pin" size={40} color={FBColors.error} />
        </View>

        <SimpleBottomSheet
          ref={bottomSheetModalRef}
          showCloseBtn={false}
          closeSheet={closeModal}>
          <BottomSheetView style={commonBottomSheetView}>
            <CheckServiceabilityModal
              showNearestServiceableZone={goToServiceableArea}
            />
          </BottomSheetView>
        </SimpleBottomSheet>

        {/* add new address form */}
        <SimpleBottomSheet
          ref={bottomSheetRef}
          closeSheet={closeBottomSheet}
          snapPoints={['95%']}>
          <BottomSheetView style={[commonBottomSheetView, {zIndex: 100}]}>
            <AddNewAddressForm
              goBack={goToHomeScreen}
              closeBottomSheet={closeBottomSheet}
            />
          </BottomSheetView>
        </SimpleBottomSheet>
      </View>
    </View>
  );
};

export default AddShippingNewUser;

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -16}, {translateY: -32}],
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
