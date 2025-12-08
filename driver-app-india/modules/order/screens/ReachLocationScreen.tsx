import React, {useState} from 'react';
import {View, Alert, Linking, Platform, StatusBar} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import {Container, Text, Button} from '@/components';
import {FBBackground} from '@/types/styles';
import {retrieveCoordsFromString} from '@/utils/general';
import {updateOrderQuantity} from '@/utils/orderUtil';
import {homeStore, orderStore, authStore} from '@/globalStore';
import orderService from '@/modules/order/services';
import {MapPin, NavigationArrow} from 'phosphor-react-native';

interface ReachLocationScreenProps {}

const ReachLocationScreen: React.FC<ReachLocationScreenProps> = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [arrivedLoading, setArrivedLoading] = useState(false);

  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const userRole = authStore.use.userRole();

  // Get the current selected order
  const selectedOrder = currentFillupOrder || currentDriverOrder;
  const isFillupOrder =
    currentFillupOrder &&
    (currentFillupOrder as any)?.fillup_requests &&
    (currentFillupOrder as any)?.fillup_requests.length > 0;

  // Get destination location from order
  const getDestinationLocation = () => {
    if (!selectedOrder) return null;

    try {
      // For delivery orders - use shipping address location
      if (
        selectedOrder.customer_order?.organizationAddressByShippingAddressId
          ?.location
      ) {
        const location =
          selectedOrder.customer_order.organizationAddressByShippingAddressId
            .location;
        return retrieveCoordsFromString(location);
      }

      // For fillup orders - check driver vehicle location
      if (isFillupOrder && selectedOrder.fillup_requests?.length > 0) {
        const fillupRequest = selectedOrder.fillup_requests[0];

        // Try driver vehicle location
        if (fillupRequest.driver_vehicle?.vehicle?.location) {
          return retrieveCoordsFromString(
            fillupRequest.driver_vehicle.vehicle.location,
          );
        }

        // Try vehicle partner address location
        if (fillupRequest.driver_vehicle?.vehicle?.partner_address?.location) {
          return retrieveCoordsFromString(
            fillupRequest.driver_vehicle.vehicle.partner_address.location,
          );
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting destination location:', error);
      return null;
    }
  };

  // Get customer/site details
  const getLocationDetails = () => {
    if (!selectedOrder)
      return {name: 'Unknown', address: 'Address not available'};

    if (isFillupOrder) {
      const fillupRequest = selectedOrder.fillup_requests?.[0];
      return {
        name:
          fillupRequest?.driver_vehicle?.vehicle?.partner_address?.name ||
          'Fillup Location',
        address:
          fillupRequest?.driver_vehicle?.vehicle?.partner_address
            ?.address_line1 || 'Address not available',
      };
    } else {
      return {
        name:
          selectedOrder.customer_order?.organizationAddressByShippingAddressId
            ?.name ||
          selectedOrder.customer_order?.organization_user?.organization?.name ||
          'Customer Location',
        address:
          selectedOrder.customer_order?.organizationAddressByShippingAddressId
            ?.address_line1 || 'Address not available',
      };
    }
  };

  const openExternalNavigation = () => {
    const destination = getDestinationLocation();

    if (!destination || !destination.lat || !destination.lng) {
      Alert.alert('Error', 'Destination location not available for navigation');
      return;
    }

    setLoading(true);

    const scheme = Platform.select({
      ios: `maps://maps.apple.com/?q=${destination.lat},${destination.lng}&t=m&dirflg=d`,
      android: `https://www.google.com/maps/dir/?api=1&dir_action=navigate&travelmode=driving&destination=${destination.lat},${destination.lng}`,
    });

    if (scheme) {
      Linking.openURL(scheme)
        .catch(err => {
          console.error('Error opening maps:', err);
          Alert.alert('Error', 'Could not open navigation app');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleIHaveReached = async () => {
    if (!selectedOrder) {
      Alert.alert('Error', 'No order selected');
      return;
    }

    setArrivedLoading(true);

    try {
      // Update order quantity in store (critical for dispense fuel screen)
      updateOrderQuantity(selectedOrder);
      console.log('📊 Updated quantity to be dispensed for order');

      // Mark order as ARRIVED
      const response = await orderService.markOrderArrived({
        id: selectedOrder.id,
      });

      if (!response) {
        Alert.alert(
          'Error',
          'Failed to mark order as arrived. Please try again.',
        );
        return;
      }

      // Update the order state in store
      const updatedOrder = {...selectedOrder, state: 'ARRIVED' as any};

      if (isFillupOrder) {
        orderStore.setState(state => ({
          ...state,
          currentFillupOrder: updatedOrder,
        }));
      } else {
        orderStore.setState(state => ({
          ...state,
          currentDriverOrder: updatedOrder,
        }));
      }

      // Update the order in home store as well
      const allDriverOrders = homeStore.getState().driverOrders;
      if (allDriverOrders) {
        const orderIndex = allDriverOrders.findIndex(
          (o: any) => o.id === selectedOrder.id,
        );
        if (orderIndex !== -1) {
          allDriverOrders[orderIndex] = updatedOrder;
          homeStore.setState(state => ({
            ...state,
            driverOrders: [...allDriverOrders],
          }));
        }
      }

      // Navigate based on order type and test requirements
      if (isFillupOrder) {
        // Fillup orders go to fill-asset
        // @ts-ignore
        navigation.navigate('address', {
          screen: 'fill-asset',
        });
      } else {
        // Driver orders - implement test flow logic
        const isTowerDriver = userRole === 'tower_driver';
        const isBuddyCanFlow = selectedOrder?.is_enable_buddycan_flow;
        const isTestRequired =
          selectedOrder?.is_enable_customer_location_test;

        console.log('🚦 Navigation decision:', {
          userRole,
          isTowerDriver,
          isBuddyCanFlow,
          isTestRequired,
        });

        // Tower driver → choose-asset (skip test)
        if (isTowerDriver) {
          console.log('🏢 Tower driver - navigating to choose-asset');
          // @ts-ignore
          navigation.navigate('order', {
            screen: 'choose-asset',
          });
        }
        // Normal driver + NOT buddycan (bowser) → select-test (always show test)
        else if (!isBuddyCanFlow) {
          console.log('🚛 Bowser order - navigating to select-test');
          // @ts-ignore
          navigation.navigate('order', {
            screen: 'select-test',
          });
        }
        // Normal driver + buddycan + test required → select-test
        else if (isBuddyCanFlow && isTestRequired) {
          console.log('🧪 BuddyCan with test required - navigating to select-test');
          // @ts-ignore
          navigation.navigate('order', {
            screen: 'select-test',
          });
        }
        // Normal driver + buddycan + test NOT required → choose-asset (skip test)
        else {
          console.log(
            '⏭️ BuddyCan without test - navigating to choose-asset',
          );
          // @ts-ignore
          navigation.navigate('order', {
            screen: 'choose-asset',
          });
        }
      }
    } catch (error) {
      console.error('Error marking order as arrived:', error);
      Alert.alert(
        'Error',
        'Failed to mark order as arrived. Please try again.',
      );
    } finally {
      setArrivedLoading(false);
    }
  };

  const locationDetails = getLocationDetails();
  const destination = getDestinationLocation();

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="dark-content"
      />

      <Container paddingHorizontal={20} style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MapPin size={32} color="#3B82F6" weight="fill" />
          <Text
            size="xl"
            weight="700"
            style={{textAlign: 'center', marginTop: 12, color: '#1f2937'}}>
            Navigate to {isFillupOrder ? 'Fillup' : 'Delivery'} Location
          </Text>
        </View>

        {/* Location Details */}
        <View style={styles.locationCard}>
          <Text
            size="lg"
            weight="600"
            style={{color: '#1f2937', marginBottom: 4}}>
            {locationDetails.name}
          </Text>
          <Text
            size="sm"
            style={{marginBottom: 8, lineHeight: 20, color: '#6b7280'}}>
            {locationDetails.address}
          </Text>

          {destination && (
            <Text size="xs" style={{fontFamily: 'monospace', color: '#6b7280'}}>
              Coordinates: {destination.lat.toFixed(6)},{' '}
              {destination.lng.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Order Info */}
        <View style={styles.orderCard}>
          <Text size="sm" weight="600" style={{color: '#6b7280'}}>
            Order Code
          </Text>
          <Text size="lg" weight="600">
            {selectedOrder?.customer_order?.order_code || 'N/A'}
          </Text>

          <Text
            size="sm"
            weight="600"
            style={{color: '#6b7280', marginTop: 12}}>
            Order Type
          </Text>
          <Text size="lg" weight="600">
            {isFillupOrder ? 'FILLUP' : 'DELIVERY'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Navigate Button */}
          <Button
            variant="solid"
            style={[styles.button, styles.navigateButton]}
            onPress={openExternalNavigation}
            loading={loading}
            disabled={!destination}>
            <NavigationArrow size={20} color="white" weight="fill" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'white',
                marginLeft: 8,
              }}>
              Navigate
            </Text>
          </Button>

          {/* I Have Reached Button */}
          <Button
            variant="solid"
            style={[styles.button, styles.arrivedButton]}
            onPress={handleIHaveReached}
            loading={arrivedLoading}>
            <Text style={{fontSize: 16, fontWeight: '600', color: 'white'}}>
              I Have Reached
            </Text>
          </Button>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text size="sm" weight="600" style={{color: '#92400e'}}>
            Instructions:
          </Text>
          <Text
            size="sm"
            style={{color: '#92400e', marginTop: 4, lineHeight: 18}}>
            • Tap "Navigate" to open maps for turn-by-turn directions
          </Text>
          <Text
            size="sm"
            style={{color: '#92400e', marginTop: 4, lineHeight: 18}}>
            • Once you reach the location, tap "I Have Reached" to continue
          </Text>
          <Text
            size="sm"
            style={{color: '#92400e', marginTop: 4, lineHeight: 18}}>
            • Make sure you are at the correct delivery/fillup location
          </Text>
        </View>
      </Container>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.white,
  },
  content: {
    flex: 1,
    paddingTop: '20@vs',
  },
  header: {
    alignItems: 'center',
    marginBottom: '24@vs',
  },
  locationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderCard: {
    backgroundColor: '#fef7ff',
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '24@vs',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  buttonContainer: {
    gap: '12@vs',
    marginBottom: '24@vs',
  },
  button: {
    borderRadius: '12@s',
    minHeight: '48@vs',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
  },
  arrivedButton: {
    backgroundColor: '#10B981',
  },
  instructionsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: '12@s',
    padding: '16@s',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
});

export default ReachLocationScreen;
