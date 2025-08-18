// dependencies
import React from 'react';
import {StyleSheet, View} from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

// components
import {Divider, Text} from '@/components';

// types
import {FBColors} from '@/types/styles';
import {Invoice} from '../types/index';

interface InvoiceItemProps {
  item: Invoice;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}

const InvoiceItem: React.FC<InvoiceItemProps> = ({
  item,
  isSelected,
  onToggle,
}) => {
  return (
    <View style={styles.itemContainer}>
      <View>
        <Text weight="bold" size="base">
          Order Code #{item.order_code || 'No Invoice'}
        </Text>
        <Divider height={6} />
        <Text size="sm" color="lightGray">
          {item?.creation ? item.sales_invoice_erp_code : '-'}
        </Text>
        <Divider height={8} />
        <Text
          size="sm"
          weight="bold"
          color={item.status === 'Paid' ? 'primary' : 'error'}>
          {item.status}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text size="base" color={item.status === 'Paid' ? 'primary' : 'error'}>
          ₹{item.outstanding_amount.toFixed(2)}
        </Text>
        <Divider width={10} />
        {item.status !== 'Paid' ? (
          <BouncyCheckbox
            isChecked={isSelected}
            disableBuiltInState
            onPress={onToggle}
            size={18}
            textStyle={{
              fontSize: 12,
              fontWeight: '400',
              color: FBColors.neutral,
            }}
            fillColor={FBColors.primary}
            unfillColor={FBColors.white}
            iconStyle={{borderRadius: 4}}
            innerIconStyle={{borderRadius: 4}}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default InvoiceItem;
