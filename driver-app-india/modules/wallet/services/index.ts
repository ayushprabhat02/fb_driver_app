/**
 * @module Wallet
 * @description This is the service file for the wallet module.
 */

// dependencies
import {callQuery, callMutation} from '@/utils/client';
import Toast from 'react-native-toast-message';

// store
import walletStore from '../store';

// graphql-documents
import {
  // user wallet
  FetchSingleUserWalletDocument,
  FetchSingleUserWalletQuery,
  FetchSingleUserWalletQueryVariables,
  CheckWalletAmountExistMutationVariables,
  CheckWalletAmountExistMutation,
  CheckWalletAmountExistDocument,

  // user ledger
  FetchUserLedgerOrgIdDocument,
  FetchUserLedgerOrgIdQuery,
  FetchUserLedgerOrgIdQueryVariables,

  // easebuzz client secret
  FetchEasebuzzClientSecretDocument,
  FetchEasebuzzClientSecretMutation,
  FetchEasebuzzClientSecretMutationVariables,

  // verify wallet topup
  VerifyWalletTopupDocument,
  VerifyWalletTopupMutation,
  VerifyWalletTopupMutationVariables,

  // pay for order via wallet
  PayForOrderViaWalletDocument,
  PayForOrderViaWalletMutation,
  PayForOrderViaWalletMutationVariables,

  // invoices
  PendingInvoicesMutation,
  PendingInvoicesDocument,
  PendingInvoicesMutationVariables,
  FetchAllOrgUsersByTypeQuery,

  // Org User
  Organization_User,

  // payment cards
  FetchPaymentCardsByOrgUserIdDocument,
  FetchPaymentCardsByOrgUserIdQuery,
  FetchPaymentCardsByOrgUserIdQueryVariables,

  // ICICI card
  IciciCoBrandedCardsPaymentInputDocument,
  IciciCoBrandedCardsPaymentInputMutation,
  IciciCoBrandedCardsPaymentInputMutationVariables,
  IciciCoBrandedCardsPaymentVerifyDocument,
  IciciCoBrandedCardsPaymentVerifyMutation,
  IciciCoBrandedCardsPaymentVerifyMutationVariables,

  // Axis card
  AxisBankPaymentDocument,
  AxisBankPaymentMutation,
  AxisBankPaymentMutationVariables,
  AxisBankCobrandedPaymentVerifyMutationVariables,
  AxisBankCobrandedPaymentVerifyMutation,
  AxisBankCobrandedPaymentVerifyDocument,
} from '@/generated/graphql';
import {EaseBuzzResponse} from '@/types/custom';

// @ts-ignore
import EasebuzzCheckout from 'react-native-easebuzz-kit';
import {failedEzPaymentStatus} from '../types';
import {getActiveDelOrg, getActiveDelOrgUserId} from '@/utils/localStorage';

type InitiatePaymentArgs = {
  activeDeliveryOrgUser:
    | Organization_User
    | FetchAllOrgUsersByTypeQuery['organization_user'][0]
    | undefined;
  walletId: string;
  amount: string;
  selectedInvoiceCodes?: string[];
};

/**
 * @class WalletService
 * @description This class represents the service for the address module.
 */
class WalletService {
  private static instance: WalletService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the WalletService class.
   * @returns {WalletService} The singleton instance of the WalletService class.
   */
  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * @method getUserWallet
   * @description Retrieves the active user's wallet details
   * @args FetchSingleUserWalletQueryVariables
   */

  public async getUserWallet(args: FetchSingleUserWalletQueryVariables) {
    const response: FetchSingleUserWalletQuery = await callQuery({
      queryDocument: FetchSingleUserWalletDocument,
      variables: {
        ...args,
      },
    });

    walletStore.setState(state => ({
      ...state,
      currentWallet: response.checkWalletBalance,
    }));
    return response.checkWalletBalance;
  }

