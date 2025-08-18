// depedencies
import React, {useCallback} from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';

// components
import {Button, Divider, Text, TextButton} from '@/components';

//actions
import {getBusinessRole} from '@/utils/general';

//types
import {FBBorders} from '@/types/styles';
import {
  FetchAllOrgUsersByTypeQuery,
  Organization_User,
} from '@/generated/graphql';

type Props = {
  orgUser:
    | FetchAllOrgUsersByTypeQuery['organization_user'][0]
    | Organization_User;
  switchToOrg: (
    orgUser:
      | Organization_User
      | FetchAllOrgUsersByTypeQuery['organization_user'][0],
  ) => void;
  closeBottomSheet: () => void;
};

const BusinessCard: React.FC<Props> = ({
  orgUser,
  switchToOrg,
  closeBottomSheet,
}) => {
  const navigation = useNavigation();

  const onOrderNow = useCallback(() => {
    switchToOrg(orgUser);
    navigation.navigate('delivery');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.businessCardContainer}>
      <Text weight="600">
        {orgUser?.organization?.name === 'default'
          ? `${orgUser?.user?.first_name} ${orgUser?.user?.last_name}`
          : orgUser?.organization?.name}
      </Text>
      <Divider height={8} />
      <Text size="sm" color="mediumGray" weight="300">
        {getBusinessRole(orgUser as Organization_User) === 'individual'
          ? 'Individual'
          : 'Business'}
      </Text>
      <Divider height={12} />
      <View style={styles.flexRow}>
        <Text size="sm" color="primary" weight="600">
          Available Balance: Rs.0
        </Text>
        <Button
          variant="outlined"
          onPress={onOrderNow}
          style={styles.orderNowBtn}>
          Order Now
        </Button>
      </View>
      <Divider height={12} />
      <View style={styles.flexRow}>
        <Text size="sm" weight="500">
          Total Orders: 00
        </Text>
        <TextButton
          onPress={() => {
            switchToOrg(orgUser);
            closeBottomSheet();
          }}
          textSize="xs"
          underline
          style={{marginRight: 8}}>
          Switch Profile
        </TextButton>
      </View>
    </View>
  );
};

export default BusinessCard;

const styles = ScaledSheet.create({
  businessCardContainer: {
    borderWidth: 1,
    borderColor: FBBorders.disabledInputText,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },

  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderNowBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});
