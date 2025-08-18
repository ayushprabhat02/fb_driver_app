// dependencies
import React, {useMemo} from 'react';
import {View, TextStyle} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import {DateTime} from 'luxon';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';

// components
import {FBBackground, FBColors} from '@/types/styles';
import {Divider, Text} from '@/components';

import {
  FetchDeliveryOrderByIdQuery,
  FetchDeliveryOrderByStateQuery,
  FetchOrderItemStatusQuery,
} from '@/generated/graphql';

type Step = {
  label: string;
  icon: string;
  date?: string;
  matched: boolean;
};

type OrderStatusStepsProps = {
  orderStateFlow: FetchOrderItemStatusQuery['fetchOrderItemStatus'];
  orderDetails:
    | FetchDeliveryOrderByStateQuery['customer_order'][0]
    | FetchDeliveryOrderByIdQuery['customer_order'][0]
    | undefined;
};

// function to format dates
const formatDate = (date: string | undefined): string => {
  if (!date) {
    return '';
  }
  return DateTime.fromISO(date, {zone: 'utc'})
    .setZone('Asia/Kolkata')
    .toFormat('hh:mm a, d MMMM yyyy');
};

// To show assigned state as In Transit
const stateLabelMap: {[key: string]: string} = {
  order_placed: 'Order Placed',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// default steps
const DEFAULT_STEPS: Omit<Step, 'date' | 'matched'>[] = [
  {label: 'Order Placed', icon: 'shopping-cart'},
  {label: 'In Transit', icon: 'truck'},
  {label: 'Delivered', icon: 'map-marker'},
];

const CANCELLED_STEPS: Omit<Step, 'date' | 'matched'>[] = [
  {label: 'Order Placed', icon: 'shopping-cart'},
  {label: 'Cancelled', icon: 'ban'},
];

const OrderStatusSteps: React.FC<OrderStatusStepsProps> = ({
  orderStateFlow,
  orderDetails,
}) => {
  const stateFlowData = orderStateFlow?.data as
    | Array<{
        state: string;
        created_at: string;
      }>
    | undefined;

  const isCancelled = stateFlowData?.some(
    x => x.state.toLowerCase() === 'cancelled',
  );

  // memoize steps to prevent unnecessary recalculations
  const steps = useMemo<Step[]>(() => {
    const baseSteps = isCancelled ? CANCELLED_STEPS : DEFAULT_STEPS;

    return baseSteps.map((step, index) => {
      const matchedStep = stateFlowData?.find(
        x =>
          stateLabelMap[x.state.toLowerCase().replace(' ', '_')] === step.label,
      );

      let date = matchedStep ? formatDate(matchedStep.created_at) : '';

      // special case for the first step (Order Placed)
      if (index === 0 && orderDetails?.created_at) {
        date = formatDate(orderDetails.created_at);
      }

      return {
        ...step,
        date,
        matched: !!matchedStep || index < 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStateFlow, orderDetails, isCancelled]);

  // calculate the current position in the steps
  const currentPosition = useMemo(() => {
    const index = steps.findIndex((step, ind) => ind >= 1 && !step.matched);
    return index >= 0 ? index - 1 : steps.length - 1;
  }, [steps]);

  // render the step indicator icon
  const renderStepIndicator = (index: number) => {
    const isActive = index <= currentPosition || index < 1;
    return (
      <FontAwesomeIcons
        name={steps[index].icon}
        color={isActive ? FBColors.primary : FBColors.lightGray}
        size={moderateScale(20)}
      />
    );
  };

  // render a single step item
  const renderStepItem = (step: Step, index: number) => (
    <View key={step.label} style={styles.stepItem}>
      <View style={styles.iconContainer}>
        {renderStepIndicator(index)}
        {index < steps.length - 1 && (
          <View
            style={[
              styles.connector,
              index <= currentPosition || index < 1
                ? styles.connectorActive
                : styles.connectorInactive,
            ]}
          />
        )}
      </View>
      <View style={styles.stepContent}>
        <Text
          size="base"
          weight="bold"
          color={step.matched ? 'neutral' : 'lightGray'}>
          {step.label}
        </Text>
        {(step.matched || index < 1) && (
          <Text size="sm" color="neutral" style={styles.stepDate as TextStyle}>
            {step.date || 'Loading...'}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text size="lg" weight="bold">
        Order status
      </Text>
      <Divider height={20} />
      <View>{steps.map(renderStepItem)}</View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    padding: '8@s',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: '20@vs',
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: '10@s',
  },
  connector: {
    width: '2@s',
    height: '30@vs',
    marginTop: '5@vs',
  },
  connectorActive: {
    backgroundColor: FBColors.primary,
  },
  connectorInactive: {
    backgroundColor: FBBackground.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepDate: {
    marginTop: '5@vs',
  },
});

export default OrderStatusSteps;
