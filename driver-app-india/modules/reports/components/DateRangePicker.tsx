import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import Calendar from 'react-native-calendars/src/calendar';
import Modal from 'react-native-modal';
import {ms} from 'react-native-size-matters';
import {DateTime} from 'luxon';
// components
import {Button, Text} from '@/components';

// types
import {FBColors} from '@/types/styles';
import {DateRangeSelectorProps, MarkedDates} from '../types';

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
}) => {
  const initialEndDate = DateTime.now().toISODate();
  const initialStartDate = DateTime.now().minus({days: 7}).toISODate();

  const [showModal, setShowModal] = useState(false);
  const [isStartDateSelected, setIsStartDateSelected] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    initialStartDate || null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(
    initialEndDate || null,
  );
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedMonth, setSelectedMonth] = useState<string>(
    startDate
      ? DateTime.fromISO(startDate).toISODate()
      : DateTime.now().toISODate(),
  );

  useEffect(() => {
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    updateMarkedDates(startDate, endDate);
  }, []);

  // const formatDateRange = () => {
  //   const formattedStartDate = selectedStartDate
  //     ? DateTime.fromISO(selectedStartDate).toFormat('MMM yyyy')
  //     : 'Select Month';

  //   return formattedStartDate;
  // };

  const updateMarkedDates = (startDate: string, endDate: string) => {
    const result: MarkedDates = {
      [startDate]: {
        startingDay: true,
        color: FBColors.primary,
        textColor: 'white',
      },
      [endDate]: {
        endingDay: true,
        color: FBColors.primary,
        textColor: 'white',
      },
    };

    let currentDate = DateTime.fromISO(startDate);
    const endDateObj = DateTime.fromISO(endDate);

    while (currentDate < endDateObj) {
      currentDate = currentDate.plus({days: 1});
      const dateString = currentDate.toISODate();
      if (dateString && dateString !== endDate) {
        result[dateString] = {
          color: FBColors.primary,
          textColor: 'white',
        };
      }
    }

    setMarkedDates(result);
  };

  const isSameMonth = (date1: string, date2: string) => {
    const date1Obj = DateTime.fromISO(date1);
    const date2Obj = DateTime.fromISO(date2);
    return date1Obj.month === date2Obj.month && date1Obj.year === date2Obj.year;
  };

  const handleDayPress = (day: {dateString: string}) => {
    const selectedDate = day.dateString;

    if (!isStartDateSelected) {
      // Start a new selection process
      setSelectedStartDate(selectedDate);
      setSelectedEndDate(null); // Clear any previous end date
      setIsStartDateSelected(true);
      setMarkedDates({
        [selectedDate]: {
          startingDay: true,
          color: FBColors.primary,
          textColor: 'white',
        },
      });
    } else {
      if (!selectedStartDate) return;

      const startDateObj = DateTime.fromISO(selectedStartDate);
      const endDateObj = DateTime.fromISO(selectedDate);

      // If the user clicks a new start date that is earlier than the current one, reset
      if (endDateObj < startDateObj) {
        setSelectedStartDate(selectedDate);
        setSelectedEndDate(null); // Clear any previous end date
        setMarkedDates({
          [selectedDate]: {
            startingDay: true,
            color: FBColors.primary,
            textColor: 'white',
          },
        });
        setIsStartDateSelected(true); // Reset to start selection again
        return;
      }

      // Check if the end date is before the start date
      if (endDateObj < startDateObj) {
        Alert.alert(
          'Invalid Date Selection',
          'End date cannot be earlier than the start date. Please select a valid end date.',
        );
        return;
      }

      // Check if both dates are in the same month
      // if (!isSameMonth(selectedStartDate, selectedDate)) {
      //   Alert.alert(
      //     'Invalid Date Selection',
      //     'Please select both start and end dates within the same month.',
      //   );
      //   return;
      // }

      // Check if the selected range exceeds 7 days
      const daysDifference = endDateObj.diff(startDateObj, 'days').days;
      if (daysDifference >= 7) {
        Alert.alert(
          'Invalid Date Selection',
          'You can only select a maximum of 7 days. Please adjust your selection.',
        );
        return;
      }

      // Valid end date
      setSelectedEndDate(selectedDate);
      updateMarkedDates(selectedStartDate, selectedDate);
      setIsStartDateSelected(false); // Reset for next selection
    }
  };

  // const handleDayPress = (day: {dateString: string}) => {
  //   const selectedDate = day.dateString;

  //   if (!isStartDateSelected) {
  //     // Start a new selection process
  //     setSelectedStartDate(selectedDate);
  //     setSelectedEndDate(null); // Clear any previous end date
  //     setIsStartDateSelected(true);
  //     setMarkedDates({
  //       [selectedDate]: {
  //         startingDay: true,
  //         color: FBColors.primary,
  //         textColor: 'white',
  //       },
  //     });
  //   } else {
  //     if (!selectedStartDate) return;

  //     const startDateObj = DateTime.fromISO(selectedStartDate);
  //     const endDateObj = DateTime.fromISO(selectedDate);

  //     // Check if the end date is before the start date
  //     // if (endDateObj < startDateObj) {
  //     //   Alert.alert(
  //     //     'Invalid Date Selection',
  //     //     'End date cannot be earlier than the start date. Please select a valid end date.',
  //     //   );
  //     //   return;
  //     // }

  //     // Check if both dates are in the same month
  //     // if (!isSameMonth(selectedStartDate, selectedDate)) {
  //     //   Alert.alert(
  //     //     'Invalid Date Selection',
  //     //     'Please select both start and end dates within the same month.',
  //     //   );
  //     //   return;
  //     // }

  //     // Check if the user selected more than 7 days
  //     const daysDifference = endDateObj.diff(startDateObj, 'days').days;
  //     if (daysDifference > 6) {
  //       // 7 days limit, but difference is 6 (start to end is 7 days total)
  //       Alert.alert(
  //         'Invalid Date Selection',
  //         'You can select up to 7 days only. Please adjust your selection.',
  //       );
  //       return;
  //     }

  //     // Check if the end date is before the start date
  //     if (endDateObj < startDateObj) {
  //       // Swap the start and end dates
  //       const newStartDate = selectedDate;
  //       const newEndDate = selectedStartDate;

  //       // Update the state with swapped dates
  //       setSelectedStartDate(newStartDate);
  //       setSelectedEndDate(newEndDate);

  //       // Update marked dates after swapping
  //       updateMarkedDates(newStartDate, newEndDate);
  //     } else {
  //       // Valid end date (end is after start)
  //       setSelectedEndDate(selectedDate);
  //       updateMarkedDates(selectedStartDate, selectedDate);
  //       setIsStartDateSelected(false); // Reset for next selection
  //     }

  //     // Valid end date
  //     setSelectedEndDate(selectedDate);
  //     updateMarkedDates(selectedStartDate, selectedDate);
  //     setIsStartDateSelected(false); // Reset for next selection
  //   }
  // };

  const handleMonthSelection = (month: number, year: number) => {
    const selectedMonth = DateTime.fromObject({year, month})
      .startOf('month')
      .toISODate();
    setSelectedMonth(selectedMonth);
  };

  const handleDone = () => {
    if (
      selectedStartDate &&
      selectedEndDate
      // && isSameMonth(selectedStartDate, selectedEndDate)
    ) {
      onDateRangeChange(selectedStartDate, selectedEndDate);
      setShowModal(false);
    } else {
      // Alert.alert(
      //   'Invalid Date Range',
      //   'Please select both start and end dates within the same month.',
      // );
    }
  };

  const handleOpenModal = () => {
    const monthToSet =
      selectedStartDate || selectedEndDate || DateTime.now().toISODate();
    setSelectedMonth(monthToSet); // Ensure the calendar opens to the correct month
    setShowModal(true);
  };

  const formatDateRange = () => `${startDate} - ${endDate}`;

  return (
    <View>
      <Button
        variant="outlined"
        style={{width: '88%', height: ms(40)}}
        onPress={handleOpenModal}>
        <Text>
          {formatDateRange()}
          {/* {DateTime.fromISO(selectedStartDate ?? '').toFormat('dd MMM yyyy')} -
          {DateTime.fromISO(selectedEndDate ?? '').toFormat('dd MMM yyyy')} */}
        </Text>
      </Button>
      <Modal
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        onBackButtonPress={() => setShowModal(false)}
        style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="period"
            maxDate={DateTime.now().toISODate()}
            monthFormat={'MMMM yyyy'}
            onMonthChange={month =>
              handleMonthSelection(month.month, month.year)
            }
            current={selectedMonth}
          />
          <Button variant="outlined" onPress={handleDone}>
            <Text color="primary">Done</Text>
          </Button>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default DateRangeSelector;
