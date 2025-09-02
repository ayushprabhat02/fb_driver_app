import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Button} from '@/components';
import {FBColors, FBBackground} from '@/types/styles';

interface StreamControlsProps {
  isRecording: boolean;
  isLoading: boolean;
  canStopStream: boolean;
  hasStreamedOnce: boolean;
  streamingState: 'not_started' | 'started' | 'stopped';
  onStartRecording: () => void;
  onStopRecording: () => void;
  onNext: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  isRecording,
  isLoading,
  canStopStream,
  hasStreamedOnce,
  streamingState,
  onStartRecording,
  onStopRecording,
  onNext,
}) => {
  const canProceedNext = () => {
    return !isRecording && hasStreamedOnce && streamingState === 'stopped';
  };

  const getNextButtonText = () => {
    if (isRecording) return 'Stop streaming to continue';
    if (!hasStreamedOnce) return 'Start streaming first';
    if (streamingState === 'started') return 'Stop streaming to continue';
    if (streamingState === 'stopped') return 'Next';
    return 'Start streaming first';
  };

  return (
    <View style={styles.controlsContainer}>
      {!isRecording ? (
        <Button
          variant="solid"
          onPress={onStartRecording}
          disabled={isLoading}
          style={[styles.button, styles.recordButton]}>
          {isLoading ? 'Starting...' : 'Start Recording'}
        </Button>
      ) : (
        <Button
          variant="solid"
          onPress={onStopRecording}
          disabled={!canStopStream || isLoading}
          style={[
            styles.button,
            styles.stopButton,
            (!canStopStream || isLoading) && styles.disabledButton,
          ]}>
          {isLoading ? 'Stopping...' : 'Stop Recording'}
        </Button>
      )}

      <Button
        variant="outlined"
        onPress={onNext}
        disabled={!canProceedNext()}
        style={[styles.button, !canProceedNext() && styles.disabledButton]}>
        {getNextButtonText()}
      </Button>
    </View>
  );
};

const styles = ScaledSheet.create({
  controlsContainer: {
    padding: '20@s',
    backgroundColor: FBBackground.white,
    gap: '12@vs',
  },
  button: {
    marginVertical: '4@vs',
  },
  recordButton: {
    backgroundColor: FBColors.primary,
  },
  stopButton: {
    backgroundColor: FBColors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default StreamControls;