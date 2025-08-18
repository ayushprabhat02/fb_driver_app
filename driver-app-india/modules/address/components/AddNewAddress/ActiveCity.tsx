// dependencies
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';

// components
import {Divider, Text} from '@/components';

// store
import {locationStore} from '@/globalStore';

// types and styles
import {FetchAllCountriesQuery} from '@/generated/graphql';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';
import CityList from './CityList';

const ActiveState: React.FC = () => {
  const [activeCity, setActiveCity] = useState<
    FetchAllCountriesQuery['country'][0]['states'][0]['cities'][0] | undefined
  >();

  const [showCityList, setShowCityList] = useState(false);

  const selectedState = locationStore.use.selectedState();
  const selectedCity = locationStore.use.selectedCity();
  const addressComponents = locationStore.use.addressComponents();

  useEffect(() => {
    const currentCity = selectedState?.cities?.find(city => {
      return city.name === addressComponents?.city;
    });

    setActiveCity(currentCity);

    if (currentCity) {
      locationStore.setState(state => ({
        ...state,
        selectedCity: currentCity,
      }));
    }
  }, [selectedState, addressComponents?.city]);

  return (
    <View style={{flex: 1}}>
      <View style={{flexDirection: 'row'}}>
        <Text color="steelBlue" size="sm" weight="600">
          City
        </Text>
        <Text style={{color: 'red', marginLeft: 2}}>*</Text>
      </View>
      <Divider />
      <Pressable
        disabled={activeCity ? true : false}
        onPress={() => {
          setShowCityList(true);
        }}
        style={[
          styles.textInput,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
        ]}>
        <Text
          style={{flex: 1}}
          lines={1}
          color={activeCity ? 'disabledInputText' : 'neutral'}>
          {selectedCity?.name}
        </Text>
        <Icon name="arrow-drop-down" size={24} color={FBColors.steelBlue} />
      </Pressable>
      <Modal
        onBackdropPress={() => {
          setShowCityList(false);
        }}
        isVisible={showCityList}
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={1000}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown">
        <CityList
          closeList={() => {
            setShowCityList(false);
          }}
        />
      </Modal>
    </View>
  );
};

export default ActiveState;

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: FBBorders.input,
    height: 36,
    backgroundColor: FBBackground.input,
    borderRadius: 6,
    paddingVertical: 0,
    paddingLeft: 10,
    color: FBColors.steelBlue,
  },

  buddyCanDelivery: {
    flexDirection: 'row',
    borderRadius: 40,
    backgroundColor: '#FEF8DF',
    borderColor: '#D8B98D',
    borderWidth: 1,
    width: '60%',
    padding: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16, // Adjust based on the image
    fontWeight: 'bold',
    color: FBColors.darkGray, // Replace with the label text color
    marginBottom: 5, // Adjust spacing
  },
  errorText: {
    color: 'red',
    marginVertical: 10,
  },
});
