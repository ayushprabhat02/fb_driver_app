// dependencies
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';

// components
import {Divider, Text, TextButton} from '@/components';

// services
import {getBusinessRole} from '@/utils/general';

// store
import {businessStore} from '@/globalStore';

// types
import {FetchAllOrgUsersByTypeQuery} from '@/generated/graphql';
import {FBBackground, FBBorders} from '@/types/styles';

type Props = {
  orgUser: FetchAllOrgUsersByTypeQuery['organization_user'][0];
};

const BusinessListCard: React.FC<Props> = ({orgUser}) => {
  const navigation = useNavigation();

  const manageUsers = () => {
    businessStore.setState(state => ({
      ...state,
      currentOrgUserInView: orgUser,
    }));
    navigation.navigate('manage-users');
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
        <View style={{maxWidth: '80%'}}>
          <Text weight="600" lines={1}>
            {orgUser?.organization?.is_business
              ? orgUser?.organization?.name
              : `${orgUser?.user?.first_name || orgUser?.organization?.name} ${
                  orgUser?.user?.last_name
                }
              `}
          </Text>
          <Divider />
          <Text size="sm" weight="600" lines={1} color="mediumGray">
            {orgUser.organization?.organization_segmentation?.name}
          </Text>
        </View>
        <View style={styles.roleContainer}>
          <Text size="xs" color="primary">
            {getBusinessRole(orgUser)}
          </Text>
        </View>
      </View>
      <Divider height={20} />
      {orgUser?.role?.role !== 'user' &&
      getBusinessRole(orgUser) !== 'individual' ? (
        <TextButton
          textSize="sm"
          onPress={manageUsers}
          underline
          textColor="complementary">
          Manage users
        </TextButton>
      ) : null}
    </View>
  );
};

export default BusinessListCard;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 120,
  },

  roleContainer: {
    position: 'absolute',
    top: 0,
    right: 4,
    borderRadius: 100,
    borderWidth: 1,
    minWidth: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: FBBackground.pastelGreen,
    borderColor: FBBorders.complementary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
