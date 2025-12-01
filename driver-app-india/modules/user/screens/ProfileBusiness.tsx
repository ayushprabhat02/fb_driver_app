import React, {useEffect} from 'react';
import {ScrollView, View} from 'react-native';

import {ScaledSheet} from 'react-native-size-matters';

// store
import userStore from '../store';
import {authStore} from '@/globalStore';

// services
import userService from '../services';

// components
import {Avatar, Divider, HeaderAvoidingContainer, Text} from '@/components';

// types & styles
import {FBBorders, FBColorPalette} from '@/types/styles';

const Profile: React.FC = () => {
  // Get user profile from userStore (GraphQL data)
  const loggedInUser = userStore.use.loggedInUser();

  // Get Firebase user for email
  const firebaseUser = authStore.use.firebaseUser();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await userService.fetchMyProfile();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (!loggedInUser) {
      fetchProfile();
    }
  }, [loggedInUser]);

  return (
    <HeaderAvoidingContainer>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}>
        <Avatar
          variant="rounded"
          buttonStyle={styles.avatarStyle}
          buttonTextSize="4xl"
          fullName={[loggedInUser?.first_name, loggedInUser?.last_name]
            .filter(Boolean)
            .join(' ')}
        />
        <View style={styles.form}>
          <View>
            <Text size="sm" weight="500" color="steelBlue">
              First Name
            </Text>
            <Divider height={4} />
            <View style={styles.credentials}>
              <Text color="disabledInputText">
                {loggedInUser?.first_name || ''}
              </Text>
            </View>
          </View>
          <Divider height={16} />
          <View>
            <Text size="sm" weight="500" color="steelBlue">
              Last Name
            </Text>
            <Divider height={4} />
            <View style={styles.credentials}>
              <Text color="disabledInputText">
                {loggedInUser?.last_name || ''}
              </Text>
            </View>
          </View>

          <Divider height={16} />
          <View>
            <Text size="sm" weight="500" color="steelBlue">
              Mobile Number
            </Text>
            <Divider height={4} />
            <View style={styles.credentials}>
              <Text color="disabledInputText">
                {loggedInUser?.phone_number || ''}
              </Text>
            </View>
          </View>
          <Divider height={16} />
          <View>
            <Text size="sm" weight="500" color="steelBlue">
              Email
            </Text>
            <Divider height={4} />
            <View style={styles.credentials}>
              <Text color="disabledInputText">
                {firebaseUser?.email || ''}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </HeaderAvoidingContainer>
  );
};

export default Profile;

const styles = ScaledSheet.create({
  avatarStyle: {
    width: '100@vs',
    height: '100@vs',
    borderRadius: 100,
  },

  form: {width: '100%', marginTop: 20},

  credentials: {
    backgroundColor: FBColorPalette.input,
    borderWidth: 1,
    borderColor: FBBorders.input, // Replace with the image border color
    borderRadius: 8, // Adjust if corners are rounded
    padding: 10,
    height: 40,
    justifyContent: 'center',
    paddingVertical: 0,
  },
});
