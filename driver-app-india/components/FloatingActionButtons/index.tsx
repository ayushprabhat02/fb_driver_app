import React from 'react';
import {View, StyleSheet} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Button} from '@/components';
import {updateOrderQuantity} from '@/utils/orderUtil';
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
  // Define text style separately to avoid ScaledSheet typing issues
  const floatingButtonTextStyle = StyleSheet.create({
    text: {
      fontSize: 14,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      color: 'white',
    },
  }).text;

  const handleNavigation = () => {
    // Handle navigation
    console.log('Navigation pressed');
  };

  const handleStartTrip = () => {
    const currentOrder = currentFillupOrder || currentDriverOrder;
    const isFillupOrder =
      (currentFillupOrder as any)?.fillup_requests &&
      (currentFillupOrder as any)?.fillup_requests.length > 0;

    // update dispense quantity
    updateOrderQuantity(currentOrder);

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
  };

  // Don't render if conditions are not met
  if (
    !(currentFillupOrder || currentDriverOrder) ||
    !(
      allFillupsCompleted ||
      ((currentFillupOrder as any)?.fillup_requests &&
        (currentFillupOrder as any)?.fillup_requests.length > 0)
    )
  ) {
    return null;
  }

  return (
    <View style={styles.floatingButtonsContainer}>
      <Button
        variant="solid"
        style={[styles.floatingButton, styles.navigationButton]}
        textStyle={floatingButtonTextStyle}
        onPress={handleNavigation}>
        Navigation
      </Button>
      <Button
        variant="solid"
        style={[styles.floatingButton, styles.startTripButton]}
        textStyle={floatingButtonTextStyle}
        onPress={handleStartTrip}>
        Start Delivery
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
  navigationButton: {
    backgroundColor: '#3B82F6',
  },
  startTripButton: {
    backgroundColor: '#10B981',
  },
});

export default FloatingActionButtons;
