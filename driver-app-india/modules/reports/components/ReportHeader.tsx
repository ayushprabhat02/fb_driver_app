// dependencies
import React from 'react';
import {View, StyleSheet} from 'react-native';

// components
import {DateRangePicker} from './index';

interface ReportHeaderProps {
  statsData: any;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
}) => {
  return (
    <View style={styles.header}>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
});

export default ReportHeader;
