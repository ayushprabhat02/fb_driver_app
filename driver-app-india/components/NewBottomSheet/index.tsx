/**
 * * Custom bottom sheet component that uses BottomSheet instead of BottomSheetModal
 * * When using, always put at the end of the component tree such that it is the last child of the parent component
 * * This is done to avoid zIndex issues
 */

// dependencies
import {View} from 'react-native';
import React, {forwardRef, useCallback} from 'react';
import BottomSheet, {
  BottomSheetProps,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {FBBackground, FBColors} from '@/types/styles';
import Button from '../Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface NewBottomSheetBackdropProps extends BottomSheetBackdropProps {
  showCloseBtn?: boolean;
}

interface CustomHandleComponentProps {
  closeSheet: () => void;
}

const HandleComponent: React.FC<CustomHandleComponentProps> = props => {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: FBBackground.accent,
        height: 0,
      }}
      {...props}>
      <Button
        onPress={props.closeSheet}
        variant="rounded"
        style={{
          backgroundColor: FBBackground.darkGreen,
          top: 16,
          right: 21,
          position: 'absolute',
          width: 32,
          height: 32,
        }}>
        <Icon name="close-thick" color={FBColors.white} size={22} />
      </Button>
    </View>
  );
};

interface NewBottomSheetProps extends BottomSheetProps {
  showCloseBtn?: boolean;
  children: React.ReactNode;
  snapPoints?: string[];
  closeSheet?: () => void;
  index?: number;
}

const NewBottomSheet = forwardRef<BottomSheet, NewBottomSheetProps>(
  ({showCloseBtn = true, closeSheet = () => {}, index = -1, ...props}, ref) => {
    // backdrop component
    const NewBottomSheetBackdrop: React.FC<NewBottomSheetBackdropProps> =
      useCallback(backdropProps => {
        return (
          <BottomSheetBackdrop
            style={{zIndex: 100}}
            pressBehavior={backdropProps.showCloseBtn ? 'close' : 'none'}
            appearsOnIndex={0}
            {...backdropProps}
            disappearsOnIndex={-1}
          />
        );
      }, []);

    const handleComponent = () => <HandleComponent closeSheet={closeSheet} />;

    return (
      <BottomSheet
        enableDynamicSizing
        backgroundStyle={{zIndex: 0}}
        keyboardBlurBehavior="restore"
        keyboardBehavior="interactive"
        {...props}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        ref={ref}
        snapPoints={props.snapPoints || ['70%']}
        index={index}
        handleComponent={showCloseBtn ? handleComponent : null}
        backdropComponent={backdropProps =>
          NewBottomSheetBackdrop({showCloseBtn, ...backdropProps})
        }>
        {props.children}
      </BottomSheet>
    );
  },
);

export default NewBottomSheet;
