// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {openSettings} from 'react-native-permissions';

// components
import {Button, Divider, Text} from '@/components';
import {FBColors} from '@/types/styles';

type Props = {
  closeBottomSheet: () => void;
};

const LocationPermissionRequest: React.FC<Props> = ({closeBottomSheet}) => {
  const onClick = () => {
    openSettings();
    setTimeout(() => {
      closeBottomSheet();
    }, 1500);
  };

  return (
    <View style={styles.bottomSheetContainer}>
      <View style={styles.textIconContainer}>
        <Icon name="map-marker-off" size={24} color={FBColors.neutral} />
        <View>
          <Text size="sm" weight="600">
            Location permission is off
          </Text>
          <Text size="sm" color="mediumGray">
            Enable your location permission from settings and restart the app to
            continue
          </Text>
        </View>
      </View>
      <Divider height={24} />
      <Button
        variant="solid"
        onPress={onClick}
        textStyle={{fontSize: 14, fontWeight: '600'}}
        style={styles.enableBtn}>
        Enable
      </Button>
    </View>
  );
};

export default LocationPermissionRequest;

const styles = StyleSheet.create({
  bottomSheetContainer: {
    paddingTop: 50,
    width: '100%',
  },
  textIconContainer: {flexDirection: 'row', width: '90%', columnGap: 10},
  enableBtn: {paddingHorizontal: 10, height: 40},
});
