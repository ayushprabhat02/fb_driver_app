// todo: make separate screens and components for MoneyAddedItem and InvoiceItem

// dependencies
import React from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet} from 'react-native';

// components
import {InvoiceItem, MoneyAddedItem} from './index';

// types
import {
  Invoice,
  MoneyAddedItem as MoneyAddedItemType,
  TabType,
} from '../types/index';

interface InvoiceListProps {
  activeTab: TabType;
  userLedger: MoneyAddedItemType[];
  filteredInvoices: Invoice[];
  selectedInvoices: Set<number>;
  toggleInvoiceSelection: (index: number) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  activeTab,
  userLedger,
  filteredInvoices,
  selectedInvoices,
  toggleInvoiceSelection,
}) => {
  const renderItem = ({
    item,
    index,
  }: ListRenderItemInfo<Invoice | MoneyAddedItemType>) => {
    if (activeTab === 'moneyAdded') {
      return <MoneyAddedItem item={item as MoneyAddedItemType} />;
    } else {
      return (
        <InvoiceItem
          item={item as Invoice}
          index={index}
          isSelected={selectedInvoices.has(index)}
          onToggle={() => toggleInvoiceSelection(index)}
        />
      );
    }
  };

  return (
    <FlatList
      data={
        activeTab === 'moneyAdded'
          ? userLedger.filter(
              ledgerItem =>
                !ledgerItem.transaction_details.includes('CANCELLED'),
            )
          : filteredInvoices
      }
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        (item as Invoice).id || (item as Invoice).name || `invoice-${index}`
      }
      contentContainerStyle={styles.listContent}
    />
  );
};
const styles = StyleSheet.create({
  listContent: {
    padding: 15,
  },
});
export default InvoiceList;
