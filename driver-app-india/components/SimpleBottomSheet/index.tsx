// dependencies
import React, {forwardRef, useCallback} from 'react';
import {View} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// components
import Button from '../Button';

// types
import {FBBackground, FBColors} from '@/types/styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface SimpleBottomSheetProps extends BottomSheetModalProps {
  children: React.ReactNode;
  snapPoints?: string[] | number[];
  closeSheet: () => void;
  showCloseBtn?: boolean;
  pressBehavior?: 'close' | 'collapse' | 'none';
}

const BackDrop: React.FC<BottomSheetBackdropProps> = (
  props: BottomSheetBackdropProps & {
    pressBehavior?: 'close' | 'collapse' | 'none';
  },
) => (
  <BottomSheetBackdrop
    style={{zIndex: 100}}
    // pressBehavior="close"
    appearsOnIndex={0}
    {...props}
    disappearsOnIndex={-1}
    pressBehavior={props.pressBehavior || 'close'}
  />
);

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

const SimpleBottomSheet = forwardRef<BottomSheetModal, SimpleBottomSheetProps>(
  ({showCloseBtn = true, pressBehavior = 'close', ...props}, ref) => {
    /**
     * todo: keep for reference
     * to make the sheet animations fast
     * sheet animations need to be fast so that the close button does not linger when sheet is closed
     */
    // const animationConfigs = useBottomSheetSpringConfigs({
    //   damping: 1,
    //   overshootClamping: true,
    //   stiffness: 300,
    // });

    const handleComponent = useCallback(
      () => <HandleComponent closeSheet={props.closeSheet} />,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    return (
      <BottomSheetModal
        keyboardBlurBehavior="restore"
        enableDynamicSizing
        topInset={useSafeAreaInsets().top}
        {...props}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        ref={ref}
        snapPoints={props.snapPoints || ['70%']}
        index={0}
        handleComponent={showCloseBtn ? handleComponent : null}
        // backdropComponent={BackDrop}
        backdropComponent={backdropProps => (
          <BackDrop {...backdropProps} pressBehavior={pressBehavior} />
        )}>
        {props.children}
      </BottomSheetModal>
    );
  },
);

export default SimpleBottomSheet;
