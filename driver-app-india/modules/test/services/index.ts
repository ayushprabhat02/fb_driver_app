/**
 * @module Test
 * @description Service file for test module - handles all test-related API calls
 */

// utils
import {callQuery, callMutation} from '@/utils/client';

// generated GraphQL
import {
  FetchTestsForProductDocument,
  AddCustomerOrderItemTestCategoryDocument,
  AddTestResultsWithImagesDocument,
  UpdateCustomerTestApprovalDocument,
  FetchCustomerTestResultsDocument,
  AddCustomerApprovalAndSkippedDocument,
  FetchCustomerTestApprovedDocument,
} from '@/generated/graphql';

// services
import supportService from '@/modules/support/services';

// store
import testStore from '../store';

// types
import {Test, TestCategory, TestResult} from '../types';

/**
 * Fetch available tests for a product variation
 * Used in normal driver flow after selecting order
 */
const fetchTestsForProduct = async (
  productVariationId: string,
): Promise<{tests: Test[]; category: TestCategory} | null> => {
  try {
    console.log('🔧 testService.fetchTestsForProduct - Called with ID:', productVariationId);
    testStore.getState().startLoader('fetchTests');

    const response: any = await callQuery({
      queryDocument: FetchTestsForProductDocument,
      variables: {productVariationId},
    });

    console.log('🔧 testService.fetchTestsForProduct - Response:', JSON.stringify(response, null, 2));

    const data = response?.product_variation_test_category?.[0];

    console.log('🔧 testService.fetchTestsForProduct - Extracted data:', data);

    if (!data) {
      console.log('🔧 testService.fetchTestsForProduct - No tests found!');
      throw new Error('No tests found for this product');
    }

    const tests: Test[] = data.test_category?.tests || [];
    const category: TestCategory = {
      id: data.test_category.id,
      name: data.test_category.name,
      slug: data.test_category.slug,
      tests,
    };

    // Update store with the correct test_category.id (not product_variation_test_category.id)
    testStore.getState().setAvailableTests(tests, category);
    testStore.getState().setTestCategoryId(data.test_category.id);

    console.log('🔧 testService.fetchTestsForProduct - Stored testCategoryId:', data.test_category.id);

    return {tests, category};
  } catch (error) {
    console.error('Error fetching tests for product:', error);
    throw error;
  } finally {
    testStore.getState().stopLoader('fetchTests');
  }
};

/**
 * Add test category to customer order item
 * Must be called before submitting test results
 */
const addTestCategory = async (params: {
  customerOrderItemId: string;
  testCategoryId: string;
  isCustomerApproved?: boolean;
  isCustomerAllowedSkipped?: boolean;
}): Promise<string> => {
  try {
    testStore.getState().startLoader('addTestCategory');

    const response: any = await callMutation({
      queryDocument: AddCustomerOrderItemTestCategoryDocument,
      variables: {
        customer_order_item_id: params.customerOrderItemId,
        test_category_id: params.testCategoryId,
        is_active: true,
        is_customer_approved: params.isCustomerApproved ?? false,
        is_customer_allowed_skipped: params.isCustomerAllowedSkipped ?? false,
      },
    });

    const customerOrderItemTestCategoryId =
      response?.insert_customer_order_item_test_category?.returning?.[0]?.id;

    if (!customerOrderItemTestCategoryId) {
      throw new Error('Failed to add test category');
    }

    // Store the customer_order_item_test_category.id (relation table ID)
    // This is needed for inserting test results
    testStore
      .getState()
      .setCustomerOrderItemTestCategoryId(customerOrderItemTestCategoryId);

    console.log(
      '🔧 testService.addTestCategory - Stored customerOrderItemTestCategoryId:',
      customerOrderItemTestCategoryId,
    );

    return customerOrderItemTestCategoryId;
  } catch (error) {
    console.error('Error adding test category:', error);
    throw error;
  } finally {
    testStore.getState().stopLoader('addTestCategory');
  }
};

/**
 * Submit a test result with optional image
 */
