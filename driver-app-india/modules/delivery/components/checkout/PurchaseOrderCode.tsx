// dependencies
import {StyleSheet, View, TextInput} from 'react-native';
import React from 'react';
import {TagChevron} from 'phosphor-react-native';

// components
import {Divider, Text} from '@/components';

// store
import deliveryStore from '../../store';

// styles & types
import {FBBackground} from '@/types/styles';
import {commonInputStyles} from '@/styles';
import {orderStore} from '@/globalStore';

const PurchaseOrderCode: React.FC = () => {
  const purchaseOrderCode = deliveryStore.use.purchaseOrderCode();
  const isUpComingOrderVerify = orderStore.use.upcomingOrdersVerify();

  const onChange = (text: string) => {
    deliveryStore.setState(state => ({
      ...state,
      purchaseOrderCode: text,
    }));
  };

  return (
    <View style={styles.container}>
      <TagChevron size={24} />
      <View style={{width: '90%'}}>
        <Text weight="600">Purchase order number</Text>
        <Divider />
        <TextInput
          editable={!isUpComingOrderVerify ? true : false}
          maxLength={25}
          onChangeText={onChange}
          value={purchaseOrderCode}
          style={{
            ...commonInputStyles,
            height: 40,
            width: '100%',
            backgroundColor: FBBackground.white,
          }}
        />
      </View>
    </View>
  );
};

export default PurchaseOrderCode;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    columnGap: 10,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: FBBackground.softBlue,
  },
});
