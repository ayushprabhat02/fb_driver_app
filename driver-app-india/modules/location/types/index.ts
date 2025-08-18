export type AddressComponents = {
  formattedAddress: string;
  place_id: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};