const submitTestResult = async (params: {
  testId: string;
  testSlug: string;
  isPassed: boolean;
  reading: string;
  imageStoreUrl?: string; // GCS store URL (already uploaded)
}): Promise<boolean> => {
  try {
    testStore.getState().startLoader('submitTestResult');

    const customerOrderItemTestCategoryId = testStore.getState()
      .customerOrderItemTestCategoryId;

    if (!customerOrderItemTestCategoryId) {
      throw new Error(
        'Customer order item test category ID not found. Please add test category first.',
      );
    }

    console.log(
      '🔧 testService.submitTestResult - Using customerOrderItemTestCategoryId:',
      customerOrderItemTestCategoryId,
    );

    // Use the provided imageStoreUrl (image already uploaded in TestCard)
    const imageUrl = params.imageStoreUrl || '';

    // Submit test result
    const response: any = await callMutation({
      queryDocument: AddTestResultsWithImagesDocument,
      variables: {
        objects: [
          {
            customer_order_item_test_category_id: customerOrderItemTestCategoryId,
            test_id: params.testId,
            is_passed: params.isPassed,
            key: params.testSlug,
            value: params.reading,
            is_active: true,
            customer_order_item_test_results_photos: imageUrl
              ? {
                  data: [
                    {
                      url: imageUrl,
                      is_active: true,
                    },
                  ],
                }
              : undefined,
          },
        ],
      },
    });

    const affectedRows =
      response?.insert_customer_order_item_test_results?.affected_rows;

    if (affectedRows === 0) {
      throw new Error('Failed to submit test result');
    }

    // Update store
    if (params.isPassed) {
      testStore.getState().markTestPassed(params.testId);
    } else {
      testStore.getState().markTestFailed(params.testId);
    }

    return true;
  } catch (error) {
    console.error('Error submitting test result:', error);
    throw error;
  } finally {
    testStore.getState().stopLoader('submitTestResult');
  }
};

/**
 * Add customer approval and skip status
 * Called when proceeding after all tests pass
 */
const addCustomerApprovalAndSkipped = async (params: {
  customer_order_item_id: string;
  test_category_id: string;
  is_customer_approved: boolean;
  is_customer_allowed_skipped: boolean;
}): Promise<boolean> => {
  try {
    console.log('🔧 testService - Adding customer approval:', params);

    const response: any = await callMutation({
      queryDocument: AddCustomerApprovalAndSkippedDocument,
      variables: params,
    });

    console.log('🔧 testService - Customer approval response:', response);

    const inserted =
      response?.insert_customer_order_item_test_category_one?.id;

    return !!inserted;
  } catch (error) {
    console.error('Error adding customer approval:', error);
    throw error;
  }
};

/**
 * Update customer approval and skip status
 */
const updateCustomerApproval = async (params: {
  customerOrderItemId: string;
  testCategoryId: string;
  isCustomerApproved: boolean;
  isCustomerAllowedSkipped: boolean;
}): Promise<boolean> => {
  try {
    const response: any = await callMutation({
      queryDocument: UpdateCustomerTestApprovalDocument,
      variables: params,
    });

    const affectedRows =
      response?.update_customer_order_item_test_category?.affected_rows;

    return affectedRows > 0;
  } catch (error) {
    console.error('Error updating customer approval:', error);
    throw error;
  }
};

/**
 * Fetch customer test results
 */
const fetchCustomerTestResults = async (
  customerOrderItemId: string,
): Promise<any[]> => {
  try {
    const response: any = await callQuery({
      queryDocument: FetchCustomerTestResultsDocument,
      variables: {customerOrderItemId},
    });

    return response?.customer_order_item_test_results || [];
  } catch (error) {
    console.error('Error fetching customer test results:', error);
    throw error;
  }
};

/**
 * Check if customer tests are approved
 * Used to determine if tests should be skipped or need to be performed
 */
const fetchCustomerTestApproved = async (params: {
  customerOrderItemId: string;
  testCategoryId: string;
}): Promise<boolean> => {
  try {
    console.log('🔧 testService - Checking if tests approved:', params);

    const response: any = await callQuery({
      queryDocument: FetchCustomerTestApprovedDocument,
      variables: params,
    });

    const isApproved =
      response?.customer_order_item_test_category?.[0]?.is_customer_approved;

    console.log('🔧 testService - Tests approved:', isApproved);

    return isApproved ?? false;
  } catch (error) {
    console.error('Error checking customer test approval:', error);
    return false;
  }
};

const testService = {
  fetchTestsForProduct,
  addTestCategory,
  submitTestResult,
  addCustomerApprovalAndSkipped,
  updateCustomerApproval,
  fetchCustomerTestResults,
  fetchCustomerTestApproved,
};

export default testService;
