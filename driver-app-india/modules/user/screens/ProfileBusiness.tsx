import React from 'react';
import {ScrollView, View} from 'react-native';

import {ScaledSheet} from 'react-native-size-matters';

// store
// import {businessStore} from '@/globalStore'; // Business module deleted

// components
import {Avatar, Divider, HeaderAvoidingContainer, Text} from '@/components';

// types & styles

import {FBBorders, FBColorPalette} from '@/types/styles';

const Profile: React.FC = () => {
  // const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser(); // Business module deleted
  const activeDeliveryOrgUser = null; // Mock for deleted business module

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
          fullName={`${activeDeliveryOrgUser?.organization?.name}`}
        />
        <View style={styles.form}>
          <View>
            <Text size="sm" weight="500" color="steelBlue">
              First Name
            </Text>
            <Divider height={4} />
            <View style={styles.credentials}>
              <Text color="disabledInputText">
                {`${activeDeliveryOrgUser?.user?.first_name} ${activeDeliveryOrgUser?.user?.last_name}`}
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
                {`${activeDeliveryOrgUser?.user?.first_name} ${activeDeliveryOrgUser?.user?.last_name}`}
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
                {
                  activeDeliveryOrgUser?.organization
                    ?.technical_contact_phone_number
                }
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
                {`${activeDeliveryOrgUser?.user?.email || ''}`}
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
