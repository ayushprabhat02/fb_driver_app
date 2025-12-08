import {
  FetchAllUserOrganizationsByTypeDocument,
  FetchAllUserOrganizationsByTypeQuery,
  FetchAllUserOrganizationsByTypeQueryVariables,
  FetchFileUrlFromServerDocument,
  FetchFileUrlFromServerQuery,
  Support_Tickets,
} from './../../../generated/graphql';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
global.Buffer = Buffer;
import {Platform} from 'react-native';

/**
 * @module Support
 * @description This is the service file for the support module.
 */

// dependencies
import {callQuery, callMutation} from '@/utils/client';
import axios from 'axios';

// store
import supportStore from '../store';

// graphql-documents
import {
  //categories
  FetchSupportTicketsCategoriesQuery,
  FetchSupportTicketsCategoriesDocument,

  //sub categories
  FetchSupportTicketsSubCategoriesDocument,
  FetchSupportTicketsSubCategoriesQuery,
  FetchSupportTicketsSubCategoriesQueryVariables,

  //create support ticket
  CreateSupportTicketMutationVariables,
  CreateSupportTicketMutation,
  CreateSupportTicketDocument,

  //fetch support tickets
  FetchSupportTicketsByOrgUserIdsQuery,
  FetchSupportTicketsByOrgUserIdsDocument,
  FetchSupportTicketsByOrgUserIdsQueryVariables,

  //ticket erp details
  FetchTicketDetailsFromErpMutation,
  FetchTicketDetailsFromErpDocument,
  FetchTicketDetailsFromErpMutationVariables,

  //upload file
  UploadFileToBucketMutation,
  UploadFileToBucketDocument,

  //fetch file
} from '@/generated/graphql';

/**
 * @class SupportService
 * @description This class represents the service for the support module.
 */
class SupportService {
  private static instance: SupportService;

  /**
   * @method getInstance
   * @description Returns the singleton instance of the SupportService class.
   * @returns {SupportService} The singleton instance of the SupportService class.
   */
  public static getInstance(): SupportService {
    if (!SupportService.instance) {
      SupportService.instance = new SupportService();
    }
    return SupportService.instance;
  }
  /**
   * @method fetchAllUserOrganizationsByType
   * @description Retrieves all user organizations filtered by type.
   * @args {FetchAllUserOrganizationsByTypeQueryVariables} args - The arguments for the query.
   * @returns An array of user organization details.
   */
  public async fetchAllUserOrganizationsByType(
    args: FetchAllUserOrganizationsByTypeQueryVariables,
  ) {
    const response: FetchAllUserOrganizationsByTypeQuery = await callQuery({
      queryDocument: FetchAllUserOrganizationsByTypeDocument,
      variables: {...args},
    });
    supportStore.setState({
      allUserOrgsForSupportProfiles: response.organization_user,
    });

    return response;
  }

  /**
   * @method fetchSupportTicketSubCategories
   * @description Function to get support ticket by org user id
   * @args FetchSupportTicketsByOrgUserIdsQueryVariables
   */
  public async fetchSupportTicketsByOrgUserIds(
    args: FetchSupportTicketsByOrgUserIdsQueryVariables,
  ) {
    const response: FetchSupportTicketsByOrgUserIdsQuery = await callQuery({
      queryDocument: FetchSupportTicketsByOrgUserIdsDocument,
      variables: {...args},
    });
    const existingSupportTickets = supportStore.getState()?.supportTickets;
    const fetchedSupportTickets = response.support_tickets;
    const updatedSupportTickets = [
      ...existingSupportTickets,
      ...fetchedSupportTickets,
    ].filter(
      (ticket, index, self) =>
        index === self.findIndex(t => t.id === ticket.id),
    );

    const maxCount = response.support_tickets_aggregate.aggregate
      ?.count as number;
    const totalFetchedCount = updatedSupportTickets.length;

    supportStore.setState(state => ({
      ...state,
      supportTickets: updatedSupportTickets as Support_Tickets[],
      supportTicketsCnt: maxCount,
      supportTicketsHasMoreOrders:
        fetchedSupportTickets.length === 0 || totalFetchedCount >= maxCount
          ? false
          : true,
    }));
    return response.support_tickets;
  }

  /**
   * @method fetchSupportTicketCategories
   * @description Function to get support ticket categories
   * @args no args required
   */
  public async fetchSupportTicketCategories() {
    const response: FetchSupportTicketsCategoriesQuery = await callQuery({
      queryDocument: FetchSupportTicketsCategoriesDocument,
      variables: {},
    });
    const formattedOptions = response.support_tickets_category.map(element => {
      return {
        option: element.category,
        value: element.id,
      };
    });
    supportStore.setState({supportTicketCategories: formattedOptions as any});
    return response.support_tickets_category;
  }

  /**
   * @method fetchSupportTicketSubCategories
   * @description Function to get support ticket sub categories based on category id
   * @args
   */
  public async fetchSupportTicketSubCategories(
    args: FetchSupportTicketsSubCategoriesQueryVariables,
  ) {
    const response: FetchSupportTicketsSubCategoriesQuery = await callQuery({
      queryDocument: FetchSupportTicketsSubCategoriesDocument,
      variables: {...args},
    });
    const formattedSubTickets = response.support_tickets_subcategory.map(
      element => {
        return {
          option: element.subject,
          value: element.id,
        };
      },
    );
    supportStore.setState({
      supportTicketSubCategories: formattedSubTickets as any,
    });
    return response.support_tickets_subcategory;
  }

