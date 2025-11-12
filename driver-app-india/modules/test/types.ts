export interface Test {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface TestCategory {
  id: string;
  name: string;
  slug: string;
  tests: Test[];
}

export interface TestResult {
  testId: string;
  isPassed: boolean;
  reading: string;
  imageUrl: string;
}

export interface TestResultPhoto {
  id: string;
  url: string;
  is_active: boolean;
}

export interface CustomerOrderItemTestResult {
  id: string;
  is_passed: boolean;
  key: string;
  value: string;
  test_id: string;
  customer_order_item_test_results_photos: TestResultPhoto[];
}

export type TestSlug =
  | 'water-test'
  | 'density-test'
  | '5-litre-jar'
  | 'dip-test';

export interface TestFormData {
  // For density test (3 readings)
  hydrometerReading?: number;
  thermometerReading?: number;
  densityReading?: number;

  // For dip test
  dipReading?: number;

  // For tests with images
  imageUri?: string; // Local URI for preview
  imageStoreUrl?: string; // GCS URL after upload

  // Pass/Fail status
  isPassed?: boolean | null;
}
