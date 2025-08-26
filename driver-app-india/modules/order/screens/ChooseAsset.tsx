import React, {useState, useLayoutEffect} from 'react';
import {ScrollView, View, Alert, ViewStyle} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';

// components
import {HeaderAvoidingContainer, FocusAwareStatusBar} from '@/components';
import {
  AssetSummaryCard,
  AssetSearchBar,
  AssetCard,
  AssetActionButtons,
} from '../components';

// styles
import {FBBackground} from '@/types/styles';

// Mock data - replace with actual data from your store/API
const mockAssets = [
  {
    id: '1',
    name: 'Test gender',
    code: 'TestGenset',
    requestedQuantity: 0,
    filledQuantity: 0,
  },
  {
    id: '2',
    name: 'Generator Unit 2',
    code: 'GenUnit2',
    requestedQuantity: 50,
    filledQuantity: 25,
  },
];

const ChooseAsset: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [assets] = useState(mockAssets);

  // Set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Choose Asset',
      headerShown: true,
    });
  }, [navigation]);

  // Filter assets based on search query
  const filteredAssets = assets.filter(
    asset =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate totals
  const totalQuantity = assets.reduce(
    (sum, asset) => sum + asset.requestedQuantity,
    0,
  );
  const filledQuantity = assets.reduce(
    (sum, asset) => sum + asset.filledQuantity,
    0,
  );
  const pendingQuantity = totalQuantity - filledQuantity;

  const handleDispense = (assetId: string) => {
    Alert.alert('Start Dispense', `Start dispensing for asset ${assetId}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Start', onPress: () => console.log('Dispense started')},
    ]);
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
          <AssetSummaryCard
            orderId="650761"
            totalQuantity={totalQuantity}
            filledQuantity={filledQuantity}
            pendingQuantity={pendingQuantity}
          />

          <AssetSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {filteredAssets.map(asset => (
            <AssetCard
              key={asset.id}
              assetName={asset.name}
              assetCode={asset.code}
              requestedQuantity={asset.requestedQuantity}
              filledQuantity={asset.filledQuantity}
              onDispense={() => handleDispense(asset.id)}
            />
          ))}
        </ScrollView>

        <AssetActionButtons onProceed={handleProceed} onCancel={handleCancel} />
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
});

export default ChooseAsset;
