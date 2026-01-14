import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Button} from '@/components';
import {FBColors, FBBackground} from '@/types/styles';

interface StreamControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  canStopStream: boolean;
  hasStreamedOnce: boolean;
  streamingState: 'not_started' | 'started' | 'paused' | 'stopped';
  isStreamUploaded: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onNext: () => void;
  // Individual button loading states
  isStartingRecording: boolean;
  isStoppingRecording: boolean;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  isRecording,
  isPaused,
  canStopStream,
  hasStreamedOnce,
  streamingState,
  isStreamUploaded,
  onStartRecording,
  onStopRecording,
  onNext,
  isStartingRecording,
  isStoppingRecording,
}) => {
  const canProceedNext = () => {
    return (
      !isRecording &&
      !isPaused &&
      hasStreamedOnce &&
      streamingState === 'stopped'
    );
  };

  const getNextButtonText = () => {
    return 'Next';
  };

  return (
    <View style={styles.controlsContainer}>
      {/* Recording Button Container - Simplified (No Pause) */}
      <View style={styles.recordingButtonContainer}>
        {!isRecording ? (
          !isStreamUploaded && (
            <Button
              variant="solid"
              onPress={onStartRecording}
              disabled={isStartingRecording || isStoppingRecording}
              loading={isStartingRecording || isStoppingRecording}
              style={[styles.button, styles.recordButton]}>
              {isStoppingRecording ? 'Processing...' : 'Start Live Stream'}
            </Button>
          )
        ) : (
          <Button
            variant="solid"
            onPress={onStopRecording}
            disabled={!canStopStream || isStoppingRecording}
            loading={isStoppingRecording}
            style={[
              styles.button,
              styles.stopButton,
              (!canStopStream || isStoppingRecording) &&
                styles.disabledButton,
            ]}>
            Stop Live Stream
          </Button>
        )}
      </View>

      {/* Next Button - Always Present */}
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
    backgroundColor: FBBackground.white,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
    minHeight: 120,
  },
  recordingButtonContainer: {
    minHeight: 50,
    justifyContent: 'center',
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
