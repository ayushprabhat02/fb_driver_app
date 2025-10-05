import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useTranslation} from 'react-i18next';

interface CustomDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  style?: any;
  isLoading?: boolean;
}

const CustomDateSelector: React.FC<CustomDateSelectorProps> = ({
  selectedDate,
  onDateChange,
  style,
  isLoading = false,
}) => {
  const {t} = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const months = [
    t('home.months.january'),
    t('home.months.february'),
    t('home.months.march'),
    t('home.months.april'),
    t('home.months.may'),
    t('home.months.june'),
    t('home.months.july'),
    t('home.months.august'),
    t('home.months.september'),
    t('home.months.october'),
    t('home.months.november'),
    t('home.months.december'),
  ];

  const weekDays = [
    t('home.weekDays.sun'),
    t('home.weekDays.mon'),
    t('home.weekDays.tue'),
    t('home.weekDays.wed'),
    t('home.weekDays.thu'),
    t('home.weekDays.fri'),
    t('home.weekDays.sat'),
  ];

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('home.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('home.yesterday');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('home.tomorrow');
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const renderDay = ({item}: {item: Date | null; index: number}) => {
    if (!item) {
      return <View style={styles.emptyDay} />;
    }

    const selected = isSelectedDate(item);
    const today = isToday(item);

    return (
      <TouchableOpacity
        style={[
          styles.dayButton,
          selected && styles.selectedDay,
          today && !selected && styles.todayDay,
        ]}
        onPress={() => {
          onDateChange(item);
          setShowCalendar(false);
        }}>
        <Text
          style={[
            styles.dayText,
            selected && styles.selectedDayText,
            today && !selected && styles.todayDayText,
          ]}>
          {item.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={[styles.navButton, isLoading && styles.disabledButton]}
          onPress={() => !isLoading && navigateDate('prev')}
          disabled={isLoading}>
          <Text style={[styles.navButtonText, isLoading && styles.disabledText]}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#007BFF" />
          ) : (
            <Text style={styles.calendarIcon}>📅</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, isLoading && styles.disabledButton]}
          onPress={() => !isLoading && navigateDate('next')}
          disabled={isLoading}>
          <Text style={[styles.navButtonText, isLoading && styles.disabledText]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => navigateMonth('prev')}>
                <Text style={styles.monthNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => navigateMonth('next')}>
                <Text style={styles.monthNavText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={styles.weekDaysContainer}>
              {weekDays.map(day => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Days */}
            <FlatList
              data={getDaysInMonth()}
              renderItem={renderDay}
              numColumns={7}
              keyExtractor={(item, index) =>
                item ? item.toISOString() : `empty-${index}`
              }
              style={styles.calendarGrid}
            />

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCalendar(false)}>
              <Text style={styles.closeButtonText}>{t('home.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const {width} = Dimensions.get('window');

const styles = ScaledSheet.create({
  container: {
    marginVertical: '8@vs',
    marginHorizontal: '0@s',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12@s',
    padding: '8@s',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navButton: {
    padding: '8@s',
    borderRadius: '8@s',
    backgroundColor: '#F8F9FA',
  },
  navButtonText: {
    fontSize: '20@s',
    fontWeight: 'bold',
    color: '#495057',
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    opacity: 0.6,
  },
  disabledText: {
    color: '#ADB5BD',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    marginHorizontal: '8@s',
  },
  dateText: {
    fontSize: '16@s',
    fontWeight: '600',
    color: '#212529',
    marginRight: '8@s',
  },
  calendarIcon: {
    fontSize: '16@s',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16@s',
    padding: '20@s',
    width: width * 0.9,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
  },
  monthNavButton: {
    padding: '8@s',
    borderRadius: '8@s',
    backgroundColor: '#F8F9FA',
  },
  monthNavText: {
    fontSize: '20@s',
    fontWeight: 'bold',
    color: '#495057',
  },
  monthYearText: {
    fontSize: '18@s',
    fontWeight: 'bold',
    color: '#212529',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: '8@vs',
  },
  weekDayText: {
    fontSize: '14@s',
    fontWeight: '600',
    color: '#6C757D',
    textAlign: 'center',
    width: (width * 0.9 - 40) / 7,
  },
  calendarGrid: {
    maxHeight: '300@vs',
  },
  emptyDay: {
    width: (width * 0.9 - 40) / 7,
    height: '40@vs',
  },
  dayButton: {
    width: (width * 0.9 - 40) / 7,
    height: '40@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8@s',
    marginVertical: '2@vs',
  },
  selectedDay: {
    backgroundColor: '#007BFF',
  },
  todayDay: {
    backgroundColor: '#E3F2FD',
  },
  dayText: {
    fontSize: '14@s',
    color: '#212529',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#007BFF',
    borderRadius: '8@s',
    paddingVertical: '12@vs',
    alignItems: 'center',
    marginTop: '16@vs',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: '16@s',
    fontWeight: 'bold',
  },
});

export default CustomDateSelector;