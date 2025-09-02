import React from 'react';
import {View, Text as RNText} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';

interface CameraOverlayProps {
  isRecording: boolean;
  recordingDuration: number;
  canStopStream: boolean;
  streamingDurationSeconds: number;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({
  isRecording,
  recordingDuration,
  canStopStream,
  streamingDurationSeconds,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isRecording) return null;

  return (
    <>
      {/* Recording indicator */}
      <View style={styles.recordingIndicator}>
        <View style={styles.recordingDot} />
        <RNText style={styles.recordingText}>
          REC {formatTime(recordingDuration)}
        </RNText>
      </View>

      {/* Timer display */}
      {!canStopStream && (
        <View style={styles.timerContainer}>
          <RNText style={styles.timerText}>
            Stop available in{' '}
            {formatTime(streamingDurationSeconds - recordingDuration)}
          </RNText>
        </View>
      )}
    </>
  );
};

const styles = ScaledSheet.create({
  recordingIndicator: {
    position: 'absolute',
    top: '20@vs',
    left: '20@s',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '20@s',
  },
  recordingDot: {
    width: '8@s',
    height: '8@s',
    borderRadius: '4@s',
    backgroundColor: 'white',
    marginRight: '8@s',
  },
  recordingText: {
    color: 'white',
    fontSize: '12@ms',
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'absolute',
    top: '60@vs',
    left: '20@s',
    right: '20@s',
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: '14@ms',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '20@s',
    textAlign: 'center',
  },
});

export default CameraOverlay;