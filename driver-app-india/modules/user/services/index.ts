/**
 * @module User
 * @description This module contains the service file for the user module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// local storage (mmkv)
// import {
//   getActiveDelOrgUserId,
//   setActiveDelOrgUserId,
// } from '@/utils/localStorage';

// store
import userStore from '../store';
// import {businessStore} from '@/globalStore';

// graphql-documents
import {
  // user Profile
  FetchUserProfileDocument,
  FetchUserProfileQuery,

  // customer segmentation
  FetchCustomerSegmentationListDocument,
  FetchCustomerSegmentationListQuery,

  // update profile
  UpdateUserProfileDocument,
  UpdateUserProfileMutation,
  UpdateUserProfileMutationVariables,

  // get user by phone
  UserByPhoneDocument,
  UserByPhoneQuery,
  UserByPhoneQueryVariables,
} from '@/generated/graphql';

/**
 * @class UserService
 * @description This class represents the service for the user module.
 */
class UserService {
  private static instance: UserService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the UserService class.
   * @returns {UserService} The singleton instance of the UserService class.
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * @method getUserProfile
   * @description Retrieves the user profile.
   */
  public async getUserProfile() {
    const response: FetchUserProfileQuery = await callQuery({
      queryDocument: FetchUserProfileDocument,
      variables: {},
    });

    userStore.setState(state => ({
      ...state,
      loggedInUser: response.user,
    }));

    return response.user;

    // const allOrgUsers = response.user[0]?.organization_users; //todo:remove later after testing

    // const allDeliveryOrgUsers = allOrgUsers.filter(
    //   orgUser => orgUser.organization_user_type === 'DELIVERY',
    // );

    // const deliveryIndividualProfile = allDeliveryOrgUsers.find(orgUser => {
    //   return (
    //     !orgUser.organization?.is_business &&
    //     !orgUser?.organization?.is_business
    //   );
    // });

    // const existingDeliveryOrgUserId = getActiveDelOrgUserId();

    // if (
    //   !allDeliveryOrgUsers.find(
    //     orgUser => orgUser?.id === existingDeliveryOrgUserId,
    //   )
    // ) {
    //   setActiveDelOrgUserId(deliveryIndividualProfile?.id);
    //   businessStore.setState(state => ({
    //     ...state,
    //     activeDeliveryOrgUser: deliveryIndividualProfile,
    //   }));
    // } else {
    //   const existingDelOrgUser = allDeliveryOrgUsers.find(
    //     orgUser => orgUser?.id === existingDeliveryOrgUserId,
    //   );

    //   businessStore.setState(state => ({
    //     ...state,
    //     activeDeliveryOrgUser: existingDelOrgUser,
    //   }));
    // }

    // todo: to be added when we work on pickup flow. commented for now
    // const allPickupOrgUsers = allOrgUsers.filter(
    //   orgUser => orgUser.organization_user_type === 'PICKUP',
    // );

    // const pickupIndividualProfile = allPickupOrgUsers.find(orgUser => {
    //   return (
    //     !orgUser.organization?.is_business &&
    //     !orgUser?.organization?.is_business
    //   );
    // });
  }

  /**
   * @method fetchCustomerSegmentation
   * @description this method fetches the customer segmentation list
   */
  public async fetchCustomerSegmentation() {
    const response: FetchCustomerSegmentationListQuery = await callQuery({
      queryDocument: FetchCustomerSegmentationListDocument,
      variables: {},
    });

    userStore.setState(state => ({
      ...state,
      customerSegmentationList: response.customer_segmentation,
    }));

    return response.customer_segmentation;
  }

  /**
   * @method updateProfile
   * @description this method updates the customer profile details
   */
  public async updateProfile(args: UpdateUserProfileMutationVariables) {
    const response: UpdateUserProfileMutation = await callMutation({
      queryDocument: UpdateUserProfileDocument,
      variables: {
        ...args,
      },
    });

    return response.update_user;
  }

  public async checkIfUserExists(args: UserByPhoneQueryVariables) {
    const response: UserByPhoneQuery = await callQuery({
      queryDocument: UserByPhoneDocument,
      variables: {
        ...args,
      },
    });

    return response.user;
  }
}

const userService = UserService.getInstance();

export default userService;
