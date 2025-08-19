import {MMKV} from 'react-native-mmkv';

export const localStorage = new MMKV();

export const getActiveDelOrgUserId = () =>
  localStorage.getString('deliveryOrgUserId');

export const setActiveDelOrgUserId = (id: string) =>
  localStorage.set('deliveryOrgUserId', id);

export const getActiveDelOrg = () => localStorage.getString('deliveryOrgId');
export const setActiveDelOrg = (id: string) =>
  localStorage.set('deliveryOrgId', id);

export const getDriverVehicleId = () => localStorage.getString('driverVehicleId');
export const setDriverVehicleId = (id: string) =>
  localStorage.set('driverVehicleId', id);
export const clearDriverVehicleId = () => localStorage.delete('driverVehicleId');
