// dependencies
import {View} from 'react-native';
import React from 'react';
import {ScaledSheet} from 'react-native-size-matters';

// store
import {userStore} from '@/globalStore';

// components
import {Text} from '@/components';
import {FBBackground, FBColorPalette} from '@/types/styles';

// types
import {FetchUserProfileQuery} from '@/generated/graphql';

const SettingsHeader: React.FC = () => {
  const loggedInUser = userStore.use.loggedInUser();

  return (
    <View style={styles.headerContainer}>
      <View style={{flexDirection: 'row', columnGap: 12}}>
        <SettingsAvatar
          user={loggedInUser?.length ? loggedInUser[0] : undefined}
        />
        <View>
          <Text color="white" weight="600" size="lg" lines={1}>
            {loggedInUser?.length
              ? `${loggedInUser[0].first_name} ${
                  loggedInUser[0]?.last_name || ''
                }`
              : ''}
          </Text>
          <Text color="white" weight="600" size="sm" style={{marginTop: 8}}>
            {loggedInUser?.length ? loggedInUser[0].phone_number : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

interface SettingsAvatarProps {
  user: FetchUserProfileQuery['user'][0] | undefined;
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
