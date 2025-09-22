import React from 'react';
import {View, ScrollView} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Text} from '@/components';
import {FBColors} from '@/types/styles';

type FillupOrderStateFlow = {
  state: string;
  timestamp: string;
  description: string;
};

type FillupOrderStateFlowProps = {
  orderStateFlow?: FillupOrderStateFlow[];
  currentState?: string;
};

const getStateColor = (state: string, isActive: boolean, isCompleted: boolean) => {
  if (isCompleted) return FBColors.primary;
  if (isActive) return '#FFA500';
  return '#E0E0E0';
};

const getStateIcon = (state: string, isActive: boolean, isCompleted: boolean) => {
  if (isCompleted) return '✓';
  if (isActive) return '●';
  return '○';
};

const defaultStates = [
  { state: 'PENDING', description: 'Order placed and pending approval' },
  { state: 'CONFIRMED', description: 'Order confirmed and ready for processing' },
  { state: 'IN_TRANSIT', description: 'Driver en route to delivery location' },
  { state: 'ARRIVED', description: 'Driver arrived at delivery location' },
  { state: 'DISPENSING', description: 'Fuel dispensing in progress' },
  { state: 'DELIVERED', description: 'Order completed successfully' },
];

const FillupOrderStateFlow: React.FC<FillupOrderStateFlowProps> = ({
  orderStateFlow = [],
  currentState = 'PENDING',
}) => {
  const states = orderStateFlow.length > 0 ? orderStateFlow : defaultStates;

  const getCurrentStateIndex = () => {
    return states.findIndex(state => state.state === currentState);
  };

  const currentStateIndex = getCurrentStateIndex();

  return (
    <View style={styles.container}>
      <Text size="base" weight="bold" color="neutral" style={styles.title}>
        Order Progress
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {states.map((stateItem, index) => {
          const isActive = index === currentStateIndex;
          const isCompleted = index < currentStateIndex;
          const stateColor = getStateColor(stateItem.state, isActive, isCompleted);
          const stateIcon = getStateIcon(stateItem.state, isActive, isCompleted);

          return (
            <View key={stateItem.state} style={styles.stateContainer}>
              <View style={styles.stateHeader}>
                <View style={[styles.stateCircle, { backgroundColor: stateColor }]}>
                  <Text size="sm" weight="bold" color="white">
                    {stateIcon}
                  </Text>
                </View>
                {index < states.length - 1 && (
                  <View style={[
                    styles.connectionLine,
                    { backgroundColor: isCompleted ? FBColors.primary : '#E0E0E0' }
                  ]} />
                )}
              </View>

              <View style={styles.stateContent}>
                <Text
                  size="xs"
                  weight={isActive ? 'bold' : 'normal'}
                  color={isActive ? 'primary' : 'neutral'}
                  style={styles.stateName}>
                  {stateItem.state.replace(/_/g, ' ')}
                </Text>
                <Text
                  size="xs"
                  color="steelBlue"
                  style={styles.stateDescription}>
                  {stateItem.description}
                </Text>
                {stateItem.timestamp && (
                  <Text size="xs" color="lightGray" style={styles.stateTimestamp}>
                    {new Date(stateItem.timestamp).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: 'white',
    padding: '16@s',
    borderRadius: '8@s',
    marginVertical: '8@vs',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: {
    marginBottom: '12@vs',
  },
  scrollContent: {
    paddingHorizontal: '4@s',
  },
  stateContainer: {
    alignItems: 'center',
    marginRight: '20@s',
    minWidth: '80@s',
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs',
  },
  stateCircle: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionLine: {
    height: '2@s',
    width: '20@s',
    marginLeft: '4@s',
  },
  stateContent: {
    alignItems: 'center',
    maxWidth: '80@s',
  },
  stateName: {
    textAlign: 'center',
    marginBottom: '2@vs',
  },
  stateDescription: {
    textAlign: 'center',
    lineHeight: '12@vs',
    marginBottom: '2@vs',
  },
  stateTimestamp: {
    textAlign: 'center',
    fontSize: '8@s',
  },
});

export default FillupOrderStateFlow;