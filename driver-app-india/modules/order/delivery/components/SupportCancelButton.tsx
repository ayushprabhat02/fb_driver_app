// dependencies
import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import {Headset, XCircle} from 'phosphor-react-native';

// components
import {IconButton} from '@/components';

// types
import {FBColors} from '@/types/styles';
import {orderStore} from '@/globalStore';

type Props = {
  setCancellationModalVisible: (visible: boolean) => void;
  canOrderCancel: boolean; // to check if cancel button should be shown or not
};

const SupportCancelButtons: React.FC<Props> = ({
  setCancellationModalVisible,
  canOrderCancel,
}) => {
  const navigation = useNavigation();

  const singleOrderDetailsId = orderStore.use.singleOrderDetailsId();

  const handleSupportPress = () => {
    navigation.navigate('support');
  };

  const handleCancelPress = () => {
    setCancellationModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {singleOrderDetailsId?.erp_code ? (
        canOrderCancel ? null : (
          <IconButton
            variant="outlined"
            onPress={handleCancelPress}
            style={{borderColor: FBColors.error}}>
            <IconButton.Icon>
              <XCircle color={FBColors.error} size={14} weight="bold" />
            </IconButton.Icon>
            <IconButton.Text textStyle={{color: FBColors.error}}>
              Cancel
            </IconButton.Text>
          </IconButton>
        )
      ) : null}
      {}
      <IconButton variant="solid" onPress={handleSupportPress}>
        <IconButton.Icon>
          <Headset color={FBColors.white} size={14} weight="bold" />
        </IconButton.Icon>
        <IconButton.Text>Support</IconButton.Text>
      </IconButton>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SupportCancelButtons;
