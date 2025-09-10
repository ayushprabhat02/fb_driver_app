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
  isStreamUploaded: boolean;
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
  isStreamUploaded,
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
      {/* Recording Button Container - Fixed Height */}
      <View style={styles.recordingButtonContainer}>
        {!isRecording ? (
          !isStreamUploaded && (
            <Button
              variant="solid"
              onPress={onStartRecording}
              disabled={isLoading}
              style={[styles.button, styles.recordButton]}>
              {isLoading ? 'Starting...' : 'Start Recording'}
            </Button>
          )
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
    minHeight: 120, // Fixed minimum height
  },
  recordingButtonContainer: {
    minHeight: 48, // Fixed height for recording button area
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
