export type MarkedDate = {
  startingDay?: boolean;
  endingDay?: boolean;
  color: string;
  textColor: string;
};

export type DateRangeSelectorProps = {
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
};

export type MarkedDates = {
  [date: string]: MarkedDate;
};
