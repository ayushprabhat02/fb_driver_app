import React from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {openSettings, RESULTS} from 'react-native-permissions';
import {ScaledSheet} from 'react-native-size-matters';
import {Container, Text, Button} from '@/components';
import {FBColors, FBBackground} from '@/types/styles';

interface PermissionScreenProps {
  permissionStatus: {
    camera: string;
    microphone: string;
  };
  isLoading: boolean;
  onRetry: () => void;
  onGoBack: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({
  permissionStatus,
  isLoading,
  onRetry,
  onGoBack,
}) => {
  const handleOpenSettings = () => {
    openSettings().catch(() => {
      Alert.alert(
        'Error',
        'Unable to open settings. Please manually enable camera and microphone permissions for this app.',
      );
    });
  };

  return (
    <Container style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={textStyles.errorTitle}>Permissions Required</Text>
        <Text style={textStyles.errorMessage}>
          Camera and microphone access are required for live streaming
          functionality.
        </Text>

        <View style={styles.permissionStatus}>
          <View style={styles.permissionItem}>
            <Text style={textStyles.permissionLabel}>Camera:</Text>
            <Text
              style={StyleSheet.flatten([
                textStyles.permissionValue,
                permissionStatus.camera === RESULTS.GRANTED
                  ? textStyles.granted
                  : textStyles.denied,
              ])}>
              {permissionStatus.camera === RESULTS.GRANTED
                ? '✓ Granted'
                : permissionStatus.camera === RESULTS.DENIED
                ? '✗ Denied'
                : permissionStatus.camera === RESULTS.BLOCKED
                ? '⚠ Blocked'
                : '❓ Unknown'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={textStyles.permissionLabel}>Microphone:</Text>
            <Text
              style={StyleSheet.flatten([
                textStyles.permissionValue,
                permissionStatus.microphone === RESULTS.GRANTED
                  ? textStyles.granted
                  : textStyles.denied,
              ])}>
              {permissionStatus.microphone === RESULTS.GRANTED
                ? '✓ Granted'
                : permissionStatus.microphone === RESULTS.DENIED
                ? '✗ Denied'
                : permissionStatus.microphone === RESULTS.BLOCKED
                ? '⚠ Blocked'
                : '❓ Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            variant="solid"
            onPress={onRetry}
            style={[styles.button, styles.primaryButton]}
            disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Grant Permissions'}
          </Button>

          <Button
            variant="outlined"
            onPress={handleOpenSettings}
            style={styles.button}>
            Open Settings
          </Button>

          <Button
            variant="outlined"
            onPress={onGoBack}
            style={[styles.button, styles.cancelButton]}>
            Go Back
          </Button>
        </View>
      </View>
    </Container>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBBackground.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20@s',
  },
  permissionStatus: {
    backgroundColor: FBBackground.white,
    borderRadius: '12@s',
    padding: '16@s',
    marginBottom: '24@vs',
    width: '100%',
    borderWidth: 1,
    borderColor: FBColors.lightGray,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '8@vs',
  },
  buttonContainer: {
    width: '100%',
    gap: '12@vs',
  },
  button: {
    marginVertical: '4@vs',
  },
  primaryButton: {
    backgroundColor: FBColors.primary,
  },
  cancelButton: {
    borderColor: FBColors.error,
  },
});

const textStyles = StyleSheet.create({
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: FBColors.neutral,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: FBColors.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: FBColors.neutral,
  },
  permissionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  granted: {
    color: FBColors.primary,
  },
  denied: {
    color: FBColors.error,
  },
});

export default PermissionScreen;