  /**
   * @method getUserLedger
   * @description Retrieves the active user's wallet ledger
   * @args FetchUserLedgerQueryVariables
   */
  public async getUserLedger(args: FetchUserLedgerOrgIdQueryVariables) {
    const currentUserLedger = walletStore.getState()?.userLedger;
    const response: FetchUserLedgerOrgIdQuery = await callQuery({
      queryDocument: FetchUserLedgerOrgIdDocument,
      variables: {
        ...args,
      },
    });
    const existingUserLedger = currentUserLedger;
    const fetchedUserLedger = response.user_ledger.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const mergedLedger = [
      ...existingUserLedger,
      ...fetchedUserLedger.filter(
        ledger =>
          !existingUserLedger?.some(
            existingLedger => existingLedger.id === ledger.id,
          ),
      ),
    ];

    const maxCount = response.user_ledger_aggregate.aggregate?.count as number;
    const totalFetchedCount = mergedLedger.length;
    walletStore.setState(state => ({
      ...state,
      userLedger: mergedLedger,
      userLedgerCnt: maxCount,
      userLedgerHasMoreItems:
        fetchedUserLedger.length === 0 || totalFetchedCount >= maxCount
          ? false
          : true,
    }));

    return response.user_ledger;
  }

  /**
   * @method getEasebuzzClientSecret
   * @description Retrieves the easebuzz client secret used to initiate a wallet topup via easebuzz
   * @args FetchEasebuzzClientSecretMutationVariables
   */
  public async getEasebuzzClientSecret(
    args: FetchEasebuzzClientSecretMutationVariables,
  ) {
    const response: FetchEasebuzzClientSecretMutation = await callMutation({
      queryDocument: FetchEasebuzzClientSecretDocument,
      variables: {...args},
    });

    return response.walletEasebuzzTopup;
  }

  /**
   * @method initiatePayment
   * @description Initiates a payment using the Easebuzz payment gateway.
   * @param walletId - The ID of the wallet to be used for the payment.
   * @param amount - The amount to be paid.
   * @param selectedInvoiceCodes - The selected invoice codes (optional).
   * @returns {Promise<boolean>} - A promise that resolves to true if the payment is successful, otherwise false.
   */

