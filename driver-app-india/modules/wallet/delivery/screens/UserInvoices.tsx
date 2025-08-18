import {HeaderAvoidingContainer, SimpleBottomSheet} from '@/components';
import {
  // businessStore,
  walletStore,
} from '@/globalStore';
import {NoStats} from '@/modules/home/components/delivery';
import {View} from 'react-native';

import {
  InvoiceList,
  TabSelector,
  TotalSection,
} from '@/modules/wallet/components';
import {
  Invoice,
  MoneyAddedItem,
  PendingInvoices,
  TabType,
} from '@/modules/wallet/types';
// import {WalletService} from '@/services';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import InvoiceKnockoffForm from '../../components/InvoiceKnockoffForm';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {commonBottomSheetView} from '@/styles';
// import {DateTime} from 'luxon';

const UserInvoices: React.FC = () => {
  const navigation = useNavigation();

  // const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const currentWallet = walletStore.use.currentWallet();
  const userLedger = walletStore.use.userLedger() as MoneyAddedItem[];
  const pendingInvoices = walletStore.use.pendingInvoice() as PendingInvoices;

  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(
    new Set(),
  );
  const [totalSelectedAmount, setTotalSelectedAmount] = useState<number>(0);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  // Create a set of sales order numbers for overdue invoices
  // Create a filtered list of invoices that are not overdue
  // Combine the filtered list with the overdue invoices
  // Add the order code and sales invoice erp code to the invoices
  // Set the filtered invoices and selected invoices to state
  useEffect(() => {
    if (
      !pendingInvoices?.invoice ||
      !pendingInvoices?.overdueInvoice ||
      !pendingInvoices
    ) {
      setFilteredInvoices([]);
      return;
    }
    const overdueSalesOrders = new Set(
      pendingInvoices.overdueInvoice.map(invoice => invoice.sales_order),
    );
    const filtered = pendingInvoices.invoice.filter(
      invoice => !overdueSalesOrders.has(invoice.sales_order),
    );
    const combinedInvoices = [...filtered, ...pendingInvoices.overdueInvoice];
    combinedInvoices.forEach(invoice => {
      const matchingPendingInvoice = pendingInvoices?.invoice?.find(
        pendingInvoice => pendingInvoice.sales_order === invoice.sales_order,
      );
      if (matchingPendingInvoice) {
        invoice.order_code =
          matchingPendingInvoice.customer_app_order_code ?? '';
        invoice.sales_invoice_erp_code =
          matchingPendingInvoice.sales_invoice_erp_code;
        invoice.creation = matchingPendingInvoice?.creation;
      }
    });

    const paidRemovedInvoices = combinedInvoices.filter(invoice => {
      return invoice?.status !== 'Paid';
    });

    const sortedInvoices = paidRemovedInvoices.sort((a, b) => {
      return new Date(a?.creation).getTime() - new Date(b?.creation).getTime();
    });

    setFilteredInvoices(sortedInvoices);
    setSelectedInvoices(new Set());
  }, [pendingInvoices]);

  useEffect(() => {
    const totalAmount = filteredInvoices.reduce((total, invoice, index) => {
      if (selectedInvoices.has(index)) {
        return total + invoice.outstanding_amount;
      }
      return total;
    }, 0);
    setTotalSelectedAmount(totalAmount);
  }, [selectedInvoices, filteredInvoices]);

  // used index to toggle the selected invoice because the sales_invoice_erp_code is not unique (it can be null)
  const toggleInvoiceSelection = (index: number) => {
    setSelectedInvoices(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return newSelected;
    });
  };

  useFocusEffect(
    useCallback(() => {
      walletStore.setState(prevState => ({
        ...prevState,
        pageVisitCount: 0,
      }));
    }, []),
  );

  const getSelectedInvoiceCodes = (): string[] => {
    const codes = Array.from(selectedInvoices)
      .map(index => filteredInvoices[index].sales_invoice_erp_code)
      .filter((code): code is string => code !== undefined);

    walletStore.setState(state => ({
      ...state,
      selectedInvoiceCodes: codes,
    }));

    return codes;
  };

  const handlePayNow = () => {
    openBottomSheet();
    getSelectedInvoiceCodes();
    return;
  };

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    return () => {
      setSelectedInvoices(new Set());
      setTotalSelectedAmount(0);
    };
  }, []);

  return (
    <HeaderAvoidingContainer>
      <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'invoices' ? (
        filteredInvoices?.length ? (
          <InvoiceList
            activeTab={activeTab}
            userLedger={userLedger}
            filteredInvoices={filteredInvoices}
            selectedInvoices={selectedInvoices}
            toggleInvoiceSelection={toggleInvoiceSelection}
          />
        ) : (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}>
            <NoStats
              noStatsText2="made any transactions"
              btnText="Add Money"
              onOrderNow={goBack}
            />
          </View>
        )
      ) : null}

      {activeTab === 'moneyAdded' ? (
        userLedger?.length ? (
          <InvoiceList
            activeTab={activeTab}
            userLedger={userLedger}
            filteredInvoices={filteredInvoices}
            selectedInvoices={selectedInvoices}
            toggleInvoiceSelection={toggleInvoiceSelection}
          />
        ) : (
          <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <NoStats
              noStatsText2="made any transactions"
              btnText="Add Money"
              onOrderNow={goBack}
            />
          </View>
        )
      ) : null}

      {activeTab === 'invoices' && totalSelectedAmount > 0 ? (
        <TotalSection
          totalSelectedAmount={totalSelectedAmount}
          onPayNow={handlePayNow}
        />
      ) : null}

      <SimpleBottomSheet
        snapPoints={['60%']}
        ref={bottomSheetRef}
        closeSheet={closeBottomSheet}>
        <BottomSheetView style={commonBottomSheetView}>
          <InvoiceKnockoffForm
            currentWallet={currentWallet}
            onClose={closeBottomSheet}
            receivedAmount={totalSelectedAmount}
          />
        </BottomSheetView>
      </SimpleBottomSheet>
    </HeaderAvoidingContainer>
  );
};

export default UserInvoices;
