// dependencies
import {Dimensions, Pressable, ScrollView, TextInput, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {X, CheckCircle, MagnifyingGlass} from 'phosphor-react-native';

// components
import {Text} from '@/components';

// store
import {locationStore} from '@/globalStore';

// types
import {FBBorders, FBColors} from '@/types/styles';
import {FetchAllCountriesQuery} from '@/generated/graphql';

interface StateListProps {
  closeList: () => void;
}

const StateList: React.FC<StateListProps> = ({closeList}) => {
  const statesList = locationStore.use.statesList();
  const selectedState = locationStore.use.selectedState();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStatesList, setFilteredStatesList] = useState(statesList);

  const chooseState = (
    item: FetchAllCountriesQuery['country'][0]['states'][0],
  ) => {
    locationStore.setState(state => ({
      ...state,
      selectedState: item,
      selectedCity: undefined,
    }));

    setTimeout(() => {
      closeList();
    }, 300);
  };

  useEffect(() => {
    setFilteredStatesList(
      statesList.filter(state =>
        state?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [searchQuery, statesList]);

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
          Select State
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
          placeholder="Search state..."
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
        {filteredStatesList.map(state => {
          return (
            <Pressable
              onPress={() => chooseState(state)}
              key={state.id}
              style={{
                height: 50,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomColor: FBBorders.secondary,
              }}>
              <Text size="sm" color="steelBlue" weight="400">
                {state.name}
              </Text>
              {selectedState?.name === state.name && (
                <CheckCircle size={24} color={FBColors.primary} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default StateList;
