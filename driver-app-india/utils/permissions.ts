// dependencies
import {
  requestMultiple,
  Permission,
  PermissionStatus,
} from 'react-native-permissions';

type PermissionResults = Partial<Record<Permission, PermissionStatus>>;

export const checkPermissions = async (
  permissionsArray: Permission[],
): Promise<PermissionResults> => {
  try {
    const results = await requestMultiple(permissionsArray);

    const permissionStatuses: PermissionResults = {};
    permissionsArray.forEach(permission => {
      permissionStatuses[permission] = results[permission];
    });

    return permissionStatuses;
  } catch (error) {
    console.error('Error checking permissions', error);
    throw new Error('Permission check failed');
  }
};
