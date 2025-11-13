import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
import OrderCancellationRequest from '@/modules/order/components/OrderCancellationRequest';

// Store
import testStore from '../store';
import {orderStore, checkinStore} from '@/globalStore';

// Services
import testService from '../services';

// Types
import {FBColors, FBBackground} from '@/types/styles';
import {Test} from '../types';

type RootStackParamList = {
  'perform-test': undefined;
  'choose-asset': undefined;
  home: undefined;
};

const SelectTestScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Store state
  const availableTests = testStore.use.availableTests();
  const selectedTestIds = testStore.use.selectedTestIds();
  const testCategory = testStore.use.testCategory();
  const loaders = testStore.use.loaders();

  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const driverVehicleDetails = checkinStore.use.driverVehicleDetails();

  // Determine which order to use (fillup for normal driver, delivery for tower)
  const activeOrder = currentFillupOrder || currentDriverOrder;

  console.log(
    '🧪 SelectTestScreen - driverVehicleDetails:',
    driverVehicleDetails,
  );
  console.log('🧪 SelectTestScreen - currentDriverOrder:', currentDriverOrder);
  console.log('🧪 SelectTestScreen - currentFillupOrder:', currentFillupOrder);

  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch tests on mount
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      console.log('🧪 fetchTests - Starting...');
      setIsLoading(true);

      console.log(
        '🧪 fetchTests - driverVehicleDetails:',
        driverVehicleDetails,
      );
      console.log('🧪 fetchTests - currentDriverOrder:', currentDriverOrder);

      // Get product variation ID from driver vehicle
      const filteredTankProductVarId = driverVehicleDetails?.vehicle_tank_types
        ?.filter((tank: any) => tank.tank_type.slug === 'browser-tank')
        .map(
          (tank: any) =>
            tank.vehicle_tank_type_product_variations[0]?.product_variation?.id,
        );

      console.log(
        '🧪 fetchTests - filteredTankProductVarId:',
        filteredTankProductVarId,
      );

      if (!filteredTankProductVarId || filteredTankProductVarId.length === 0) {
        console.log('🧪 fetchTests - No product variation ID found!');
        Alert.alert(
          t('test.error'),
          'Unable to find product variation for this vehicle',
        );
        return;
      }

      console.log(
        '🧪 fetchTests - Calling testService.fetchTestsForProduct with ID:',
        filteredTankProductVarId[0],
      );

      // Fetch tests for product
      const result = await testService.fetchTestsForProduct(
        filteredTankProductVarId[0],
      );

      console.log('🧪 fetchTests - Result from service:', result);

      if (!result || result.tests.length === 0) {
        Alert.alert(t('test.no_tests'), 'No tests available for this product');
        return;
      }

      // Check if tests are already approved
      const customerOrderItemId =
        currentDriverOrder?.customer_order?.customer_order_items?.[0]?.id;

      if (result.category && customerOrderItemId) {
        console.log('🧪 fetchTests - Checking if tests already approved');

        const isApproved = await testService.fetchCustomerTestApproved({
          customerOrderItemId,
          testCategoryId: result.category.id,
        });

        console.log('🧪 fetchTests - Tests approved:', isApproved);

        if (isApproved) {
          // Tests already completed, skip to choose-asset
          console.log('🧪 fetchTests - Tests already approved, navigating to choose-asset');
          Alert.alert(
            'Tests Already Completed',
            'All tests have been completed for this order.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Reset navigation stack so back button goes to dashboard
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{name: 'choose-asset'}],
                    }),
                  );
                },
              },
            ],
          );
          return;
        }

        // Tests not approved yet, add test category
        console.log('🧪 fetchTests - Adding test category');
        await testService.addTestCategory({
          customerOrderItemId,
          testCategoryId: result.category.id,
        });
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      Alert.alert(t('test.error'), 'Failed to load tests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTestSelection = (testId: string) => {
    testStore.getState().toggleTestSelection(testId);
  };

  const handleProceed = () => {
    if (selectedTestIds.length === 0) {
      Alert.alert(
        t('test.select_test_title'),
        'Please select at least one test to perform',
      );
      return;
    }

    // Navigate to perform test screen
    navigation.navigate('perform-test');
  };

  const handleCancel = () => {
    // Show the cancellation modal
    setShowCancelModal(true);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
  };

  const handleCancelSuccess = () => {
    // Reset test store
    testStore.getState().resetTestStore();
    // Navigate to home screen after successful cancellation
    navigation.navigate('home' as never);
  };

  if (isLoading || loaders.fetchTests) {
    return <FullScreenLoader showLoader={true} loaderText="Loading tests..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text size="xl" weight="bold" color="primary" style={styles.title}>
          {'Select tests to be performed'}
        </Text>

        <Text
          size="sm"
          weight="normal"
          color="secondary"
          style={styles.subtitle}>
          Select the tests you want to perform for this order
        </Text>

        {availableTests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text size="base" weight="normal" color="secondary">
              No tests available
            </Text>
          </View>
        ) : (
          <View style={styles.testsContainer}>
            {availableTests.map((test: Test) => {
              const isSelected = selectedTestIds.includes(test.id);

              return (
                <TouchableOpacity
                  key={test.id}
                  style={[
                    styles.testCard,
                    isSelected && styles.testCardSelected,
                  ]}
                  onPress={() => toggleTestSelection(test.id)}
                  activeOpacity={0.7}>
                  <View style={styles.testInfo}>
                    <Text
                      size="base"
                      weight="600"
                      color={isSelected ? 'primary' : 'secondary'}>
                      {test.name}
                    </Text>
                    {test.description && (
                      <Text
                        size="sm"
                        weight="normal"
                        color="neutral"
                        style={styles.testDescription}>
                        {test.description}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}>
                    {isSelected && (
                      <Text size="base" weight="bold" color="white">
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          variant="solid"
          onPress={handleProceed}
          disabled={selectedTestIds.length === 0}
          style={styles.proceedButton}>
          {'Proceed'} ({selectedTestIds.length} selected)
        </Button>

        {selectedTestIds.length === 0 && (
          <Button
            variant="outlined"
            onPress={handleCancel}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}>
            {'Cancel Request'}
          </Button>
        )}
      </View>

      {/* Cancellation Modal */}
      <OrderCancellationRequest
        isVisible={showCancelModal}
        onClose={handleCancelModalClose}
        onSuccess={handleCancelSuccess}
      />
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
    paddingBottom: 120,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    lineHeight: 20,
  },
  testsContainer: {
    gap: 12,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: FBBackground.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: FBColors.borderPrimary,
  },
  testCardSelected: {
    borderColor: FBColors.primary,
    backgroundColor: FBColors.primaryLight + '10',
  },
  testInfo: {
    flex: 1,
    marginRight: 12,
  },
  testDescription: {
    marginTop: 4,
    lineHeight: 18,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: FBColors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FBBackground.white,
  },
  checkboxSelected: {
    backgroundColor: FBColors.primary,
    borderColor: FBColors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: FBBackground.white,
    borderTopWidth: 1,
    borderTopColor: FBColors.borderPrimary,
    gap: 12,
  },
  proceedButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
    borderColor: FBColors.error,
    borderWidth: 2,
  },
  cancelButtonText: {
    color: FBColors.error,
  },
});

export default SelectTestScreen;
