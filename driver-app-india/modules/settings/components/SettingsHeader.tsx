// dependencies
import {View} from 'react-native';
import React from 'react';
import {ScaledSheet} from 'react-native-size-matters';

// store
import {checkinStore, userStore} from '@/globalStore';

// components
import {Text} from '@/components';
import {FBBackground, FBColorPalette} from '@/types/styles';

// types

const SettingsHeader: React.FC = () => {
  const loggedInUser = userStore.use.loggedInUser();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();

  return (
    <View style={styles.headerContainer}>
      <View style={{flexDirection: 'row', columnGap: 12}}>
        <SettingsAvatar user={loggedInUser} />
        <View>
          <Text color="white" weight="600" size="lg" lines={1}>
            {loggedInUser
              ? `${loggedInUser.first_name || ''} ${
                  loggedInUser.last_name || ''
                }`.trim()
              : ''}
          </Text>
          <Text color="white" weight="600" size="sm" style={{marginTop: 8}}>
            {driverVehicleDetails?.registration_number}
          </Text>
        </View>
      </View>
    </View>
  );
};

interface SettingsAvatarProps {
  user: any | undefined;
}

const SettingsAvatar: React.FC<SettingsAvatarProps> = ({user}) => {
  return (
    <View style={styles.avatar}>
      <Text color="primary" weight="bold" size="3xl">
        {/* {`${user?.?.[0]} ${user?.user?.last_name?.[0]}`} */}
        {`${user?.first_name ? user?.first_name[0] : ''} ${
          user?.last_name ? user?.last_name[0] : ''
        }`}
      </Text>
    </View>
  );
};

export default SettingsHeader;

const styles = ScaledSheet.create({
  headerContainer: {
    width: '100%',
    height: '100@vs',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: '20@s',
    backgroundColor: FBBackground.darkGreen,
    borderRadius: 16,
  },

  avatar: {
    backgroundColor: FBBackground.white,
    width: '65@vs',
    height: '65@vs',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: FBColorPalette.primary,
    borderWidth: 2,
  },
});
