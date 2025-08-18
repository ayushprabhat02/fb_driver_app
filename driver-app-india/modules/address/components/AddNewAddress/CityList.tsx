// dependencies
import {Dimensions, Pressable, ScrollView, TextInput, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {X, CheckCircle} from 'phosphor-react-native';
import {MagnifyingGlass} from 'phosphor-react-native';

// components
import {Text} from '@/components';

// store
import {locationStore} from '@/globalStore';

// types
import {FBBorders, FBColors} from '@/types/styles';
import {FetchAllCountriesQuery} from '@/generated/graphql';

interface CityListProps {
  closeList: () => void;
}

const CityList: React.FC<CityListProps> = ({closeList}) => {
  const cityList = locationStore.use.citiesList();
  const selectedState = locationStore.use.selectedState();
  const selectedCity = locationStore.use.selectedCity();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCityList, setFilteredCityList] = useState(cityList);

  const chooseCity = (
    city: FetchAllCountriesQuery['country'][0]['states'][0]['cities'][0],
  ) => {
    locationStore.setState(state => ({
      ...state,
      selectedCity: city,
    }));

    setTimeout(() => {
      closeList();
    }, 300);
  };

  useEffect(() => {
    locationStore.setState(state => ({
      ...state,
      citiesList: selectedState?.cities || [],
    }));
  }, [selectedState]);

  useEffect(() => {
    setFilteredCityList(
      cityList.filter(city =>
        city?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [searchQuery, cityList]);

  return (
    <View
      style={{
        backgroundColor: 'white',
        height: Dimensions.get('window').height / 1.4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 10,
        }}>
        <Text color="slate" weight="600">
          Select City
        </Text>
        <Pressable onPress={closeList}>
          <X size={24} color={FBColors.mediumGray} />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 6,
          width: '100%',
          borderWidth: 1,
          borderColor: FBBorders.input,
          borderRadius: 6,
          padding: 8,
        }}>
        <MagnifyingGlass color={FBColors.steelBlue} size={20} />
        <TextInput
          placeholder="Search city..."
          placeholderTextColor={FBColors.placeHolderPrimary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            color: FBColors.steelBlue,
            width: '90%',
          }}
        />
      </View>
      <ScrollView>
        {filteredCityList.map(city => {
          return (
            <Pressable
              onPress={() => chooseCity(city)}
              key={city.id}
              style={{
                height: 50,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomColor: FBBorders.secondary,
              }}>
              <Text size="sm" color="steelBlue" weight="400">
                {city.name}
              </Text>
              {selectedCity?.name === city.name && (
                <CheckCircle size={24} color={FBColors.primary} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CityList;
