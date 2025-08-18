// All custom types should be defined here

export type EaseBuzzResponseResult =
  | 'payment_successfull'
  | 'payment_failed'
  | 'txn_session_timeout'
  | 'back_pressed'
  | 'user_cancelled'
  | 'error_server_error'
  | 'error_noretry'
  | 'invalid_input_data'
  | 'retry_fail_error'
  | 'trxn_not_allowed'
  | 'bank_back_pressed';

export type EaseBuzzResponse = {
  result: EaseBuzzResponseResult;
  payment_response: {
    amount: string;
    unmappedstatus: string;
    error: string;
    error_Message: string;
    udf4: string;
    udf8: string;
    name_on_card: string;
    addedon: string;
    PG_TYPE: string;
    bank_ref_num: string;
    udf7: string;
    issuing_bank: string;
    key: string;
    txnid: string;
    hash: string;
    email: string;
    udf2: string;
    deduction_percentage: string;
    udf1: string;
    bank_name: string;
    firstname: string;
    mode: string;
    phone: string;
    udf9: string;
    bankcode: string;
    udf6: string;
    cardnum: string;
    surl: string;
    cardCategory: string;
    cash_back_percentage: string;
    furl: string;
    cancellation_reason: string;
    udf5: string;
    upi_va: string;
    udf3: string;
    status: string;
    merchant_logo: string;
    net_amount_debit: string;
    easepayid: string;
    productinfo: string;
    card_type: string;
    payment_source: string;
    udf10: string;
  };
};

export interface Coords {
  lat: number;
  lng: number;
}

export interface SimpleAddress {
  formattedAddress: string;
  place_id: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  coordinates: Coords;
}
