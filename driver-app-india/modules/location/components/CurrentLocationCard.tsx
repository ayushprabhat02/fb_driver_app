// todo: legacy. using <CurrentLocationCardUpdated /> instead. delete before production
//dependencies
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet, ms, vs} from 'react-native-size-matters';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

//imports
import {Text, Button, CardElevated, IconButton, Divider} from '@/components';
import LocationPinIcon from '@/assets/map/location-pin.svg';

// types & styles
import {FBBackground, FBColorPalette, FBColors} from '@/types/styles';
import {ProtectedStackParamList} from '@/navigator';

type Props = {
  reverseGeocodeAddress: string;
  navigation: StackNavigationProp<ProtectedStackParamList>;
  goToCurrentLocation: () => void;
  isServiceable: boolean;
  goToServiceableArea: () => void;
  addNewAddress: () => void;
};
const CurrentLocationCard: React.FC<Props> = ({
  goToCurrentLocation,
  isServiceable,
  goToServiceableArea,
  addNewAddress,
}) => {
  //create our styling code:
  const styles = ScaledSheet.create({
    cardElevated: {
      marginTop: 4,
      zIndex: 2,
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
      width: '80%',
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
            <Text color="lightGray">asd</Text>
          </View>
        </View>
        <Divider height={20} />
        {isServiceable ? (
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
        )}
      </CardElevated>
    </View>
  );
};

export default CurrentLocationCard;
