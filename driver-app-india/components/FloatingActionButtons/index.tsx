import React from 'react';
import {View, StyleSheet, Linking, Platform, Alert} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Button} from '@/components';
import {updateOrderQuantity} from '@/utils/orderUtil';
import {retrieveCoordsFromString} from '@/utils/general';
import {homeStore, orderStore} from '@/globalStore';
import {useNavigation} from '@react-navigation/native';

interface FloatingActionButtonsProps {}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = () => {
  const navigation = useNavigation();
  const fillupHistory = homeStore.use.fillupHistory();
  const currentFillupOrder = orderStore.use.currentFillupOrder();
  const currentDriverOrder = orderStore.use.currentDriverOrder();

  const allFillupsCompleted = fillupHistory?.every(
    (item: any) => item.state === 'COMPLETE' || item.state === 'REJECTED',
  );

  // Get the current selected order (prioritize fillup over delivery)
  const selectedOrder = currentFillupOrder || currentDriverOrder;
  const isFillupOrder = currentFillupOrder &&
    (currentFillupOrder as any)?.fillup_requests &&
    (currentFillupOrder as any)?.fillup_requests.length > 0;

  // Define text style separately to avoid ScaledSheet typing issues
  const floatingButtonTextStyle = StyleSheet.create({
    text: {
      fontSize: 14,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      color: 'white',
    },
  }).text;

  // Button logic based on Vue project analysis
  const getButtonConfig = () => {
    if (!selectedOrder) return null;

    const orderState = selectedOrder.state;

    // DISPENSING: Show only "Continue Order" (full width)
    if (orderState === 'DISPENSING') {
      return {
        type: 'continue',
        showNavigation: false,
        buttonText: 'Continue Order',
        buttonStyle: 'full'
      };
    }

    // ARRIVED: Show only "Start Trip" (full width) - no navigation needed
    if (orderState === 'ARRIVED') {
      return {
        type: 'start',
        showNavigation: false,
        buttonText: 'Start Delivery',
        buttonStyle: 'full'
      };
    }

    // Other states (ASSIGNED, IN_TRANSIT): Show both buttons
    if (['ASSIGNED', 'IN_TRANSIT'].includes(orderState)) {
      return {
        type: 'both',
        showNavigation: true,
        buttonText: 'Start Delivery',
        buttonStyle: 'half'
      };
    }

    return null;
  };

  const buttonConfig = getButtonConfig();

  const openExternalNavigation = (destLat: number, destLng: number) => {
    const scheme = Platform.select({
      ios: `maps://maps.apple.com/?q=${destLat},${destLng}&t=m&dirflg=d`,
      android: `https://www.google.com/maps/dir/?api=1&dir_action=navigate&travelmode=driving&destination=${destLat},${destLng}`
    });

    if (scheme) {
      Linking.openURL(scheme).catch(err => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open navigation app');
      });
    }
  };

  const getDestinationLocation = () => {
    if (!selectedOrder) return null;

    try {
      // For delivery orders - use shipping address location
      if (selectedOrder.customer_order?.organizationAddressByShippingAddressId?.location) {
        const location = selectedOrder.customer_order.organizationAddressByShippingAddressId.location;
        return retrieveCoordsFromString(location);
      }

      // For fillup orders - check driver vehicle location
      if (isFillupOrder && selectedOrder.fillup_requests?.length > 0) {
        const fillupRequest = selectedOrder.fillup_requests[0];

        // Try driver vehicle location
        if (fillupRequest.driver_vehicle?.vehicle?.location) {
          return retrieveCoordsFromString(fillupRequest.driver_vehicle.vehicle.location);
        }

        // Try vehicle partner address location
        if (fillupRequest.driver_vehicle?.vehicle?.partner_address?.location) {
          return retrieveCoordsFromString(fillupRequest.driver_vehicle.vehicle.partner_address.location);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting destination location:', error);
      return null;
    }
  };

  const handleNavigation = () => {
    const destination = getDestinationLocation();

    if (destination && destination.lat && destination.lng) {
      openExternalNavigation(destination.lat, destination.lng);
    } else {
      Alert.alert('Error', 'Destination location not available for navigation');
    }
  };

  const handleStartTrip = () => {
    if (!selectedOrder) return;

    // Update dispense quantity
    updateOrderQuantity(selectedOrder);

    const orderState = selectedOrder.state;

    // Handle DISPENSING state - continue existing order
    if (orderState === 'DISPENSING') {
      if (isFillupOrder) {
        // @ts-ignore
        navigation.navigate('address', {
          screen: 'fill-asset',
        });
      } else {
        // @ts-ignore
        navigation.navigate('order', {
          screen: 'choose-asset',
        });
      }
      return;
    }

    // Handle ARRIVED state - start dispensing process
    if (orderState === 'ARRIVED') {
      if (isFillupOrder) {
        // @ts-ignore
        navigation.navigate('address', {
          screen: 'fill-asset',
        });
      } else {
        // @ts-ignore
        navigation.navigate('order', {
          screen: 'choose-asset',
        });
      }
      return;
    }

    // Handle ASSIGNED/IN_TRANSIT - start trip flow
    if (isFillupOrder) {
      // For fillup orders, go to health checks first
      // @ts-ignore
      navigation.navigate('address', {
        screen: 'health-checks-fillup',
      });
    } else {
      // For delivery orders, check if need customer test or COD, otherwise go to asset selection
      // @ts-ignore
      navigation.navigate('order', {
        screen: 'choose-asset',
      });
    }
  };

  // Don't render if conditions are not met
  if (
    !selectedOrder ||
    !buttonConfig ||
    !(
      allFillupsCompleted ||
      isFillupOrder
    )
  ) {
    return null;
  }

  return (
    <View style={styles.floatingButtonsContainer}>
      {/* Show navigation button only for ASSIGNED/IN_TRANSIT states */}
      {buttonConfig.showNavigation && (
        <Button
          variant="solid"
          style={[styles.floatingButton, styles.navigationButton]}
          textStyle={floatingButtonTextStyle}
          onPress={handleNavigation}>
          Navigation
        </Button>
      )}

      {/* Main action button - full width for single button, half width for dual buttons */}
      <Button
        variant="solid"
        style={[
          buttonConfig.buttonStyle === 'full' ? styles.fullWidthButton : styles.floatingButton,
          styles.startTripButton
        ]}
        textStyle={floatingButtonTextStyle}
        onPress={handleStartTrip}>
        {buttonConfig.buttonText}
      </Button>
    </View>
  );
};

const styles = ScaledSheet.create({
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: '20@vs', // Avoid tab bar overlap
    left: '16@s',
    right: '16@s',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
    paddingHorizontal: '8@s',
  },
  floatingButton: {
    flex: 1,
    marginHorizontal: '6@s',
    borderRadius: '25@s',
    minHeight: '40@vs',
    maxWidth: '160@s', // Prevent buttons from being too wide
  },
  fullWidthButton: {
    marginHorizontal: '6@s',
    borderRadius: '25@s',
    minHeight: '40@vs',
    width: '100%',
  },
  navigationButton: {
    backgroundColor: '#3B82F6',
  },
  startTripButton: {
    backgroundColor: '#10B981',
  },
});

export default FloatingActionButtons;
