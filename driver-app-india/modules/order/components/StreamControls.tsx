import React from 'react';
import {View} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Button} from '@/components';
import {FBColors, FBBackground} from '@/types/styles';

interface StreamControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isLoading: boolean;
  canStopStream: boolean;
  hasStreamedOnce: boolean;
  streamingState: 'not_started' | 'started' | 'paused' | 'stopped';
  isStreamUploaded: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onNext: () => void;
  // Individual button loading states
  isStartingRecording: boolean;
  isPausingRecording: boolean;
  isResumingRecording: boolean;
  isStoppingRecording: boolean;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  isRecording,
  isPaused,
  isLoading,
  canStopStream,
  hasStreamedOnce,
  streamingState,
  isStreamUploaded,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onNext,
  isStartingRecording,
  isPausingRecording,
  isResumingRecording,
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
      {/* Recording Button Container - Fixed Height */}
      <View style={styles.recordingButtonContainer}>
        {!isRecording && !isPaused ? (
          !isStreamUploaded && (
            <Button
              variant="solid"
              onPress={onStartRecording}
              disabled={isStartingRecording || isStoppingRecording}
              loading={isStartingRecording || isStoppingRecording}
              style={[styles.button, styles.recordButton]}>
              {isStoppingRecording ? 'Processing...' : 'Start Recording'}
            </Button>
          )
        ) : isRecording && !isPaused ? (
          <View style={styles.buttonRow}>
            <Button
              variant="outlined"
              onPress={onPauseRecording}
              disabled={isPausingRecording || isStoppingRecording}
              loading={isPausingRecording}
              style={[styles.button, styles.pauseButton]}>
              Pause
            </Button>
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
              Stop Recording
            </Button>
          </View>
        ) : isPaused ? (
          <View style={styles.buttonRow}>
            <Button
              variant="solid"
              onPress={onResumeRecording}
              disabled={isResumingRecording || isStoppingRecording}
              loading={isResumingRecording}
              style={[styles.button, styles.resumeButton]}>
              Resume Recording
            </Button>
            <Button
              variant="solid"
              onPress={onStopRecording}
              disabled={!canStopStream || isStoppingRecording}
              loading={isStoppingRecording}
              style={[
                styles.button,
                styles.stopButton,
                (!canStopStream || isStoppingRecording) && styles.disabledButton,
              ]}>
              Stop Recording
            </Button>
          </View>
        ) : null}
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
    minHeight: 140, // Increased height to accommodate two-button layout
  },
  recordingButtonContainer: {
    minHeight: 60, // Increased height for two-button layout
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  button: {
    marginVertical: '4@vs',
  },
  recordButton: {
    backgroundColor: FBColors.primary,
  },
  pauseButton: {
    borderColor: '#F59E0B', // Amber color
    borderWidth: 2,
    flex: 1,
  },
  resumeButton: {
    backgroundColor: '#10B981', // Emerald color
    flex: 1,
  },
  stopButton: {
    backgroundColor: FBColors.error,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default StreamControls;
