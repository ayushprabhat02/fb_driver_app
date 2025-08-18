import React, {useEffect, useState} from 'react';
import {View, Dimensions, StyleSheet, Platform} from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryLegend,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryScatter,
} from 'victory-native';
import Toast from 'react-native-toast-message';
import {Divider, IconButton, Text} from '@/components';
import Icon from 'react-native-vector-icons/FontAwesome';
import {ms} from 'react-native-size-matters';
import {generateAndShareCSV, getBusinessRole} from '@/utils/general';
import {formatDeliveryReportData} from '@/modules/reports/utlis/chartUtils';
import reportStore from '../store';
import ReportService from '../services';
import {FBColorPalette, FBColors} from '@/types/styles';
import {json2csv} from 'json-2-csv';

import {
  Customer_Order_Item,
  FetchCustomerOrganizationOrdersQuery,
} from '@/generated/graphql';
import * as ScopedStorage from 'react-native-scoped-storage';
import {businessStore} from '@/globalStore';

const screenWidth = Dimensions.get('window').width;

interface DeliveryTrendGraphProps {
  data: FetchCustomerOrganizationOrdersQuery['fetchCustomerOrganizationOrders']['data'];
}

const DeliveryTrendGraph: React.FC<DeliveryTrendGraphProps> = ({data}) => {
  const formattedData = formatDeliveryReportData(data as Customer_Order_Item[]);
  const tooltipStyle = {
    fill: FBColors.primary,
    fontSize: 12,
  };

  const reportData = reportStore.use.customerOrderReportData();
  const reportDataIndividual =
    reportStore.use.customerOrderReportDataIndividual();
  const activeDeliveryOrgUser = businessStore.use.activeDeliveryOrgUser();
  const [visibleDatasets, setVisibleDatasets] = useState([true, true]);

  const [userType, setUserType] = useState<'user' | 'owner' | 'individual'>(
    'user',
  );

  const toggleDatasetVisibility = (index: number) => {
    setVisibleDatasets(prev => {
      const newVisibleDatasets = [...prev];
      newVisibleDatasets[index] = !newVisibleDatasets[index];
      return newVisibleDatasets;
    });
  };

  const downloadInvoice = async () => {
    const report = ReportService.deliveryOrderReports({
      customerOrderItems: reportData.sort((a, b) => {
        return (
          new Date(b.customer_order?.order_date).getTime() -
          new Date(a.customer_order?.order_date).getTime()
        );
      }),
    });
    const timeStamp = Date.now();
    if (Platform.OS === 'android') {
      if (report.length) {
        const currencyFixedData = report.map((item: any) => ({
          ...item,
        }));
        const csvData = json2csv(currencyFixedData);
        const sanitizedCsvData = csvData?.replace(/Â/g, '');

        let dir = await ScopedStorage.openDocumentTree(true);

        await ScopedStorage.writeFile(
          dir.uri,
          sanitizedCsvData,
          `order_report${timeStamp}.csv`,
          'csv',
          'utf8',
        ).then(() => {
          Toast.show({
            type: 'success',
            text1: 'File downloaded!',
            text2: dir?.name ? `Report downloaded in ${dir.name} folder` : '',
          });
        });
      }
    } else {
      await generateAndShareCSV(report, `order_report${timeStamp}.csv`);
    }
  };

  const downloadInvoiceIndividual = async () => {
    const report = ReportService.deliveryOrderReports({
      customerOrderItems: reportDataIndividual,
    });
    const timeStamp = Date.now();

    if (Platform.OS === 'android') {
      if (report.length) {
        // Define custom formatting for currency fields
        const currencyFixedData = report.map((item: any) => ({
          ...item,
        }));
        const csvData = json2csv(currencyFixedData);
        const sanitizedCsvData = csvData?.replace(/Â/g, '');

        let dir = await ScopedStorage.openDocumentTree(true);

        await ScopedStorage.writeFile(
          dir.uri,
          sanitizedCsvData,
          `order_report${timeStamp}.csv`,
          'csv',
          'utf8',
        ).then(() => {
          Toast.show({
            type: 'success',
            text1: 'File Downloaded!',
            text2: dir?.name ? `Report downloaded in ${dir.name} folder` : '',
          });
        });
      }
    } else {
      await generateAndShareCSV(report, `order_report${timeStamp}`);
    }
  };

  useEffect(() => {
    const role = getBusinessRole(activeDeliveryOrgUser);

    setUserType(role as 'user' | 'owner' | 'individual');
  }, [activeDeliveryOrgUser]);

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.header}>
          <Text weight="bold" size="xl">
            Delivery Reports
          </Text>
        </View>
        <Divider height={20} />
        <Text weight="bold" size="sm">
          {visibleDatasets[0] && !visibleDatasets[1]
            ? `Delivered Quantity: ${formattedData.deliveredQtyData.reduce(
                (total, item) => total + item.y,
                0,
              )} litres`
            : !visibleDatasets[0] && visibleDatasets[1]
            ? `Ordered Quantity: ${formattedData.orderedQtyData.reduce(
                (total, item) => total + item.y,
                0,
              )} litres`
            : ''}
        </Text>
        <Divider height={20} />
        <VictoryChart theme={VictoryTheme.material} width={screenWidth - 40}>
          <VictoryAxis
            tickValues={formattedData.orderedQtyData.map(item => item.x)}
            label="Date"
            style={{
              axisLabel: {padding: 30},
            }}
          />
          <VictoryAxis
            dependentAxis
            label="Quantity (L)"
            style={{
              axisLabel: {padding: 40},
            }}
            tickFormat={tick => tick.toFixed(0)} // Round off to 2 decimal places
          />
          {visibleDatasets[0] && (
            <VictoryLine
              data={formattedData.deliveredQtyData}
              style={{
                data: {stroke: FBColors.primary, strokeWidth: 3},
              }}
            />
          )}
          {visibleDatasets[0] && (
            <VictoryScatter
              data={formattedData.deliveredQtyData}
              size={4}
              style={{
                data: {fill: FBColors.primary},
              }}
              labels={({datum}) =>
                `Date: ${datum.x}\nDelivered: ${datum.y?.toFixed(2)}L`
              }
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{stroke: FBColors.primary}}
                  style={tooltipStyle}
                  flyoutPadding={{top: 10, bottom: 10, left: 10, right: 10}}
                  flyoutWidth={150}
                  flyoutHeight={50}
                  pointerLength={5}
                  cornerRadius={5}
                />
              }
            />
          )}

          {visibleDatasets[1] && (
            <VictoryLine
              data={formattedData.orderedQtyData}
              style={{data: {stroke: '#c5ced9'}}}
            />
          )}
          {visibleDatasets[1] && (
            <VictoryScatter
              data={formattedData.orderedQtyData}
              size={4}
              style={{
                data: {fill: '#c5ced9'},
              }}
              labels={({datum}) =>
                `Date: ${datum.x}\nOrdered: ${datum.y?.toFixed(2)}L`
              }
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{stroke: '#c5ced9'}}
                  style={tooltipStyle}
                />
              }
            />
          )}

          <VictoryLegend
            orientation="horizontal"
            gutter={20}
            style={{
              labels: {fontSize: 14},
              data: {
                strokeWidth: ({index}) =>
                  visibleDatasets[index as number] ? 1 : 0,
                opacity: ({index}) =>
                  visibleDatasets[index as number] ? 1 : 0.5,
              },
            }}
            data={[
              {
                name: 'Delivered Quantity',
                symbol: {fill: '#10b981', type: 'line'},
              },
              {
                name: 'Ordered Quantity',
                symbol: {fill: '#c5ced9', type: 'line'},
              },
            ]}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onPressIn: (evt, clickedProps) => {
                    toggleDatasetVisibility(clickedProps.index);
                  },
                },
              },
              {
                target: 'labels',
                eventHandlers: {
                  onPressIn: (evt, clickedProps) => {
                    toggleDatasetVisibility(clickedProps.index);
                  },
                },
              },
            ]}
          />
        </VictoryChart>
        <Divider />
        <View style={{width: '100%'}}>
          <View>
            <IconButton variant="outlined" onPress={downloadInvoiceIndividual}>
              <IconButton.Icon>
                <Icon
                  name="download"
                  color={FBColorPalette.complementary}
                  size={ms(15)}
                />
              </IconButton.Icon>
              <IconButton.Text
                textStyle={{
                  color: FBColorPalette.complementary,
                  fontSize: ms(15),
                }}>
                Download My Report
              </IconButton.Text>
            </IconButton>
          </View>
          {userType === 'owner' ? (
            <>
              <Divider />
              <IconButton variant="outlined" onPress={downloadInvoice}>
                <IconButton.Icon>
                  <Icon
                    name="download"
                    color={FBColorPalette.complementary}
                    size={ms(15)}
                  />
                </IconButton.Icon>
                <IconButton.Text
                  textStyle={{
                    color: FBColorPalette.complementary,
                    fontSize: ms(15),
                  }}>
                  Download My Organisation Report
                </IconButton.Text>
              </IconButton>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});

export default DeliveryTrendGraph;
