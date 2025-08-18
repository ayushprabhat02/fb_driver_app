// dependencies
import {Pressable, ScrollView, View} from 'react-native';
import React from 'react';
import {X, CheckCircle} from 'phosphor-react-native';

// components
import {Text} from '@/components';

// store
import {orderStore} from '@/globalStore';

// types
import {FBBorders, FBColors} from '@/types/styles';
import {FetchCancellationReasonsByReasonTypeQuery} from '@/generated/graphql';

interface CancellationReasonListProps {
  closeList: () => void;
}

const CancellationReasonList: React.FC<CancellationReasonListProps> = ({
  closeList,
}) => {
  const cancellationReasons = orderStore.use.cancellationReasonsByReasonType();
  const cancellationReason = orderStore.use.cancellationReason();

  const chooseReason = (
    item: FetchCancellationReasonsByReasonTypeQuery['reasons'][0],
  ) => {
    orderStore.setState(state => ({
      ...state,
      cancellationReason: item,
    }));

    setTimeout(() => {
      closeList();
    }, 300);
  };

  return (
    <View
      style={{
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 24,
        borderRadius: 8,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 10,
        }}>
        <Text color="slate" weight="600">
          Select Reason
        </Text>
        <Pressable onPress={closeList}>
          <X size={24} color={FBColors.mediumGray} />
        </Pressable>
      </View>

      <ScrollView>
        {cancellationReasons.map(item => {
          return (
            <Pressable
              onPress={() => chooseReason(item)}
              key={item.id}
              style={{
                height: 50,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomColor: FBBorders.secondary,
              }}>
              <Text size="sm" color="steelBlue" weight="400">
                {item.reason}
              </Text>
              {cancellationReason?.id === item.id && (
                <CheckCircle size={24} color={FBColors.primary} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CancellationReasonList;
