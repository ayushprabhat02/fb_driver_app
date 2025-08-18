import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator, Text, Alert} from 'react-native';
import {DateTime} from 'luxon';

// store
import reportStore from '../store';

// services
import ReportService from '../services';

// components
import {HeaderAvoidingContainer, Divider} from '@/components';
import NoReports from '../components/NoReports';
import {ReportHeader, StatsDisplay} from '../components';

// Import the enum
import {Customer_Order_Item_State_Enum} from '@/generated/graphql';
import {businessStore} from '@/globalStore';
import {useNavigation} from '@react-navigation/native';
import {getBusinessRole} from '@/utils/general';
import Toast from 'react-native-toast-message';

type ReportView = 'owner' | 'user';

const ReportPage: React.FC = () => {
  const [reportView, setReportView] = useState<ReportView>('owner');
  const reportData = reportStore.use.customerOrderReportData();
  const reportDataIndividual =
    reportStore.use.customerOrderReportDataIndividual();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const loaders = reportStore.use.loaders();
  const startLoader = reportStore.use.startLoader();
  const stopLoader = reportStore.use.stopLoader();

  const [startDate, setStartDate] = useState<string>(() => {
    return DateTime.now().minus({days: 6}).toISODate();
    // return DateTime.now().startOf('month').toISODate();
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return DateTime.now().toISODate();
  });
  // State to track number of API calls
  const [apiCallCount, setApiCallCount] = useState<number>(0);

  useEffect(() => {
    startLoader('customerOrderReport');

    const role = getBusinessRole(activeDeliveryOrgUser);

    if (role === 'owner' || role === 'individual') {
      Promise.all([
        ReportService.getCustomerOrderReportIndividual({
          orderDateStart: `${startDate}T00:00:00Z`,
          orderDateEnd: `${endDate}T23:59:59Z`,
          state: [
            Customer_Order_Item_State_Enum.Delivered,
            // Customer_Order_Item_State_Enum.Pending,
            // Customer_Order_Item_State_Enum.Assigned,
            // Customer_Order_Item_State_Enum.Cancelled,
            // Customer_Order_Item_State_Enum.InTransit,
            // Customer_Order_Item_State_Enum.Rescheduled,
          ],
          organization_user_id: activeDeliveryOrgUser?.id,
        }),
        ReportService.getCustomerOrderReport({
          object: {
            start_date: `${startDate}T00:00:00Z`,
            end_date: `${endDate}T23:59:59Z`,
            state: [
              Customer_Order_Item_State_Enum.NoShow,
              Customer_Order_Item_State_Enum.Pending,
              Customer_Order_Item_State_Enum.Confirmed,
              Customer_Order_Item_State_Enum.Assigned,
              Customer_Order_Item_State_Enum.Cancelled,
              Customer_Order_Item_State_Enum.InTransit,
              Customer_Order_Item_State_Enum.Rescheduled,
              Customer_Order_Item_State_Enum.Accepted,
              Customer_Order_Item_State_Enum.Approval,
              Customer_Order_Item_State_Enum.Pickup,
            ],
            limit: 200,
            offset: 0,
            organization_user_id: activeDeliveryOrgUser?.id,
          },
        }),
      ])
        .then(() => {
          setReportView('owner');
          setApiCallCount(prevCount => prevCount + 1); // Increment after API call
        })
        .catch(error => {
          console.error('Failed to fetch customer order report:', error);
          Toast.show({
            type: 'error',
            text1: error,
          });
        })
        .finally(() => {
          stopLoader('customerOrderReport');
          // Alert.alert('maximum order fetched to be 200  ');
          // if (apiCallCount > 1 && reportData?.length > 0) {
          //   // Only show toast after second API call
          //   Toast.show({
          //     type: 'info',
          //     text1: 'A maximum of 200 orders will be downloaded.',
          //     text2: 'The order data is limited to 7 days.',
          //   });
          // }
        });
    } else {
      ReportService.getCustomerOrderReportIndividual({
        orderDateStart: `${startDate}T00:00:00Z`,
        orderDateEnd: `${endDate}T23:59:59Z`,
        state: [
          Customer_Order_Item_State_Enum.Delivered,
          // Customer_Order_Item_State_Enum.Pending,
          // Customer_Order_Item_State_Enum.Assigned,
          // Customer_Order_Item_State_Enum.Cancelled,
          // Customer_Order_Item_State_Enum.InTransit,
          // Customer_Order_Item_State_Enum.Rescheduled,
        ],
        organization_user_id: activeDeliveryOrgUser?.id,
      })
        .then(() => {
          setReportView('user');
          setApiCallCount(prevCount => prevCount + 1); // Increment after API call
        })
        .finally(() => {
          stopLoader('customerOrderReport');
          // if (apiCallCount >= 1 && reportData?.length > 0) {
          //   // Only show toast after second API call
          //   Toast.show({
          //     type: 'info',
          //     text1: 'A maximum of 200 orders will be downloaded.',
          //     text2: 'The order data is limited to 7 days.',
          //   });
          // }
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeDeliveryOrgUser]);

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    const adjustedEndDate = DateTime.max(
      DateTime.fromISO(newStartDate),
      DateTime.fromISO(newEndDate),
    ).toISODate();
    setStartDate(newStartDate);
    setEndDate(adjustedEndDate as string);
  };

  // Effect to handle the toast after the second API call
  useEffect(() => {
    if (
      apiCallCount > 1 &&
      (reportData?.length > 0 || reportDataIndividual?.length > 0)
    ) {
      // Only show toast after the second API call
      Toast.show({
        type: 'info',
        text1: 'A maximum of 200 orders will be downloaded.',
        text2: 'The order data is limited to 7 days.',
      });
    }
  }, [apiCallCount, reportData]);

  return (
    <HeaderAvoidingContainer>
      <View style={styles.container}>
        <ReportHeader
          statsData={reportData}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
        />
        <Divider />
        {loaders.customerOrderReport ? (
          <View
            style={{
              alignSelf: 'center',
              flex: 1,
              position: 'absolute',
              top: 200,
            }}>
            <ActivityIndicator size="large" />
            <Text
              style={{
                fontSize: 18,
                marginTop: 20,
              }}>
              Please wait, fetching delivery reports
            </Text>
          </View>
        ) : (
          <ReportView
            reportData={reportData.length ? reportData : reportDataIndividual}
            reportView={reportView}
          />
        )}
      </View>
    </HeaderAvoidingContainer>
  );
};

type ReportViewProps = {
  reportView: any;
  reportData: any;
};

const ReportView: React.FC<ReportViewProps> = ({reportView, reportData}) => {
  const navigation = useNavigation();

  if (reportView === 'owner') {
    return (
      <>
        {reportData.length > 0 ? (
          <StatsDisplay data={reportData} />
        ) : (
          <NoReports
            onOrderNow={() => {
              navigation.navigate('home', {screen: 'home-tab'});
            }}
          />
        )}
      </>
    );
  }

  if (reportView === 'user') {
    return (
      <>
        {reportData.length > 0 ? (
          <StatsDisplay data={reportData} />
        ) : (
          <NoReports
            onOrderNow={() => {
              navigation.navigate('home', {screen: 'home-tab'});
            }}
          />
        )}
      </>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5,
  },
});

export default ReportPage;