  public async initiatePayment(
    args: InitiatePaymentArgs,
    // walletId: string,
    // amount: string,
    // selectedInvoiceCodes?: string[],
  ): Promise<boolean> {
    try {
      const response = await this.getEasebuzzClientSecret({
        object: {
          wallet_id: args.walletId,
          amount: parseFloat(args.amount),
          request_flow: null,
        },
      });

      const options = {
        access_key: response?.client_secret,
        pay_mode: 'production',
      };

      const data: EaseBuzzResponse = await EasebuzzCheckout.open(options);

      if (data.result === 'payment_successfull') {
        await this.verifyWalletTopup({
          object: {
            amount: parseFloat(data.payment_response.amount),
            wallet_transaction_id: response?.wallet_transaction_id,
            card_type: data?.payment_response.card_type,
            mode: data.payment_response.mode,
            payment_source: data.payment_response.payment_source,
            pg_type: data.payment_response.PG_TYPE,
            sales_invoice: args.selectedInvoiceCodes ?? [],
          },
        }).then(() => {
          Toast.show({
            type: 'success',
            text1: 'Wallet Topup Successful',
            text2: 'Amount added to your wallet',
          });
        });

        if (args.activeDeliveryOrgUser) {
          this.updateWalletData(args.activeDeliveryOrgUser, () => {});
          // useWalletUpdate(activeDeliveryOrgUser);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Updating Wallet Failed',
            text2: 'Organization User ID is not Valid.',
          });
        }

        return true;
      } else if (failedEzPaymentStatus.includes(data.result)) {
        setTimeout(async () => {
          await this.verifyWalletTopup({
            object: {
              amount: parseFloat(data.payment_response.amount),
              wallet_transaction_id: response?.wallet_transaction_id,
              card_type: data?.payment_response.card_type,
              mode: data.payment_response.mode,
              payment_source: data.payment_response.payment_source,
              pg_type: data.payment_response.PG_TYPE,
              sales_invoice: [],
            },
          }).then(() => {
            Toast.show({
              type: 'success',
              text1: 'Wallet Topup Successful',
              text2: 'Amount added to your wallet',
            });
          });

          await this.getUserWallet({
            organization_user_id: getActiveDelOrgUserId(),
          });

          await this.getUserLedger({
            limit: 10,
            offset: 0,
            where: {
              organization_user_id: {
                _eq: getActiveDelOrgUserId(),
              },
            },
          });

          await this.fetchPendingInvoice({
            object: {
              organization_id: getActiveDelOrg(),
            },
          });
        }, 5000);

        return true;
      } else {
        Toast.show({
          type: 'error',
          text1: 'Wallet Topup Failed',
          text2: 'Please try again',
          visibilityTime: 5000,
        });
        return false;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Wallet Topup Failed',
        text2: 'Something went wrong. Please try again.',
        visibilityTime: 5000,
      });
      return false;
    }
  }

  /**
   * @method verifyWalletTopup
   * @description Verifies the wallet topup transaction after payment via easebuzz
   * @args
   */
  public async verifyWalletTopup(args: VerifyWalletTopupMutationVariables) {
    const response: VerifyWalletTopupMutation = await callMutation({
      queryDocument: VerifyWalletTopupDocument,
      variables: {...args},
    });

    return response.walletEasebuzzTopupVerify;
  }

  /**
   * Function to pay for an order via wallet
   * This function is to be called after creating a delivery order for proper delivery order flow
   * @param args
   */
  public async payForOrderViaWallet(
    args: PayForOrderViaWalletMutationVariables,
  ) {
    const response: PayForOrderViaWalletMutation = await callMutation({
      queryDocument: PayForOrderViaWalletDocument,
      variables: {...args},
    });

    return response.payThroughWallet;
  }

  /**
   * Fetches pending invoices from the server.
   * @method fetchPendingInvoice
   * @param args - The variables for the pending invoices mutation.
   * @description Retrieves the pending invoices for the Postpaid Customers.
   * @returns Pending Invoices at the organisation level.
   */
  public async fetchPendingInvoice(args: PendingInvoicesMutationVariables) {
    const response: PendingInvoicesMutation = await callMutation({
      queryDocument: PendingInvoicesDocument,
      variables: {...args},
    });

    walletStore.setState(state => ({
      ...state,
      pendingInvoice: response.fetchPostpaidInvoice,
    }));

    return response.fetchPostpaidInvoice;
  }

  /**
   * Checks if the block amount exists.
   * @param args - The variables for the mutation.
   * @returns The response of the mutation.
   */
  public async checkWalletAmountExist(
    args: CheckWalletAmountExistMutationVariables,
  ) {
    const response: CheckWalletAmountExistMutation = await callMutation({
      queryDocument: CheckWalletAmountExistDocument,
      variables: {
        ...args,
      },
    });

    walletStore.setState(state => ({
      ...state,
      deliveryWalletAmountExists: response.checkWalletAmountExits
        ?.is_amount_available as boolean,
    }));

    return response;
  }

  /**
   * @method payOnline
   * @description Initiates a payment using the Easebuzz payment gateway.
   * @param amount - The amount to be paid.
   * @param order_id - The ID of the order.
   * @returns {Promise<boolean>} - A promise that resolves to true if the payment is completed successfully, otherwise false.
   */
  public async payOnline(amount: string, order_id: string): Promise<boolean> {
    try {
      const response = await this.getEasebuzzClientSecret({
        object: {
          wallet_id: walletStore.getState().currentWallet?.wallet_id,
          amount: parseFloat(amount),
          request_flow: null,
        },
      });

      const options = {
        access_key: response?.client_secret,
        pay_mode: 'production',
      };

      const data: EaseBuzzResponse = await EasebuzzCheckout.open(options);

      if (data.result === 'payment_successfull') {
        await this.verifyWalletTopup({
          object: {
            amount: parseFloat(data.payment_response.amount),
            wallet_transaction_id: response?.wallet_transaction_id,
            card_type: data?.payment_response.card_type,
            mode: data.payment_response.mode,
            payment_source: data.payment_response.payment_source,
            pg_type: data.payment_response.PG_TYPE,
            sales_invoice: [],
          },
        });

        await this.payForOrderViaWallet({
          amount: amount,
          order_id: order_id,
          wallet_id: walletStore.getState().currentWallet?.wallet_id,
        });

        Toast.show({
          type: 'success',
          text1: 'Order created successfully',
          text2: 'Payment for order successful',
        });

        return true;
      } else {
        Toast.show({
          type: 'error',
          text1: 'Payment for this order failed',
          text2: 'Something went wrong. Please try again.',
        });
        return false;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Payment for this Order Failed',
        text2: 'Something went wrong. Please try again.',
      });

      return false;
    }
  }

  /**
   * @method showAvailableBalance
   * @description will be showing available_balance if it is "Individual" or "Owner + prepaid" or "User" else amount from the fetchSingleUserWallet api
   * @param orgUser - The organization user object.
   * @returns {boolean} - True if the balance should be shown, otherwise false.
   */
  public showAvailableBalance(
    orgUser: FetchAllOrgUsersByTypeQuery['organization_user'][0] | undefined,
  ): boolean {
    if (orgUser?.is_owner && !orgUser?.organization?.is_business) {
      return true;
    }
    if (
      orgUser?.is_owner &&
      orgUser?.organization?.is_business &&
      !orgUser?.organization?.is_credit_available
    ) {
      return true;
    }
    if (orgUser?.role?.role === 'user') {
      return true;
    }
    if (orgUser?.role?.role === 'owner' && !orgUser?.is_owner) {
      return true;
    }
    return false;
  }

  /**
   * function to update wallet data
   * @method updateWalletData
   */
  public async updateWalletData(
    activeDeliveryOrgUser:
      | Organization_User
      | FetchAllOrgUsersByTypeQuery['organization_user'][0],
    callback: () => void,
  ) {
    Promise.all([
      this.getUserWallet({
        organization_user_id: activeDeliveryOrgUser.id,
      }),

      this.getUserLedger({
        limit: 10,
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
      }),
      this.fetchPaymentCardsByOrgUserId({
        organization_user_id: activeDeliveryOrgUser.id,
      }),
    ]).finally(callback);
  }

  /**
   * method to fetch payment cards available to an org user
   */
  public async fetchPaymentCardsByOrgUserId(
    args: FetchPaymentCardsByOrgUserIdQueryVariables,
  ) {
    const response: FetchPaymentCardsByOrgUserIdQuery = await callQuery({
      queryDocument: FetchPaymentCardsByOrgUserIdDocument,
      variables: {
        ...args,
      },
    });

    walletStore.setState(state => ({
      ...state,
      paymentCards: response.fetchPaymentCards?.data,
    }));

    return response;
  }

  /**
   * method to initiate icici cobranded card payment
   */
  public async initiateIciciCobrandedCardPayment(
    args: IciciCoBrandedCardsPaymentInputMutationVariables,
  ) {
    const response: IciciCoBrandedCardsPaymentInputMutation =
      await callMutation({
        queryDocument: IciciCoBrandedCardsPaymentInputDocument,
        variables: {
          ...args,
        },
      });

    walletStore.setState(state => ({
      ...state,
      iciciUrl: response?.iciciCoBrandedCardsPayment?.url ?? '',
    }));

    return response;
  }

  /**
   * method to verify icici cobranded card payment
   */
  public async verifyIciciCobrandedCardPayment(
    args: IciciCoBrandedCardsPaymentVerifyMutationVariables,
  ) {
    const response: IciciCoBrandedCardsPaymentVerifyMutation =
      await callMutation({
        queryDocument: IciciCoBrandedCardsPaymentVerifyDocument,
        variables: {
          ...args,
        },
      });

    return response;
  }

  /**
   * method to initiate axis cobranded card payment
   */
  public async initiateAxisCobrandedCardPayment(
    args: AxisBankPaymentMutationVariables,
  ) {
    const response: AxisBankPaymentMutation = await callMutation({
      queryDocument: AxisBankPaymentDocument,
      variables: {
        ...args,
      },
    });

    return response;
  }

  /**
   * method to verify icici cobranded card payment
   */
  public async verifyAxisCobrandedCardPayment(
    args: AxisBankCobrandedPaymentVerifyMutationVariables,
  ) {
    const response: AxisBankCobrandedPaymentVerifyMutation = await callMutation(
      {
        queryDocument: AxisBankCobrandedPaymentVerifyDocument,
        variables: {
          ...args,
        },
      },
    );

    return response;
  }
}

const walletService = WalletService.getInstance();

export default walletService;