  /**
   * @method createSupportTicket
   * @description create support ticket
   * @args CreateSupportTicketMutationVariables
   */
  public async createSupportTicket(args: CreateSupportTicketMutationVariables) {
    const response: CreateSupportTicketMutation = await callMutation({
      queryDocument: CreateSupportTicketDocument,
      variables: {...args},
    });
    return response.insert_support_tickets_one;
  }

  /**
   * @method fetchTicketDetailsFromERP
   * @description fetch ticket details from erp
   * @args fetchTicketDetailsFromERP
   */
  public async fetchTicketDetailsFromERP(
    args: FetchTicketDetailsFromErpMutationVariables,
  ) {
    const response: FetchTicketDetailsFromErpMutation = await callMutation({
      queryDocument: FetchTicketDetailsFromErpDocument,
      variables: {...args},
    });
    supportStore.setState({
      erpTicketDetails: response.fetchSupportTicketErp,
    });
    return response.fetchSupportTicketErp?.message;
  }

  public async uploadFile(args: any) {
    const {uploadFile}: UploadFileToBucketMutation = await callMutation({
      queryDocument: UploadFileToBucketDocument,
      variables: {
        file: {
          bucketName: 'fb-in-compliance-storage',
          fileName: `${Date.now()}${args.fileName.replace(' ', '-')}`,
          contentType: args.contentType,
        },
      },
    });

    console.log('----uploadFile?.signedUrl-----', uploadFile?.signedUrl);
    console.log('---------');
    await axios.put(`${uploadFile?.signedUrl}`, args.fileData, {
      headers: {
        'Content-Type': args.contentType,
      },
      transformRequest: [data => data],
    });

    const src = await this.fetchFile(uploadFile?.storeUrl);
    return {src: src, storeUrl: uploadFile?.storeUrl};
  }

  private putToSignedUrl = (
    signedUrl: string,
    uri: string,
    contentType?: string,
  ) =>
    new Promise<void>((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);

        // Set Content-Type ONLY if it's signed in the URL
        // (GCS/S3 reject extra headers not in X-Goog-SignedHeaders / X-Amz-SignedHeaders)
        if (contentType) {
          xhr.setRequestHeader('Content-Type', contentType);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else
            reject(
              new Error(
                `HTTP ${xhr.status}: ${xhr.responseText || 'Upload failed'}`,
              ),
            );
        };
        xhr.onerror = () => reject(new Error('Network error while uploading'));

        // Send file by URI (streamed by native layer; no base64, no OOM)
        xhr.send({
          uri,
          type: contentType || 'application/octet-stream',
          name: 'video',
        } as any);
      } catch (e) {
        reject(e);
      }
    });

  /**
   * Streams a video file to GCS signed URL without loading into JS memory.
   * args = { fileName: string, contentType: string, fileData: { uri?: string, path?: string } }
   */
  public async uploadVideoFile(args: any) {
    // 1) Ask backend for a signed URL
    const {uploadFile}: UploadFileToBucketMutation = await callMutation({
      queryDocument: UploadFileToBucketDocument,
      variables: {
        file: {
          bucketName: 'fb-in-compliance-storage',
          fileName: `${Date.now()}${String(args.fileName || '').replace(
            ' ',
            '-',
          )}`,
          contentType: args.contentType,
        },
      },
    });

    if (!uploadFile?.signedUrl) {
      throw new Error('Signed URL is missing from backend');
    }

    // 2) Build the file URI we’ll send
    let srcUri: string =
      args?.fileData?.uri ||
      (args?.fileData?.path ? `file://${args.fileData.path}` : '');

    if (!srcUri) throw new Error('Invalid file path/uri for upload');

    // If Android gives us content://, copy to a temp file we can read
    if (Platform.OS === 'android' && srcUri.startsWith('content://')) {
      const dest = `${RNFS.CachesDirectoryPath}/upload_${Date.now()}`;
      await RNFS.copyFile(srcUri, dest);
      srcUri = `file://${dest}`;
    }

    // 3) Respect signed headers: only include Content-Type if it’s signed
    const signedHeadersParam =
      uploadFile.signedUrl.match(/X-Goog-SignedHeaders=([^&]+)/)?.[1] || '';
    const lower = decodeURIComponent(signedHeadersParam).toLowerCase();
    const includeContentType = lower.includes('content-type');
    const contentTypeToSend = includeContentType ? args.contentType : undefined;

    // 4) PUT the file to the signed URL (streamed; no base64)
    await this.putToSignedUrl(uploadFile.signedUrl, srcUri, contentTypeToSend);

    // 5) Resolve the public URL via your API
    const src = await this.fetchFile(uploadFile.storeUrl);
    return {src, storeUrl: uploadFile.storeUrl};
  }

  public async fetchFile(url: string | null | undefined) {
    const response: FetchFileUrlFromServerQuery = await callQuery({
      queryDocument: FetchFileUrlFromServerDocument,
      variables: {
        file: {fileUrl: url as string},
      },
    });
    console.log('----after upload-----', response.fetchFile?.url);
    return response.fetchFile?.url;
  }
}

const supportService = SupportService.getInstance();

export default supportService;
