// dependencies
import {View} from 'react-native';
import React, {useState} from 'react';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

// components
import {Divider, Text} from '@/components';

// types and styles
import {FBBackground, FBColors} from '@/types/styles';
import {commonInputStyles} from '@/styles';

type Props = {
  walletLimit: string;
  setWalletLimit: React.Dispatch<React.SetStateAction<string>>;
  noWalletLimit: boolean;
  setNoWalletLimit: React.Dispatch<React.SetStateAction<boolean>>;
};

const MAX_LIMIT = 100000000; // 10,00,00,000

const WalletLimit: React.FC<Props> = ({
  walletLimit,
  setWalletLimit,
  noWalletLimit,
  setNoWalletLimit,
}) => {
  const [walletLimitError, setWalletLimitError] = useState<boolean>(false);

  const textComponent = () => (
    <Text style={{marginLeft: 10, color: FBColors.neutral}}>
      No wallet limit
    </Text>
  );

  const handleChangeText = (text: string) => {
    // Remove any non-numeric characters (e.g., commas) and parse to number
    const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);

    // Check if the value exceeds the max limit
    if (numericValue <= MAX_LIMIT || isNaN(numericValue)) {
      setWalletLimit(text);
      setWalletLimitError(false);
    } else {
      setWalletLimitError(true);
      // Optionally, show a message to the user indicating the max limit has been reached
      // alert(`The maximum wallet limit is ₹${MAX_LIMIT.toLocaleString()}`);
    }
  };

  return (
    <View>
      <Text weight="600">Wallet Limit</Text>
      <Divider />
      <View
        style={[
          commonInputStyles,
          {
            height: 40,
            fontSize: 14,
            color: FBColors.neutral,
            paddingVertical: 0,
            alignItems: 'center',
            columnGap: 10,
            flexDirection: 'row',
            width: '70%',
            backgroundColor: noWalletLimit
              ? FBBackground.disabled
              : FBBackground.white,
          },
        ]}>
        <Text>₹</Text>
        <BottomSheetTextInput
          keyboardType="numeric"
          editable={!noWalletLimit}
          maxLength={9}
          value={walletLimit}
          onChangeText={handleChangeText}
          style={{
            fontSize: 16,
            color: FBColors.neutral,
            paddingVertical: 0,
            width: '85%',
          }}
        />
      </View>
      {walletLimitError ? (
        <>
          <View style={{marginTop: 5}}>
            <Text color="error" size="xs" weight="500">
              Max wallet limit is 10,00,00,000 ( 10 crore )
            </Text>
          </View>
        </>
      ) : null}
      <Divider height={16} />
      <BouncyCheckbox
        size={24}
        fillColor={FBColors.complementary}
        unfillColor={FBColors.white}
        isChecked={noWalletLimit}
        textComponent={textComponent()}
        onPress={() => {
          setNoWalletLimit(!noWalletLimit);
        }}
      />
    </View>
  );
};

export default WalletLimit;
