// dependencies
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect} from 'react';

// components
import {Divider, Text} from '@/components';
import {FBBackground, FBBorders, FBColors} from '@/types/styles';

// services
import {DeliveryService} from '@/services';
import {getDateRangeArray} from '@/utils/general';

// store
import {deliveryStore} from '@/globalStore';

// types
import {Slot, SlotDate} from '../../types';

// To determine whether to disable or enable the slot button based on the slot date and slot start & end times.
const shouldShowSlot = (currentSlot: Slot) => {
  return DeliveryService.includeSlot(currentSlot);
};

const DateTime: React.FC = () => {
  const fetchedDeliverySlots = deliveryStore.use.fetchedDeliverySlots();
  const selectedDate = deliveryStore.use.selectedDate();
  const selectedSlot = deliveryStore.use.selectedSlot();
  const slotsToDisplay = deliveryStore.use.slotsToDisplay();
  const loaders = deliveryStore.use.loaders();

  const slots = getDateRangeArray(30);
  const datesToDisplay: SlotDate[] = [];

  /**
   * Function to change the selected date in delivery store
   * @param date
   */
  const changeDate = (date: string) => {
    if (selectedDate !== date) {
      deliveryStore.setState(state => ({
        ...state,
        selectedDate: date,
        selectedDateForDisplay: date,
        selectedSlot: undefined,
        selectedSlotForDisplay: undefined,
      }));
    }

    const updatedSlots =
      fetchedDeliverySlots?.find(slot => {
        return slot.date === (date as string);
      })?.slots || [];

    deliveryStore.setState(state => ({
      ...state,
      slotsToDisplay: updatedSlots,
    }));

    const firstAvailableSlot = updatedSlots.filter(shouldShowSlot);

    deliveryStore.setState(state => ({
      ...state,
      selectedSlot: firstAvailableSlot.length
        ? firstAvailableSlot[0]
        : undefined,
      selectedSlotForDisplay: firstAvailableSlot.length
        ? firstAvailableSlot[0]
        : undefined,
    }));
  };

  /**
   * Function to change the selected slot in delivery store
   * @param date
   */
  const changeSlot = (slot: Slot) => {
    deliveryStore.setState(state => ({
      ...state,
      selectedSlot: slot,
      selectedSlotForDisplay: slot,
    }));
  };

  slots.forEach(date => {
    fetchedDeliverySlots?.forEach(slot => {
      if (date.value === slot.value) {
        datesToDisplay.push({
          day: date.day,
          dayOfWeek: date.dayOfWeek,
          month: date.month,
          value: date.value,
          year: date.month,
        });
      }
    });
  });

  /**
   * automatically sets the first date and slot
   */
  useEffect(() => {
    if (!selectedDate && !selectedSlot) {
      const updatedSlots =
        fetchedDeliverySlots?.find(slot => {
          return slot.date === datesToDisplay[0]?.value;
        })?.slots || [];

      deliveryStore.setState(state => ({
        ...state,
        slotsToDisplay: updatedSlots,
      }));

      const firstAvailableSlot = updatedSlots.filter(shouldShowSlot);

      deliveryStore.setState(state => ({
        ...state,
        selectedDateForDisplay: datesToDisplay[0]?.value,
        selectedSlotForDisplay: firstAvailableSlot.length
          ? firstAvailableSlot[0]
          : undefined,
        selectedDate: datesToDisplay[0]?.value,
        selectedSlot: firstAvailableSlot.length
          ? firstAvailableSlot[0]
          : undefined,
      }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedDeliverySlots]);

  return (
    <View>
      <View style={{paddingHorizontal: 8, paddingTop: 16}}>
        <View
          style={{
            paddingHorizontal: 13,
            borderBottomWidth: 1,
            borderBottomColor: FBBorders.secondary,
            paddingBottom: 16,
          }}>
          <Text size="lg" weight="600">
            Date and Time
          </Text>
          <Divider />
          <Text size="sm" color="complementary">
            To enhance your experience, we kindly ask you to update date and
            time.
          </Text>
        </View>
      </View>
      {!loaders.fetchDeliverySlots ? (
        <>
          <View style={{paddingHorizontal: 6}}>
            <Divider />
            <Text size="sm" color="steelBlue" weight="600">
              Date
            </Text>
            <Divider />
            {datesToDisplay.length ? (
              <FlatList
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                data={datesToDisplay}
                renderItem={({item}) => (
                  <DateIndicator date={item} changeDate={changeDate} />
                )}
                keyExtractor={item => item.value}
                windowSize={7}
                initialNumToRender={6}
              />
            ) : (
              <View style={{paddingHorizontal: 24, marginTop: 20}}>
                <Text size="sm" color="error" weight="400">
                  No delivery dates available. Please choose a different address
                </Text>
              </View>
            )}
          </View>

          {selectedDate ? (
            <View style={{paddingHorizontal: 6}}>
              <Divider height={20} />
              <Text size="sm" color="steelBlue" weight="600">
                Time Slots
              </Text>
              <Divider />
              <View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{
                    maxHeight: Dimensions.get('window').height * 0.49,
                  }}
                  contentContainerStyle={{
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    rowGap: 10,
                    columnGap: 12,
                    paddingBottom: 10,
                  }}>
                  {!slotsToDisplay?.filter(shouldShowSlot).length ? (
                    <Text size="sm" color="lightGray" weight="400">
                      No slots available. Please choose a different date
                    </Text>
                  ) : (
                    slotsToDisplay.map(slot =>
                      slot.is_active ? (
                        <SlotIndicator
                          slot={slot}
                          key={slot.value}
                          changeSlot={changeSlot}
                        />
                      ) : null,
                    )
                  )}
                </ScrollView>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <View
          style={{
            height: 120,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            columnGap: 8,
          }}>
          <Text color="steelBlue">Fetching delivery slots</Text>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

type DateIndicatorProps = {
  date: SlotDate;
  changeDate: (date: string) => void;
};

const DateIndicator: React.FC<DateIndicatorProps> = ({date, changeDate}) => {
  const selectedDate = deliveryStore.use.selectedDate();

  return (
    <Pressable
      style={[
        styles.dateTimeContainer,
        selectedDate === date.value ? styles.active : {},
      ]}
      onPress={() => changeDate(date.value)}>
      <Text
        weight="600"
        size="sm"
        color={selectedDate === date.value ? 'white' : 'neutral'}>
        {date.day}
      </Text>
      <View style={{flexDirection: 'row', columnGap: 4, marginTop: 2}}>
        <Text
          weight="600"
          size="sm"
          color={selectedDate === date.value ? 'white' : 'neutral'}>
          {date.dayOfWeek}
        </Text>
        <Text
          weight="600"
          size="sm"
          color={selectedDate === date.value ? 'white' : 'neutral'}>
          {date.month}
        </Text>
      </View>
    </Pressable>
  );
};

type SlotIndicatorProps = {
  slot: Slot;
  changeSlot: (slot: Slot) => void;
};
const SlotIndicator: React.FC<SlotIndicatorProps> = ({slot, changeSlot}) => {
  const selectedSlot = deliveryStore.use.selectedSlot();

  return (
    <>
      <Pressable
        style={[
          styles.slotContainer,
          selectedSlot?.value === slot.value ? styles.activeSlot : {},
          {display: shouldShowSlot(slot) ? 'flex' : 'none'},
        ]}
        onPress={() => changeSlot(slot)}>
        <Text
          size="sm"
          weight="600"
          color={selectedSlot?.value === slot.value ? 'white' : 'secondary'}>
          {slot.title}
        </Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  dateTimeContainer: {
    height: 50,
    width: 60,
    marginVertical: 5,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: FBColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    color: FBColors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000', // Shadow color
        shadowOffset: {width: 0, height: 1}, // Shadow offset
        shadowOpacity: 0.15, // Shadow opacity
        shadowRadius: 2.22, // Shadow radius
      },
      android: {
        elevation: 1,
      },
    }),
  },

  active: {
    backgroundColor: FBBackground.complementary,
    borderWidth: 0,
    color: FBColors.white,
  },

  activeText: {
    color: FBColors.white,
  },

  slotContainer: {
    borderWidth: 1,
    borderColor: FBBorders.darkGreen,
    paddingVertical: 6,
    paddingHorizontal: 0,
    width: 150,
    alignItems: 'center',
    borderRadius: 100,
  },

  activeSlot: {
    backgroundColor: FBBackground.darkGreen,
  },
});

export default DateTime;
