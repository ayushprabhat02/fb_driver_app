// dependencies
import {Dimensions, Pressable, View} from 'react-native';
import React from 'react';

// components
import {Divider, Text} from '@/components';

// imports
import BusinessAvatar1 from '@/assets/business/business-avatar-1.svg';
// import BusinessAvatar2 from '@/assets/business/business-avatar-2.svg';

// types
import {
  FetchAllOrgUsersByTypeQuery,
  Organization_User,
} from '@/generated/graphql';

interface BusinessAvatarProps {
  item: FetchAllOrgUsersByTypeQuery['organization_user'][0];
  switchToOrg: (
    orgUser:
      | Organization_User
      | FetchAllOrgUsersByTypeQuery['organization_user'][0],
  ) => void;
}

const BusinessAvatar: React.FC<BusinessAvatarProps> = ({item, switchToOrg}) => {
  return (
    <Pressable
      onPress={() => switchToOrg(item)}
      style={{
        width: Dimensions.get('window').width * 0.45,
        alignItems: 'center',
        marginBottom: 20,
      }}>
      <BusinessAvatar1 />
      <Divider />
      <View style={{alignItems: 'center'}}>
        <Text size="sm" weight="600" style={{textAlign: 'center'}}>
          {item?.organization?.is_business
            ? item?.organization?.name
            : `${item?.user?.first_name || item?.organization?.name} ${
                item?.user?.last_name
              }
(individual)
              `}
        </Text>
      </View>
    </Pressable>
  );
};

export default BusinessAvatar;
