export interface Invoice {
  creation: string;
  id?: string;
  name?: string;
  order_code: string;
  posting_date: string;
  status: string;
  outstanding_amount: number;
  sales_invoice_erp_code?: string;
  sales_order?: string;
  customer_app_order_code?: string;
}

export interface MoneyAddedItem {
  id: string;
  payment_type: string;
  created_at: string;
  amount: number;
  transaction_details: string;
}

export interface Wallet {
  // Add properties of the wallet object here
  // For example:
  balance: number;
  currency: string;
}

export type TabType = 'moneyAdded' | 'invoices';

export interface PendingInvoices {
  invoice: Invoice[];
  overdueInvoice: Invoice[];
}

export const failedEzPaymentStatus = [
  'failure',
  'userCancelled',
  'dropped',
  'bounced',
  'pending',
];
