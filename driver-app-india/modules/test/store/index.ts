// dependencies
import {create} from 'zustand';

// utils
import createSelectors from '@/utils/selectors';

// types
import {Test, TestCategory, TestResult} from '../types';

type LoaderTypes =
  | 'fetchTests'
  | 'addTestCategory'
  | 'submitTestResult'
  | 'uploadTestImage';

type Loaders = {
  fetchTests: boolean;
  addTestCategory: boolean;
  submitTestResult: boolean;
  uploadTestImage: boolean;
};

type TestStore = {
  // Available tests for selection
  availableTests: Test[];
  testCategory: TestCategory | null;
  testCategoryId: string | null;

  // Selected tests by user
  selectedTestIds: string[];

  // Test results (testId -> result)
  testResults: Map<string, TestResult>;
  passedTestIds: string[];
  failedTestIds: string[];

  // Loading states
  loaders: Loaders;

  // Actions
  setAvailableTests: (tests: Test[], category?: TestCategory) => void;
  setTestCategory: (category: TestCategory | null) => void;
  setTestCategoryId: (id: string | null) => void;

  // Test selection
  toggleTestSelection: (testId: string) => void;
  setSelectedTestIds: (testIds: string[]) => void;
  clearSelectedTests: () => void;

  // Test results
  setTestResult: (testId: string, result: TestResult) => void;
  markTestPassed: (testId: string) => void;
  markTestFailed: (testId: string) => void;
  clearTestResults: () => void;

  // Loaders
  startLoader: (loader: LoaderTypes) => void;
  stopLoader: (loader: LoaderTypes) => void;

  // Reset
  resetTestStore: () => void;
};

const initialLoaders: Loaders = {
  fetchTests: false,
  addTestCategory: false,
  submitTestResult: false,
  uploadTestImage: false,
};

const testStoreBase = create<TestStore>((set, get) => ({
  // Initial state
  availableTests: [],
  testCategory: null,
  testCategoryId: null,
  selectedTestIds: [],
  testResults: new Map(),
  passedTestIds: [],
  failedTestIds: [],
  loaders: initialLoaders,

  // Set available tests
  setAvailableTests: (tests, category) =>
    set({
      availableTests: tests,
      ...(category && {testCategory: category}),
    }),

  // Set test category
  setTestCategory: category => set({testCategory: category}),

  // Set test category ID
  setTestCategoryId: id => set({testCategoryId: id}),

  // Toggle test selection
  toggleTestSelection: testId => {
    const {selectedTestIds} = get();
    const isSelected = selectedTestIds.includes(testId);

    if (isSelected) {
      set({
        selectedTestIds: selectedTestIds.filter(id => id !== testId),
      });
    } else {
      set({
        selectedTestIds: [...selectedTestIds, testId],
      });
    }
  },

  // Set selected test IDs
  setSelectedTestIds: testIds => set({selectedTestIds: testIds}),

  // Clear selected tests
  clearSelectedTests: () => set({selectedTestIds: []}),

  // Set test result
  setTestResult: (testId, result) => {
    const {testResults} = get();
    const newResults = new Map(testResults);
    newResults.set(testId, result);
    set({testResults: newResults});
  },

  // Mark test as passed
  markTestPassed: testId => {
    const {passedTestIds, failedTestIds} = get();

    // Remove from failed if exists
    const newFailedIds = failedTestIds.filter(id => id !== testId);

    // Add to passed if not already there
    const newPassedIds = passedTestIds.includes(testId)
      ? passedTestIds
      : [...passedTestIds, testId];

    set({
      passedTestIds: newPassedIds,
      failedTestIds: newFailedIds,
    });
  },

  // Mark test as failed
  markTestFailed: testId => {
    const {passedTestIds, failedTestIds} = get();

    // Remove from passed if exists
    const newPassedIds = passedTestIds.filter(id => id !== testId);

    // Add to failed if not already there
    const newFailedIds = failedTestIds.includes(testId)
      ? failedTestIds
      : [...failedTestIds, testId];

    set({
      passedTestIds: newPassedIds,
      failedTestIds: newFailedIds,
    });
  },

  // Clear test results
  clearTestResults: () =>
    set({
      testResults: new Map(),
      passedTestIds: [],
      failedTestIds: [],
    }),

  // Start loader
  startLoader: loader =>
    set(state => ({
      loaders: {...state.loaders, [loader]: true},
    })),

  // Stop loader
  stopLoader: loader =>
    set(state => ({
      loaders: {...state.loaders, [loader]: false},
    })),

  // Reset entire store
  resetTestStore: () =>
    set({
      availableTests: [],
      testCategory: null,
      testCategoryId: null,
      selectedTestIds: [],
      testResults: new Map(),
      passedTestIds: [],
      failedTestIds: [],
      loaders: initialLoaders,
    }),
}));

const testStore = createSelectors(testStoreBase);

export default testStore;
