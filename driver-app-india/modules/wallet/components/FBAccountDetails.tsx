// dependencies
import {View} from 'react-native';
import React from 'react';

// store
import deliveryStore from '../store';

// components
import {Divider, Text} from '@/components';

const accountData = [
  {
    index: 2,
    title: 'IFSC Code',
    value: 'ICIC0000104',
  },
  {
    index: 3,
    title: 'Bank Name',
    value: 'ICICI Bank',
  },
  {
    index: 4,
    title: 'Beneficiary Name',
    value: 'FUELBUDDY',
  },
];

const FBAccountDetails: React.FC = () => {
  const currentWallet = deliveryStore.use.currentWallet();

  return (
    <View>
      <Text color="error" weight="600" size="sm">
        Please transfer the amount to the below account details using your Bank
        Account or any UPI app. Your wallet balance will be updated once the
        amount has reflected in the account below
      </Text>
      <Divider height={12} />
      <View style={{flexDirection: 'row', columnGap: 12}}>
        <Text style={{minWidth: 155}} size="sm">
          1. Account Number
        </Text>
        <Text color="error" weight="600" size="sm">
          {currentWallet?.van_code}
          {currentWallet?.van_number}
        </Text>
      </View>
      <View style={{rowGap: 8, marginTop: 8}}>
        {accountData.map(data => (
          <View style={{flexDirection: 'row', columnGap: 12}} key={data.index}>
            <Text style={{width: 155}} size="sm">
              {data.index}. {data.title}
            </Text>
            <Text color="error" weight="600" size="sm">
              {data.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default FBAccountDetails;
