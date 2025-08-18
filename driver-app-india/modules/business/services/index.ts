/**
 * @module Business
 * @description This module contains the service file for the business module.
 */

// dependencies
import {callMutation, callQuery} from '@/utils/client';

// store

// graphql-documents
import {
  // organisation segmentation
  FetchOrganizationSegmentationDocument,
  FetchOrganizationSegmentationQuery,

  // current org user
  FetchOrgUserByIdDocument,
  FetchOrgUserByIdQuery,
  FetchOrgUserByIdQueryVariables,

  //orgs by type
  FetchAllOrgUsersByTypeDocument,
  FetchAllOrgUsersByTypeQuery,
  FetchAllOrgUsersByTypeQueryVariables,

  //pan
  CheckIfPanAlreadyExistsDocument,
  CheckIfPanAlreadyExistsQuery,
  CheckIfPanAlreadyExistsQueryVariables,

  //org details
  GetOrganizationDetailsDocument,
  GetOrganizationDetailsQuery,

  //create new business org
  CreateNewBusinessOrganizationMutation,
  CreateNewBusinessOrganizationMutationVariables,
  CreateNewBusinessOrganizationDocument,

  //create wallet
  CreateWalletForNewOrgMutation,
  CreateWalletForNewOrgMutationVariables,
  CreateWalletForNewOrgDocument,

  // fetch users by org user id
  FetchOrganizationUsersDocument,
  FetchOrganizationUsersQuery,
  CheckIfPhoneNumberAlreadyExistsQueryVariables,
  CheckIfPhoneNumberAlreadyExistsQuery,
  CheckIfPhoneNumberAlreadyExistsDocument,

  // invitation
  FetchRoleIdByNameDocument,
  FetchRoleIdByNameQuery,
  FetchRoleIdByNameQueryVariables,
  AddInvitationDocument,
  AddInvitationMutation,
  AddInvitationMutationVariables,

  // block poc
  BlockPocDocument,
} from '@/generated/graphql';

// types
import {businessStore} from '@/globalStore';
// import {getBusinessRole} from '@/utils/general';

/**
 * @class BusinessService
 * @description This class represents the service for the business module.
 */
class BusinessService {
  private static instance: BusinessService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the BusinessService class.
   * @returns {BusinessService} The singleton instance of the BusinessService class.
   */
  public static getInstance(): BusinessService {
    if (!BusinessService.instance) {
      BusinessService.instance = new BusinessService();
    }
    return BusinessService.instance;
  }

  /**
   * @method fetchOrganizationSegmentation
   * @description Retrieves all organization segmentations.
   * @args not required
   */

  public async fetchOrganizationSegmentation() {
    const response: FetchOrganizationSegmentationQuery = await callQuery({
      queryDocument: FetchOrganizationSegmentationDocument,
      variables: {},
    });
    businessStore.setState(state => ({
      ...state,
      fetchedOrganizationSegmentations: response.organization_segmentation,
    }));

    return response.organization_segmentation;
  }

  /**
   * @method fetchOrgUserById
   * @description Retrieves the active user.
   * @args FetchOrgUserByIdQueryVariables
   */
  public async fetchOrgUserById(args: FetchOrgUserByIdQueryVariables) {
    const response: FetchOrgUserByIdQuery = await callQuery({
      queryDocument: FetchOrgUserByIdDocument,
      variables: {...args},
    });

    return response.organization_user[0];
  }

  /**
   * @method fetchAllOrgUsersByType
   * @description Retrieves the active user.
   * @args fetchAllOrgUsersByTypeQueryVariables
   */
  public async fetchAllOrgUsersByType(
    args: FetchAllOrgUsersByTypeQueryVariables,
  ) {
    const response: FetchAllOrgUsersByTypeQuery = await callQuery({
      queryDocument: FetchAllOrgUsersByTypeDocument,
      variables: {...args},
    });

    const formattedOrgUsers: FetchAllOrgUsersByTypeQuery['organization_user'] =
      [];

    // const businessOrgUsers = response.organization_user;

    const businessOrgUsers = response.organization_user.filter(item => {
      return item.organization?.is_business;
    });

    const individualUser = response.organization_user.find(item => {
      return !item.organization?.is_business && !item.role;
    });

    formattedOrgUsers.push(...businessOrgUsers);

    businessStore.setState(state => ({
      ...state,
      deliveryBusinessOrgs: formattedOrgUsers,
      deliveryBusinessIndividual: individualUser,
    }));

    return {businessOrgUsers, individualUser};
  }

