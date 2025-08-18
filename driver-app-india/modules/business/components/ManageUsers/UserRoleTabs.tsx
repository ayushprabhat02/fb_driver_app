// dependencies
import {Pressable, StyleSheet, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

// types and styles
import {UserRoleForInvitation} from '../../types';
import {FBBackground, FBBorders} from '@/types/styles';

type Props = {
  selectedUserRole: UserRoleForInvitation;
  setSelectedUserRole: React.Dispatch<
    React.SetStateAction<UserRoleForInvitation>
  >;
};

const roles: UserRoleForInvitation[] = ['owner', 'user'];

const UserRoleTabs: React.FC<Props> = ({
  selectedUserRole,
  setSelectedUserRole,
}) => {
  return (
    <View>
      <Text weight="600">User Role</Text>
      <Divider />
      <View
        style={{
          flexDirection: 'row',
          columnGap: 10,
        }}>
        {roles.map(role => {
          return (
            <Pressable
              onPress={() => setSelectedUserRole(role)}
              style={[
                styles.tabContainer,
                {
                  borderWidth: 1,
                  borderColor:
                    selectedUserRole === role
                      ? FBBorders.complementary
                      : FBBorders.secondary,
                  backgroundColor:
                    selectedUserRole === role
                      ? FBBackground.pastelGreen
                      : FBBackground.white,
                },
              ]}
              key={role}>
              <Text
                style={{textTransform: 'capitalize'}}
                color={selectedUserRole === role ? 'primary' : 'neutral'}
                weight="600">
                {role}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Divider />
    </View>
  );
};

export default UserRoleTabs;

const styles = StyleSheet.create({
  tabContainer: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    width: 80,
    alignItems: 'center',
  },
});
