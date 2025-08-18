// todo: make separate routes and components for MoneyAdded and Invoices
// dependencies
import React from 'react';
import {View, StyleSheet} from 'react-native';

// components
import {Button, Text} from '@/components';

// types
import {TabType} from '../types/index';
import {FBColors} from '@/types/styles';

interface TabSelectorProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({activeTab, setActiveTab}) => (
  <View style={styles.header}>
    <Button
      variant={activeTab === 'moneyAdded' ? 'solid' : 'outlined'}
      onPress={() => setActiveTab('moneyAdded')}
      style={[styles.tab, activeTab === 'moneyAdded' && styles.activeTab]}>
      <Text
        size="base"
        weight={activeTab === 'moneyAdded' ? '600' : 'normal'}
        color={activeTab === 'moneyAdded' ? 'white' : 'neutral'}>
        Money Added
      </Text>
    </Button>
    <Button
      variant={activeTab === 'invoices' ? 'solid' : 'outlined'}
      onPress={() => setActiveTab('invoices')}
      style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}>
      <Text
        size="base"
        weight={activeTab === 'invoices' ? '600' : 'normal'}
        color={activeTab === 'invoices' ? 'white' : 'neutral'}>
        Pending Invoices
      </Text>
    </Button>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: FBColors.white,
    padding: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: FBColors.primary,
  },
});

export default TabSelector;
