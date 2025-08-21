import React from 'react';
import {View, Animated, Easing} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E1E9EE', '#F2F8FC'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

const OrderCardSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <SkeletonLoader width="60%" height={16} />
        <SkeletonLoader width={60} height={20} borderRadius={10} />
      </View>
      <View style={styles.skeletonContent}>
        <SkeletonLoader width="40%" height={14} style={{marginBottom: 4}} />
        <SkeletonLoader width="80%" height={14} style={{marginBottom: 8}} />
        <SkeletonLoader width="50%" height={14} style={{marginBottom: 4}} />
        <SkeletonLoader width="70%" height={14} />
      </View>
    </View>
  );
};

const OrderListSkeleton: React.FC<{count?: number}> = ({count = 3}) => {
  return (
    <View>
      {Array.from({length: count}).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = ScaledSheet.create({
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8@s',
    padding: '16@s',
    marginVertical: '8@vs',
    marginHorizontal: '0@s',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  skeletonContent: {
    marginBottom: '8@vs',
  },
});

export {SkeletonLoader, OrderCardSkeleton, OrderListSkeleton};
export default SkeletonLoader;