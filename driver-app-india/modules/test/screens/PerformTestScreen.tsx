import React, {useEffect, useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

// Components
import {
  Text,
  Button,
  HeaderAvoidingContainer,
  FullScreenLoader,
} from '@/components';
import TestCard from '../components/TestCard';

// Store
import testStore from '../store';
import {orderStore} from '@/globalStore';

// Services
import orderService from '@/modules/order/services';

// Types
import {FBColors, FBBackground, FBBorders} from '@/types/styles';
import {Test} from '../types';
import testService from '../services';

type RootStackParamList = {
  'choose-asset': undefined;
  home: undefined;
};

const PerformTestScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Store state
  const availableTests = testStore.use.availableTests();
  const selectedTestIds = testStore.use.selectedTestIds();
  const passedTestIds = testStore.use.passedTestIds();
  const failedTestIds = testStore.use.failedTestIds();

  const currentDriverOrder = orderStore.use.currentDriverOrder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCheckedInitialTests, setHasCheckedInitialTests] = useState(false);

  // Get selected tests
  const selectedTests = availableTests.filter(test =>
    selectedTestIds.includes(test.id),
  );

  useEffect(() => {
    // Only check for empty tests on initial mount, not when store resets during navigation
    if (!hasCheckedInitialTests) {
      setHasCheckedInitialTests(true);

      if (selectedTestIds.length === 0) {
        Alert.alert('No Tests Selected', 'Please select tests to perform', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    }
  }, [hasCheckedInitialTests, selectedTestIds, navigation]);

  const handleTestComplete = (testId: string, isPassed: boolean) => {
    console.log(`Test ${testId} completed: ${isPassed ? 'Passed' : 'Failed'}`);
    // The TestCard component already updates the store
  };

  const getTotalTestsRequired = (): number => {
    // Return the number of selected tests
    // Each test counts as 1, regardless of internal sub-readings
    return selectedTestIds.length;
  };

  const canProceed = (): boolean => {
    const totalRequired = getTotalTestsRequired();
    const totalCompleted = passedTestIds.length + failedTestIds.length;
    const allTestsCompleted = totalCompleted >= totalRequired;

    // All tests must be completed and all must pass
    return allTestsCompleted && failedTestIds.length === 0;
  };

  const hasFailedTests = (): boolean => {
    return failedTestIds.length > 0;
  };

  const handleProceed = async () => {
    const totalRequired = getTotalTestsRequired();
    const totalCompleted = passedTestIds.length + failedTestIds.length;

    if (totalCompleted < totalRequired) {
      Alert.alert(
        'Tests Incomplete',
        'Please complete all tests before proceeding',
      );
      return;
    }

    if (failedTestIds.length > 0) {
      // Some tests failed - show reschedule option
      Alert.alert(
        'Tests Failed',
        'Some tests have failed. The order needs to be rescheduled.',
        [
          {
            text: 'Cancel Order',
            onPress: handleRescheduleOrder,
            style: 'destructive',
          },
          {
            text: 'Review Tests',
            style: 'cancel',
          },
        ],
      );
      return;
    }

    // All tests passed - proceed to dispense
    try {
      setIsProcessing(true);

      const testCategoryId = testStore.getState().testCategoryId;
      const customerOrderItemId =
        currentDriverOrder?.customer_order?.customer_order_items?.[0]?.id;

      if (!testCategoryId || !customerOrderItemId) {
        throw new Error('Missing test category or order item ID');
      }

      console.log('🧪 PerformTestScreen - Updating customer approval');

      // Update customer approval and skip status (record already exists from addTestCategory)
      await testService.updateCustomerApproval({
        customerOrderItemId: customerOrderItemId,
        testCategoryId: testCategoryId,
        isCustomerApproved: true,
        isCustomerAllowedSkipped: false,
      });

      console.log(
        '🧪 PerformTestScreen - Customer approval updated successfully',
      );

      // Clear test store for next order
      testStore.getState().resetTestStore();

      // Reset navigation stack to choose-asset (prevents back button from returning to test screens)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'choose-asset'}],
        }),
      );
    } catch (error) {
      console.error('Error proceeding after tests:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescheduleOrder = async () => {
    try {
      setIsProcessing(true);

      if (!currentDriverOrder?.id) {
        throw new Error('No current order found');
      }

      // Cancel order with reason
      await orderService.markOrderCancel({id: currentDriverOrder.id});
      await orderService.addTaskCancellationReason({
        id: currentDriverOrder.id,
        reason: 'One or more tests failed.',
      });

      Alert.alert(
        'Order Cancelled',
        'The order has been marked for cancellation due to failed tests.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset test store
              testStore.getState().resetTestStore();
              // Navigate to home screen
              navigation.navigate('home' as never);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error rescheduling order:', error);
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <FullScreenLoader
        showLoader={true}
        loaderText="Processing test results..."
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text size="lg" weight="bold" color="primary" style={styles.title}>
          {'Please perform the selected tests'}
        </Text>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text size="2xl" weight="bold" color="primary">
                {passedTestIds.length}
              </Text>
              <Text size="sm" weight="normal" color="secondary">
                Passed
              </Text>
            </View>

            <View style={styles.progressDivider} />

            <View style={styles.progressItem}>
              <Text size="2xl" weight="bold" color="primary">
                {failedTestIds.length}
              </Text>
              <Text size="sm" weight="normal" color="error">
                Failed
              </Text>
            </View>

            <View style={styles.progressDivider} />

            <View style={styles.progressItem}>
              <Text size="2xl" weight="bold" color="primary">
                {getTotalTestsRequired()}
              </Text>
              <Text size="sm" weight="normal" color="secondary">
                Total
              </Text>
            </View>
          </View>
        </View>

        {hasFailedTests() && (
          <View style={styles.warningCard}>
            <Text size="base" weight="600" color="error">
              ⚠️ Some tests have failed
            </Text>
            <Text
              size="sm"
              weight="normal"
              color="secondary"
              style={styles.warningText}>
              Orders with failed tests will need to be rescheduled
            </Text>
          </View>
        )}

        <View style={styles.testsContainer}>
          {selectedTests.map((test: Test) => (
            <TestCard
              key={test.id}
              test={test}
              onTestComplete={handleTestComplete}
            />
          ))}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButton}>
        {canProceed() ? (
          <Button
            variant="solid"
            onPress={handleProceed}
            style={styles.proceedButton}>
            Proceed
          </Button>
        ) : hasFailedTests() ? (
          <Button
            variant="outlined"
            onPress={handleRescheduleOrder}
            style={[styles.proceedButton, styles.rescheduleButton]}
            textStyle={styles.rescheduleButtonText}>
            Cancel Order
          </Button>
        ) : (
          <Button
            variant="outlined"
            onPress={() => {}}
            disabled={true}
            style={styles.proceedButton}>
            Complete All Tests First
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: FBBackground.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: FBBorders.primary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: FBBorders.primary,
  },
  warningCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: FBColors.error,
  },
  warningText: {
    marginTop: 4,
    lineHeight: 18,
  },
  testsContainer: {
    marginTop: 8,
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: FBBorders.primary,
  },
  proceedButton: {
    width: '100%',
  },
  rescheduleButton: {
    borderColor: FBColors.error,
  },
  rescheduleButtonText: {
    color: FBColors.error,
  },
});

export default PerformTestScreen;
