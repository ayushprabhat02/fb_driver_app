import {OrderService} from '@/services';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useLayoutEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {FocusAwareStatusBar, HeaderAvoidingContainer, Text} from '@/components';
import {AssetCard} from '../components';

// styles
import {Task_State_Enum} from '@/generated/graphql';
import {checkinStore, homeStore, orderStore} from '@/globalStore';
import {FBBackground} from '@/types/styles';

type RootStackParamList = {
  order: {
    screen: string;
  };
};

// Helper function to get asset data from currentDriverOrder
const getAssetsFromOrder = (orderData: any): Asset[] => {
  if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
    return [];
  }

  const order = orderData[0];
  if (!order.fillup_requests || !Array.isArray(order.fillup_requests)) {
    return [];
  }

  return order.fillup_requests.map(
    (request: any): Asset => ({
      id: request.id,
      name:
        request.vehicle_tank_type_product_variation?.product_variation?.product
          ?.name || 'Unknown Product',
      code:
        request.vehicle_tank_type_product_variation?.vehicle_tank_type
          ?.tank_type?.name || 'Unknown Tank',
      requestedQuantity: request.quantity || 0,
      filledQuantity: 0, // This would come from actual fill data
      unit: request.unit || 'liter',
      state: request.state,
      fuelRequestType: request.fuel_request_type,
    }),
  );
};

// Asset interface for component usage
interface Asset {
  id: string;
  name: string;
  code: string;
  requestedQuantity: number;
  filledQuantity: number;
  unit: string;
  state: string;
  fuelRequestType: string;
}

const FillAsset: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const driverVehicleId = checkinStore.use.driverVehicleId();
  const selectedDate = homeStore.use.selectedDate();
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const assets = getAssetsFromOrder(currentDriverOrder);

  console.log('---currentDriverOrder---', JSON.stringify(currentDriverOrder));

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Choose Asset',
      headerShown: true,
    });
  }, [navigation]);

  // Filter assets based on search query
  const filteredAssets = assets.filter(
    (asset: Asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate totals
  const totalQuantity = assets.reduce(
    (sum: number, asset: Asset) => sum + asset.requestedQuantity,
    0,
  );
  const filledQuantity = assets.reduce(
    (sum: number, asset: Asset) => sum + asset.filledQuantity,
    0,
  );
  const pendingQuantity = totalQuantity - filledQuantity;

  const handleDispense = (assetId: string) => {
    // Navigate to upload image asset page
    // @ts-ignore
    navigation.navigate('order', {
      screen: 'upload-image-asset',
    });
  };

  const handleProceed = () => {
    Alert.alert('Proceed', 'Proceeding with the order...');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes', style: 'destructive', onPress: () => navigation.goBack()},
      ],
    );
  };

  const fetchOrderForDriverIncompleteCurrent = async () => {
    // Convert selected delivery date to start and end of day timestamps
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const startDateString = `${year}-${month}-${day}T00:00:00`;
    const endDateString = `${year}-${month}-${day}T23:59:59`;
    await OrderService.fetchOrderForDriverIncomplete({
      limit: 1,
      offset: 0,
      state: [
        Task_State_Enum.Dispensing,
        Task_State_Enum.InTransit,
        Task_State_Enum.Arrived,
      ],
      driver_vehicle_id: driverVehicleId,
      start_date: startDateString,
      end_date: endDateString,
    });
  };

  useEffect(() => {
    fetchOrderForDriverIncompleteCurrent();
  }, []);

  return (
    <HeaderAvoidingContainer>
      <FocusAwareStatusBar
        backgroundColor={FBBackground.primary}
        barStyle="dark-content"
      />

      <View style={styles.container as ViewStyle}>
        <ScrollView
          style={styles.scrollView as ViewStyle}
          showsVerticalScrollIndicator={false}>
          {/* <AssetSummaryCard
            orderId="650761"
            totalQuantity={totalQuantity}
            filledQuantity={filledQuantity}
            pendingQuantity={pendingQuantity}
          /> */}

          {/* <AssetSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          /> */}

          {assets.length === 0 ? (
            <View style={styles.emptyState as ViewStyle}>
              <Text
                size="lg"
                weight="600"
                color="neutral"
                style={styles.emptyStateTitle as TextStyle}>
                No Assets Found
              </Text>
              <Text
                size="base"
                color="lightGray"
                style={styles.emptyStateMessage as TextStyle}>
                {currentDriverOrder
                  ? 'No fillup requests available for this order.'
                  : 'Loading order data...'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton as ViewStyle}
                onPress={fetchOrderForDriverIncompleteCurrent}
                activeOpacity={0.7}>
                <Text size="base" weight="600" color="white">
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredAssets.map((asset: Asset) => (
              <AssetCard
                key={asset.id}
                assetName={asset.name}
                assetCode={asset.code}
                requestedQuantity={asset.requestedQuantity}
                filledQuantity={asset.filledQuantity}
                unit={asset.unit}
                onDispense={() => handleDispense(asset.id)}
              />
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.cancelButton as ViewStyle}
          onPress={handleCancel}
          activeOpacity={0.7}>
          <Text size="base" weight="600" color="white">
            Cancel Request
          </Text>
        </TouchableOpacity>
      </View>
    </HeaderAvoidingContainer>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: '16@s',
    paddingTop: '16@vs',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '40@vs',
    paddingHorizontal: '20@s',
  },
  emptyStateTitle: {
    marginBottom: '8@vs',
    textAlign: 'center',
  },
  emptyStateMessage: {
    marginBottom: '24@vs',
    textAlign: 'center',
    lineHeight: '20@vs',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: '12@vs',
    paddingHorizontal: '24@s',
    borderRadius: '8@s',
    alignItems: 'center',
  },
});

export default FillAsset;
