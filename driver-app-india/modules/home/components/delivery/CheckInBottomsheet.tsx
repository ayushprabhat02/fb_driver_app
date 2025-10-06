import React, {forwardRef} from 'react';
import {View, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {Button, Divider, SimpleBottomSheet, Text} from '@/components';
import { useNavigation } from '@react-navigation/native';

interface CheckInBottomSheetProps {
  handleCheckIn: () => void;
  closeSheet: () => void;
}

const CheckInBottomsheet = forwardRef<
  BottomSheetModal,
  CheckInBottomSheetProps
>(({handleCheckIn, closeSheet}, ref) => {
  const snapPoints = ['80%'];
  const navigation = useNavigation();

  const handleLogout = () => {
    // @ts-ignore
    navigation.navigate('checkout');
  };

  const truckImage = require('@/assets/home/truck-fuelbuddy.png');

  return (
    <SimpleBottomSheet
      ref={ref}
      snapPoints={snapPoints}
      closeSheet={closeSheet}>
      <BottomSheetView>
        <View style={styles.container}>
          <Image source={truckImage} style={styles.image} />

          <Text size="lg" weight="700" color="secondary">
            Bowser assigned for today is
          </Text>
          <Divider height={10} />
          <Text size="xl" weight="400" color="secondary">
            FB test Bowser - FO
          </Text>
          <Divider height={10} />

          <Text size="sm" weight="700" color="secondary">
            FB test Bowser
          </Text>
          <Divider height={10} />

          <TouchableOpacity>
            <Text
              size="sm"
              color="complementary"
              weight="bold"
              style={{marginBottom: 10, textAlign: 'center'}}>
              View My Shift Schedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text
              size="sm"
              color="complementary"
              weight="bold"
              style={{marginBottom: 10, textAlign: 'center'}}>
              Raise a Request
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Text
              size="sm"
              color="complementary"
              weight="bold"
              style={{marginBottom: 10, textAlign: 'center'}}>
              Logout
            </Text>
          </TouchableOpacity>

          <Button
            style={styles.button}
            variant="solid"
            onPress={handleCheckIn}
            loading={false}
            disabled={false}>
            Check In
          </Button>
        </View>
      </BottomSheetView>
    </SimpleBottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    width: '90%',
  },
  image: {
    width: 150,
    height: 150,
    // marginBottom: 20,
    resizeMode: 'contain',
  },
});

export default CheckInBottomsheet;