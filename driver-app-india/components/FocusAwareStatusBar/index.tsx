import * as React from 'react';
import {StatusBar, StatusBarProps} from 'react-native';
import {useIsFocused} from '@react-navigation/native';

export const FocusAwareStatusBar: React.FC<StatusBarProps> = props => {
  const isFocused = useIsFocused();

  return isFocused ? (
    <StatusBar
      translucent
      backgroundColor={'transparent'}
      barStyle="dark-content"
      {...props}
    />
  ) : null;
};

export default FocusAwareStatusBar;
