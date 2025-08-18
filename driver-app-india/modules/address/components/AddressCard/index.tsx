// dependencies
import {Pressable, View} from 'react-native';
import React from 'react';
import {ScaledSheet} from 'react-native-size-matters';

// types
import {FetchAddressByTypeQuery} from '@/generated/graphql';
import {Divider, Text} from '@/components';
import {FBBackground, FBBorders} from '@/types/styles';

interface Props {
  address: FetchAddressByTypeQuery['organization_address'][0];
  onPress: () => void;
  disabled: boolean;
}

const AddressCard: React.FC<Props> = ({address, onPress, disabled}) => {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View>
        <Text style={{textTransform: 'capitalize'}} lines={1}>
          {address.name}
        </Text>
        <View style={styles.addressDetailsContainer}>
          <Text size="sm" weight="400">
            {address.address_line1}
          </Text>
          {/* address_line2 is optional, so we need to check if it exists before rendering it */}
          {address.address_line2 && (
            <Text size="sm" weight="400">
              {address.address_line2 || ''}
            </Text>
          )}
          {address?.gst_number ? (
            <>
              <Divider />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text size="sm" weight="600">
                  GST Number: {address?.gst_number}
                </Text>
                <View
                  style={{
                    backgroundColor: FBBackground.darkGreen,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 5,
                  }}>
                  <Text weight="600" size="sm" color="white">
                    With GST
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default AddressCard;

const styles = ScaledSheet.create({
  addressDetailsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: FBBorders.secondary,
    borderRadius: 10,
    marginTop: 8,
    minHeight: '80@vs',
    minWidth: '100%',
  },
});
