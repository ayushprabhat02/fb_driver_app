// depdenencies
import React, {useState} from 'react';
import {ScaledSheet} from 'react-native-size-matters';

// components
import {CardElevated, Chip} from '@/components';
import {FBBackground, FBBorders} from '@/types/styles';

type BusinessType = 'delivery' | 'pickup';

type Business = {
  label: string;
  value: BusinessType;
};

const businessTypes: Business[] = [
  {
    label: 'Delivery',
    value: 'delivery',
  },
  // {
  //   label: 'Pickup',
  //   value: 'pickup',
  // },
];

const BusinessTypeToggle: React.FC = () => {
  const [activeBusiness, setActiveBusiness] =
    useState<BusinessType>('delivery');

  return (
    <CardElevated cardStyle={styles.container}>
      {businessTypes.map(business => {
        return (
          <Chip
            key={business.label}
            active={activeBusiness === business.value}
            label={business.label}
            onPress={() => setActiveBusiness(business.value)}
            shape="rounded"
            style={styles.chipContainer}
          />
        );
      })}
    </CardElevated>
  );
};

export default BusinessTypeToggle;

const styles = ScaledSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: FBBackground.primary,
    borderColor: FBBorders.secondary,
    borderWidth: 1,
    flexDirection: 'row',
  },

  chipContainer: {
    width: '120@s',
    height: '40@vs',
  },
});
