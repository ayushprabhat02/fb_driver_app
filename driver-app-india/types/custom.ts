export interface RouteTitles {
  name: string;
  title: string;
}

export interface SafetyChecklistObject {
  customer_order_item_id: string;
  is_active: boolean;
  key: string;
  value: string;
  safety_checklist_id: string;
}
export interface FillupSafetyChecklistObject {
  task_id: string;
  is_active: boolean;
  key: string;
  value: string;
  safety_checklist_id: string;
}
export interface SafetyChecklistItem {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
}

export interface FillupRequest {
  state: string;
  is_done_locally: boolean;
  category: string;
  fillup_requests: FillupRequestItem[];
  customer_order: null;
  id: string;
  driver_vehicle_id: string;
  organization_address: null;
}

export interface FillupRequestItem {
  driver_vehicle_id: string;
  fuel_request_type: string;
  id: string;
  is_active: boolean;
  product_variation_id: null | string;
  quantity: number;
  state: string;
  task_id: string;
  unit: string;
  created_at: string;
  driver_vehicle: {
    driver_id: string;
    is_active: boolean;
    user: {
      first_name: string;
      last_name: string;
      license_number: string;
      middle_name: string;
      pan_number: null | string;
      phone_number: string;
      referral_code: null | string;
    };
    vehicle: {
      created_at: string;
      category: string;
      id: string;
      insurance_expire_date: string;
      fuel_tank_capacity: number;
      model: string;
      name: string;
      partner_address_id: null;
      location: null;
      tanker_capacity: number;
      registration_number: string;
      rc_expire_date: string;
      rfid: null;
      tanker_compartment_number: number;
      year: string;
      device_id: null;
      description: null;
      partner_address: null;
    };
  };
  vehicle_tank_type_product_variation: {
    vehicle_tank_type_id: string;
    vehicle_tank_type: {
      id: string;
      vehicle_id: string;
      vehicle: {
        category: string;
        description: null;
        device_id: null;
        fuel_tank_capacity: number;
        id: string;
        insurance_expire_date: string;
        is_active: boolean;
        is_mothership: boolean;
        name: string;
        model: string;
        location: null;
      };
      tank_type: {
        description: string;
        id: string;
        is_active: boolean;
        name: string;
        slug: string;
      };
    };
    product_variation: {
      expiry_date: null;
      id: string;
      is_active: boolean;
      product: {
        name: string;
        id: string;
        hsn_code: string;
        sku: string;
        product_type: string;
      };
      variation: {
        id: string;
        pack_size: string;
      };
    };
  };
}

export interface CustomerOrder {
  state: string;
  is_done_locally: boolean;
  category: string;
  fillup_requests: [];
  customer_order: {
    order_code: number;
    organization_user: {
      user: {
        middle_name: string;
        first_name: string;
        last_name: string;
        pan_number: string;
        phone_number: string;
        description: null;
      };
      user_id: string;
    };
    customer_order_items: CustomerOrderItem[];
    delivery_fee: number;
    delivery_preference: string;
    id: string;
    description: string;
    order_date: string;
    name: string;
    is_prepaid: boolean;
    is_active: boolean;
    customer_order_customer_assets: CustomerOrderCustomerAsset[];
  };
  id: string;
  driver_vehicle_id: string;
  organization_address: {
    house_number: string;
    address_line1: string;
    address_line2: string;
    city_id: string;
    country: {
      alpha_code2: string;
      alpha_code3: string;
      id: string;
      name: string;
      numeric_code_id: number;
      official_state: string;
    };
    state: {
      name: string;
    };
    country_id: string;
  };
}

export interface CustomerOrderItem {
  actual_amount: number;
  actual_delivery_date: string;
  actual_qty: number;
  amount: number;
  id: string;
  delivery_fee: number;
  estimate_delivery_date: string;
  qty: number;
  service_tax: number;
  state: string;
  product_variation_id: string;
  product_variation: {
    expiry_date: null;
    id: string;
    is_active: boolean;
    price: string;
    product_id: string;
    product: {
      category_id: string;
      description: string;
      hsn_code: string;
      id: string;
      is_active: boolean;
      name: string;
      sku: string;
      slug: string;
      product_type: string;
    };
    variation: {
      description: string;
      id: string;
      pack_size: string;
      is_active: boolean;
      slug: string;
      variation_type: string;
    };
  };
}

export interface CustomerOrderCustomerAsset {
  customer_asset: {
    asset_type_id: string;
    capacity: string;
    color: string;
    id: string;
    description: string;
    organization_user_id: string;
    name: string;
  };
}

export interface Asset {
  asset_type_id: string;
  capacity: string;
  color: string;
  id: string;
  is_active: boolean;
  description: string;
  organization_user_id: string;
  name: string;
  slug: string;
  tag_id: string;
}

export interface CustomerAsset {
  tag_id: string | null;
  asset_type_id: string;
  capacity: string;
  color: null;
  id: string;
  description: string;
  organization_user_id: string;
  name: string;
}
export interface CustomerAssetWithQuantityDispensed {
  quantity_requested?: number | null;
  quantity_dispensed?: number | null;
  customer_asset: CustomerAsset;
}

export interface FillupAsset extends FilledAsset {
  vehicle_id: string;
}
export interface FilledAsset {
  quantity_dispensed?: number | null;
  customer_asset_id?: string;
  id: string | null | undefined;
  key: string;
  task_id: string;
  url: string;
  value: string;
}

export interface TankType {
  name: string;
  id: string;
  is_active: boolean;
  slug?: string;
}

export interface Vehicle {
  name: string;
  location: string | null;
  fuel_tank_capacity: number;
  id: string;
}

export interface Product {
  id: string;
  is_active: boolean;
  hsn_code: string;
  description: string;
}

export interface Variation {
  description: string;
  id: string;
  is_active: boolean;
  pack_size: string;
  slug?: string;
  variation_type?: string;
}

export interface VehicleTankType {
  tank_type: TankType;
  vehicle: Vehicle;
}

export interface ProductVariation {
  expiry_date?: string | null;
  id?: string;
  price?: string;
  product_id?: string;
  variation_id?: string;
  product?: Product;
  variation: Variation;
}

export interface PartnerAddress {
  address_line1: string;
  address_line2: string;
  city_id: string;
  country_id: string | null;
  id: string;
  is_active: boolean;
  landMark: string | null;
  house_number: string;
}

export interface PartnerOrder {
  affiliation_amount: number;
  affiliation_user_id: string | null;
  amount: number;
  amount_paid: number;
  amount_to_be_paid: number;
  partner_address: PartnerAddress;
}

export interface FuelRequest {
  quantity: number;
  quantity_approved: number;
  id: string;
  is_active: boolean;
  state: string;
  vehicle_tank_type_product_variation: {
    vehicle_tank_type: VehicleTankType;
    product_variation: ProductVariation;
  };
  fuel_request_type: string;
  partner_order: PartnerOrder;
  task: object | null;
}

export interface VehicleTankTypeProductVariation {
  id: string;
  product_variation: ProductVariation;
}

export interface TankTypeDetails {
  tank_type: TankType;
  tank_type_id: string;
  vehicle_tank_type_product_variations: VehicleTankTypeProductVariation[];
}

export interface Test {
  description: string;
  id: string;
  is_active: boolean;
  name: string;
  sequence: number;
  slug: string;
}
export interface TestCategory {
  id: string;
  is_active: boolean;
  tests: Test[];
  slug: string;
  name: string;
}
export interface ProductVariationTest {
  product_variation_id: string;
  test_category: TestCategory;
}
export interface ImageData {
  src?: string;
  storeUrl?: string | null;
}