  /**
   * @method checkIfPanAlreadyExists
   * @description Checks if a PAN already exists
   * @args checkiCheckIfPanAlreadyExistsQueryVariablesfpan
   */
  public async checkIfPanAlreadyExists(
    args: CheckIfPanAlreadyExistsQueryVariables,
  ) {
    const response: CheckIfPanAlreadyExistsQuery = await callQuery({
      queryDocument: CheckIfPanAlreadyExistsDocument,
      variables: {...args},
    });
    return response.checkIfPanExists?.flag;
  }

  /**
   * @method getOrganizationDetails
   * @description Fetches organization details
   * @args not required
   */
  public async getOrganizationDetails() {
    const response: GetOrganizationDetailsQuery = await callQuery({
      queryDocument: GetOrganizationDetailsDocument,
      variables: {},
    });
    return response.organization_user[0];
  }

  /**
   * @method createNewBusinessOrganization
   * @description Creates a new business organization
   * @args createNewBusinessOrganizationQueryVariables
   */
  public async createNewBusinessOrganization(
    args: CreateNewBusinessOrganizationMutationVariables,
  ) {
    const response: CreateNewBusinessOrganizationMutation = await callMutation({
      queryDocument: CreateNewBusinessOrganizationDocument,
      variables: {...args},
    });
    return response.addCustomerAppUserLeadToErp;
  }

  /**
   * @method createWalletForNewOrg
   * @description Creates a wallet for a new organization
   * @args createWalletForNewOrgQueryVariables
   */
  public async createWalletForNewOrg(
    args: CreateWalletForNewOrgMutationVariables,
  ) {
    const response: CreateWalletForNewOrgMutation = await callMutation({
      queryDocument: CreateWalletForNewOrgDocument,
      variables: {...args},
    });
    return response;
  }

  /**
   * @method fetchUsersByOrgUserId
   * @description fetched all users belonging to an org
   * @args organization_user_id - string
   */
  public async fetchUsersByOrgUserId(args: string) {
    const response: FetchOrganizationUsersQuery = await callQuery({
      queryDocument: FetchOrganizationUsersDocument,
      variables: {
        organization_user_id: args,
      },
    });

    const activeUsers = (
      response.fetchOrganizationUsers?.organization_users?.organization
        ?.user_list as any[]
    ).filter((user: any) => user?.is_active);

    businessStore.setState(state => ({
      ...state,
      currentOrgUsersList: activeUsers,
    }));

    return response.fetchOrganizationUsers?.organization_users?.organization
      ?.user_list;
  }

  public async checkIfPhoneNumberAlreadyExists(
    args: CheckIfPhoneNumberAlreadyExistsQueryVariables,
  ) {
    const response: CheckIfPhoneNumberAlreadyExistsQuery = await callQuery({
      queryDocument: CheckIfPhoneNumberAlreadyExistsDocument,
      variables: {...args},
    });
    return response.organization_user;
  }

  /**
   * @method fetchRoleIdByName
   * @description fetched id of a role ( for invitation )
   * @args roleName - string
   */
  public async fetchRoleIdByName(args: FetchRoleIdByNameQueryVariables) {
    const response: FetchRoleIdByNameQuery = await callQuery({
      queryDocument: FetchRoleIdByNameDocument,
      variables: {...args},
    });

    return response.role[0];
  }

  /**
   * @method fetchRoleIdByName
   * @description fetched id of a role ( for invitation )
   * @args roleName - string
   */
  public async addInvitation(args: AddInvitationMutationVariables) {
    const response: AddInvitationMutation = await callMutation({
      queryDocument: AddInvitationDocument,
      variables: {...args},
    });

    return response.insert_invitation_one;
  }

  /**
   * @method blockPoc
   * @description Blocks a POC (Point of Contact) by updating its active status.
   * @args BlockPocMutationVariables
   */
  public async removeUser(args: {
    organization_user_id: string;
    isActive: boolean;
  }) {
    const response = await callMutation({
      queryDocument: BlockPocDocument,
      variables: {
        object: {
          is_active: args.isActive,
          organization_user_id: args.organization_user_id,
        },
      },
    });
    return response.blockPoc;
  }
}

const businessService = BusinessService.getInstance();

export default businessService;
