import {CustomerAssetQuery} from '@/generated/graphql';

export type ActiveBottomSheetComponents = 'AddBillingAddress' | 'OTPConfirm';
export type PaymentMethods =
  | 'fb-wallet'
  | 'online'
  | 'POD'
  | 'COD'
  | 'icici_cobranded_card'
  | 'axis_cobranded_card';

export type Slot = {
  title: string;
  value: string;
  description: string;
  partnerId: string;
  startTime: string;
  endTime?: string;
  expressDelivery?: boolean;
  expressDeliveryFee?: number | null;
  date?: string;
  is_visible?: boolean;
  is_active?: boolean;
};

export type SlotTime = {
  date: string;
  value: string;
  title: string;
  slots: Slot[];
};

export type SlotDate = {
  day: string;
  dayOfWeek: string;
  month: string;
  year: string;
  value: string;
};

export type AssetObject = {
  [key: string]: CustomerAssetQuery['customer_asset'];
};

export type AssetObjectList = {
  type: string;
  assetList: CustomerAssetQuery['customer_asset'];
};

export type BillingAddressBottomSheetView = 'select' | 'add';

export type SelectedProduct = {
  product: {
    name: string;
    qty: number;
    variation_id: string;
    salePrice: number;
    product_partner_localities_price_id: string;
  };
};
