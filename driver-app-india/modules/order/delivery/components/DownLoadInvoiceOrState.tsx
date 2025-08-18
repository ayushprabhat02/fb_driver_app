// dependencies
import {Download} from 'phosphor-react-native';
import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import {Platform} from 'react-native';
import * as ScopedStorage from 'react-native-scoped-storage';

// Store
import {IconButton} from '@/components';
import orderStore from '../../store';

// Imports
import {Text} from '@/components';
import {FBColors} from '@/types/styles';

// Types
import {Customer_Order_State_Enum} from '@/generated/graphql';

type DownloadButtonProps = {
  fetchInvoice: string;
};

const DownloadButton: React.FC<DownloadButtonProps> = ({fetchInvoice}) => {
  const downloadPDF = async () => {
    if (!fetchInvoice) {
      return;
    }
    if (Platform.OS === 'android') {
      let dir = await ScopedStorage.openDocumentTree(true);
      const timeStamp = Date.now();

      await ScopedStorage.writeFile(
        dir.uri,
        fetchInvoice,
        `order_report${timeStamp}.pdf`,
        'pdf',
        'base64',
      ).then(() => {
        Toast.show({
          type: 'success',
          text1: 'Invoice downloaded successfully',
          text2: dir?.name ? `Invoice downloaded in ${dir.name} folder` : '',
        });
      });

      return;
    }
    try {
      const pdfPath = `${RNFS.DocumentDirectoryPath}/order_invoice.pdf`;
      await RNFS.writeFile(pdfPath, fetchInvoice, 'base64');

      const shareOptions = {
        url: pdfPath,
        type: 'application/pdf',
        filename: 'order_invoice.pdf',
      };

      await Share.open(shareOptions);
      Toast.show({
        type: 'success',
        text1: 'File downloaded!',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <IconButton variant="solid" onPress={downloadPDF}>
      <IconButton.Text>Invoice</IconButton.Text>
      <IconButton.Icon>
        <Download color={FBColors.white} size={14} weight="bold" />
      </IconButton.Icon>
    </IconButton>
  );
};
type OrderStateProps = {
  state: Customer_Order_State_Enum | undefined;
};

const OrderState: React.FC<OrderStateProps> = ({state}) => {
  const singleOrderDetails = orderStore.use.singleOrderDetailsId();
  const getStateColor = (orderState: Customer_Order_State_Enum | undefined) => {
    switch (orderState) {
      case Customer_Order_State_Enum.Confirmed:
        return 'secondary';
      case Customer_Order_State_Enum.Delivered:
        return 'primary';
      case Customer_Order_State_Enum.Cancelled:
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getPaymentMethod = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'POD': {
        return 'Pay on delivery';
      }

      case 'COD': {
        return 'Cheque on delivery';
      }

      case 'PAY_LATER': {
        return 'Cheque on delivery';
      }

      default: {
        return paymentMethod;
      }
    }
  };

  const getPaymentMethodFromState = (payState: Customer_Order_State_Enum) => {
    switch (payState) {
      case Customer_Order_State_Enum.PayLater: {
        return 'Cheque on delivery';
      }

      case Customer_Order_State_Enum.Cancelled: {
        return 'Cancelled';
      }

      case Customer_Order_State_Enum.Confirmed: {
        return 'Paid';
      }

      case Customer_Order_State_Enum.Paid: {
        return 'Paid';
      }

      case Customer_Order_State_Enum.Delivered: {
        return 'Delivered';
      }

      default: {
        return payState;
      }
    }
  };
  return (
    <View style={{alignItems: 'center', paddingTop: 4}}>
      <Text color={getStateColor(state)}>
        {state !== 'CANCELLED'
          ? singleOrderDetails?.organizationAddressByShippingAddressId
              ?.organization_address_payment_methods[0]?.customer_payment_method
              ?.value === 'POD' ||
            singleOrderDetails?.organizationAddressByShippingAddressId
              ?.organization_address_payment_methods[0]?.customer_payment_method
              ?.value === 'COD'
            ? getPaymentMethod(
                singleOrderDetails?.organizationAddressByShippingAddressId
                  ?.organization_address_payment_methods[0]
                  ?.customer_payment_method?.value as string,
              )
            : getPaymentMethodFromState(state as Customer_Order_State_Enum)
          : getPaymentMethodFromState(state as Customer_Order_State_Enum)}
        {/* {singleOrderDetails?.organizationAddressByShippingAddressId
          ?.organization_address_payment_methods[0]?.customer_payment_method
          ?.value === 'POD' ||
        singleOrderDetails?.organizationAddressByShippingAddressId
          ?.organization_address_payment_methods[0]?.customer_payment_method
          ?.value === 'COD'
          ? getPaymentMethod(
              singleOrderDetails?.organizationAddressByShippingAddressId
                ?.organization_address_payment_methods[0]
                ?.customer_payment_method?.value as string,
            )
          : getPaymentMethodFromState(state as Customer_Order_State_Enum)}{' '} */}
        {/* ({' '}
        {
          singleOrderDetails?.organizationAddressByShippingAddressId
            ?.organization_address_payment_methods[0]?.customer_payment_method
            ?.value as string
        }{' '}
        ) */}
        {/* {getPaymentMethod(
          singleOrderDetails?.organizationAddressByShippingAddressId
            ?.organization_address_payment_methods[0]?.customer_payment_method
            ?.value as string,
        )} */}
      </Text>
    </View>
  );
};

const DownLoadInvoiceOrState: React.FC = () => {
  const singleOrderDetails = orderStore.use.singleOrderDetailsId();
  const fetchInvoice = orderStore.use.fetchInvoices();
  const loader = orderStore.use.loaders();

  return (
    <View>
      {loader.fetchInvoices ? (
        <View>
          <ActivityIndicator />
        </View>
      ) : singleOrderDetails?.invoices?.length && fetchInvoice ? (
        <DownloadButton fetchInvoice={fetchInvoice} />
      ) : (
        <OrderState state={singleOrderDetails?.state} />
      )}
    </View>
  );
};

export default DownLoadInvoiceOrState;
