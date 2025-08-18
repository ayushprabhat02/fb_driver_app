// to be used as the top level container on pages with transparent headers

// dependencies
import {View, ViewProps} from 'react-native';
import React, {ReactNode} from 'react';
import {useHeaderHeight} from '@react-navigation/elements';
import {FBBackground} from '@/types/styles';

interface HeaderAvoidingContainerProps {
  children: ReactNode;
  paddingHorizontal?: number;
}

const HeaderAvoidingContainer: React.FC<
  HeaderAvoidingContainerProps & ViewProps
> = props => {
  const headerHeight = useHeaderHeight();

  return (
    <View
      style={{
        paddingTop: headerHeight + 24,
        paddingHorizontal: props?.paddingHorizontal ?? 10,
        flex: 1,
        backgroundColor: FBBackground.white,
      }}
      {...props}>
      {props.children}
    </View>
  );
};

export default HeaderAvoidingContainer;
