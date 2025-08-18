import {useCallback} from 'react';
import {WalletService} from '@/services';
import {
  FetchAllOrgUsersByTypeQuery,
  Organization_User,
} from '@/generated/graphql';

/**
 * Represents an active delivery organization user.
 * It can be either an instance of `Organization_User`, the first element of `FetchAllOrgUsersByTypeQuery['organization_user']`,
 * or `undefined` if there is no active delivery organization user.
 */
type ActiveDeliveryOrgUser =
  | Organization_User
  | FetchAllOrgUsersByTypeQuery['organization_user'][0]
  | undefined;

/**
 * Custom hook to update the user's wallet data.
 * @param activeDeliveryOrgUser - The active delivery organization user.
 * @returns The updateWalletData function.
 */
export const useWalletUpdate = (
  activeDeliveryOrgUser: ActiveDeliveryOrgUser,
) => {
  const updateWalletData = useCallback(() => {
    if (!activeDeliveryOrgUser) return;

    WalletService.getUserWallet({
      organization_user_id: activeDeliveryOrgUser.id,
    });

    WalletService.getUserLedger({
      limit: 1000,
      offset: 0,
      where: {
        organization_user_id: {
          _eq: activeDeliveryOrgUser.id,
        },
        payment_type: {},
        _or: [
          {
            invoice: {
              customer_order: {
                order_date: {},
                state: {},
              },
            },
          },
          {
            invoice_id: {
              _is_null: true,
            },
          },
        ],
      },
    });

    WalletService.fetchPendingInvoice({
      object: {
        organization_id: activeDeliveryOrgUser.organization_id,
      },
    });
  }, [activeDeliveryOrgUser]);

  return updateWalletData;
};
