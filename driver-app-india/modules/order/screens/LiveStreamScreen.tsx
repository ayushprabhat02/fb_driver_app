import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';

// Components
import {
  Text,
  CardElevated,
  QuantityBottomSheet,
  Divider,
  Button,
  FullScreenLoader,
} from '@/components';
import PermissionScreen from '../components/PermissionScreen';
import CameraOverlay from '../components/CameraOverlay';
import StreamControls from '../components/StreamControls';

// Store
import {checkinStore, orderStore} from '@/globalStore';

// Services
import orderService from '../services';
import supportService from '@/modules/support/services';

// Types
import {FBColors, FBBackground} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';
import {getCurrentLocation} from '@/utils/location';
import {
  saveStreamState,
  getStreamState,
  clearStreamState,
  hasPausedStreamForTask,
  saveAssetWithUploadedVideo,
} from '@/utils/streamStorage';
import {OrderInfoCard} from '../components';

type LiveStreamNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'live-stream'
>;

interface LiveStreamScreenProps {
  route?: any;
}

const LiveStreamScreen: React.FC<LiveStreamScreenProps> = () => {
  const navigation = useNavigation<LiveStreamNavigationProp>();
  const cameraRef = useRef<RNCamera | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'unknown',
    microphone: 'unknown',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [canStopStream, setCanStopStream] = useState(false);
  const [hasStreamedOnce, setHasStreamedOnce] = useState(false);
  const [isStreamUploaded, setIsStreamUploaded] = useState(false);
  const [streamingState, setStreamingState] = useState<
    'not_started' | 'started' | 'paused' | 'stopped'
  >('not_started');
  const [showQuantityBottomSheet, setShowQuantityBottomSheet] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [recordedVideoFile, setRecordedVideoFile] = useState<string | null>(
    null,
  );
  const [isManualUploading, setIsManualUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isUploadingFromDevice, setIsUploadingFromDevice] = useState(false);

  // Individual button loading states
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isPausingRecording, setIsPausingRecording] = useState(false);
  const [isResumingRecording, setIsResumingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  // Store
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const orderAssets = orderStore.use.orderAssets();
  const addPartiallyFilledAsset = orderStore.use.addPartiallyFilledAsset();
  const removePartiallyFilledAsset =
    orderStore.use.removePartiallyFilledAsset();
  const addAssetWithUploadedVideo = orderStore.use.addAssetWithUploadedVideo();
  const removeAssetWithUploadedVideo =
    orderStore.use.removeAssetWithUploadedVideo();
  const fuelDispensedTillNow = orderStore.use.fuelDispensedTillNow();
  const quantityToBeDispensed = orderStore.use.quantityToBeDispensed();
  const currentAssetForDispense = orderStore.use.currentAssetForDispense();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();
  const loaders = orderStore.use.loaders();

  // console.log('--currentDriverOrder---', currentDriverOrder);

  // const streamingDurationSeconds = 5 * 60; // 5 minutes
  const streamingDurationSeconds = 10; // 10 seconds

  // Get current asset's filled quantity
  const getCurrentAssetFilledQuantity = () => {
    const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
    if (!currentAssetId || !orderAssets) return 0;

    const currentAsset = orderAssets.find((asset: any) => {
      const assetId =
        asset.customer_asset?.id || asset.id || asset.customer_asset_id;
      return assetId === currentAssetId;
    });

    return currentAsset?.quantity_dispensed || 0;
  };

  // Check permissions and restore state on component mount
  useEffect(() => {
    checkPermissions();
    restoreStreamState();
  }, []);

  // Restore stream state from storage
  const restoreStreamState = async () => {
    if (!currentDriverOrder?.id || !currentAssetForDispense?.id) return;

    try {
      const hasPaused = await hasPausedStreamForTask(
        currentDriverOrder.id,
        currentAssetForDispense.id,
      );

      if (hasPaused) {
        const savedState = await getStreamState();
        setIsPaused(true);
        setStreamingState('paused');
        setRecordingDuration(savedState.recordingDuration);
        setHasStreamedOnce(savedState.hasStreamedOnce);
        setCanStopStream(
          savedState.recordingDuration >= streamingDurationSeconds,
        );

        Toast.show({
          type: 'info',
          text1: 'Paused Recording Found',
          text2:
            'Your previous recording session was paused. You can resume it.',
        });
      }
    } catch (error) {
      console.error('Failed to restore stream state:', error);
    }
  };

  // Setup recording timer (increments duration only when recording and not paused)
  useEffect(() => {
    if (!isRecording || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const newDuration = prev + 1;
        // Save state periodically during recording
        saveStreamState({
          isRecording: true,
          isPaused: false,
          recordingDuration: newDuration,
          streamingState: 'started',
          hasStreamedOnce: true,
          taskId: currentDriverOrder?.id || null,
          assetId: currentAssetForDispense?.id || null,
        });
        return newDuration;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  // Enable stop after threshold using latest state
  useEffect(() => {
    if (
      isRecording &&
      recordingDuration >= streamingDurationSeconds &&
      !canStopStream
    ) {
      console.log(
        `Enabling stop: duration=${recordingDuration}, threshold=${streamingDurationSeconds}, canStopStream=${canStopStream}`,
      );
      setCanStopStream(true);
      Toast.show({
        type: 'info',
        text1: 'Minimum Duration Reached',
        text2: 'You can now stop the recording',
      });
    }
  }, [recordingDuration, isRecording, streamingDurationSeconds, canStopStream]);

  const checkPermissions = async () => {
    try {
      setIsLoading(true);

      const cameraPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const micPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      // Check current status
      const currentCameraStatus = await check(cameraPermission);
      const currentMicStatus = await check(micPermission);

      let cameraResult = currentCameraStatus;
      let micResult = currentMicStatus;

      // Request permissions if not granted
      if (currentCameraStatus !== RESULTS.GRANTED) {
        cameraResult = await request(cameraPermission);
      }

      if (currentMicStatus !== RESULTS.GRANTED) {
        micResult = await request(micPermission);
      }

      setPermissionStatus({
        camera: cameraResult,
        microphone: micResult,
      });

      const cameraGranted = cameraResult === RESULTS.GRANTED;
      const micGranted = micResult === RESULTS.GRANTED;

      if (cameraGranted && micGranted) {
        setHasPermission(true);
        Toast.show({
          type: 'success',
          text1: 'Permissions Granted',
          text2: 'Ready to start live streaming',
        });
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermission(false);
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: 'Failed to check permissions',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsStartingRecording(true);
      setStreamingState('started');

      // Validate required data
      if (!currentDriverOrder?.customer_order?.id) {
        throw new Error('Order data is missing');
      }

      const currentAssetId = currentAssetForDispense?.id;
      if (!currentAssetId) {
        throw new Error('Asset data is missing');
      }

      if (!hasStreamedOnce) {
        setHasStreamedOnce(true);
      }

      // Always reset timer states when starting new recording
      console.log('Starting recording - resetting timer states');
      setRecordingDuration(0);
      setCanStopStream(false);

      // Update stream status via API (no loader for task state)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_STARTED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentDriverOrder?.id,
          customer_asset_id: currentAssetId,
        },
      });

      await orderService.updateTaskLiveDispensingStatus({
        task_id: currentDriverOrder?.id,
        is_live_dispensing: true,
      });

      // Set recording state IMMEDIATELY before starting camera recording
      setIsRecording(true);

      const recordOptions = {
        quality: RNCamera.Constants.VideoQuality['720p'],
        videoBitrate: 800000,
        audioBitrate: 64000,
      };

      Toast.show({
        type: 'success',
        text1: 'Recording Started',
        text2: 'Live stream is now recording',
      });

      // Start recording without blocking the UI
      const recordPromise = cameraRef.current.recordAsync(recordOptions);

      recordPromise.then(handleRecordingFinished).catch(error => {
        console.error('Recording error:', error);
        Toast.show({
          type: 'error',
          text1: 'Recording Error',
          text2: 'An error occurred while recording',
        });
      });
    } catch (error) {
      console.error('Start recording error:', error);
      setIsRecording(false); // Reset recording state on error
      Toast.show({
        type: 'error',
        text1: 'Recording Failed',
        text2: 'Unable to start recording',
      });
    } finally {
      setIsStartingRecording(false);
    }
  };

  const pauseRecording = async () => {
    if (!cameraRef.current || !isRecording || isPaused) return;

    try {
      setIsPausingRecording(true);
      setIsPaused(true);
      setStreamingState('paused');

      // Update stream status via API (no loader for task state)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_PAUSED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentDriverOrder?.id,
          customer_asset_id: currentAssetForDispense?.id,
        },
      });

      // Save paused state
      await saveStreamState({
        isRecording: true,
        isPaused: true,
        recordingDuration,
        streamingState: 'paused',
        hasStreamedOnce: true,
        taskId: currentDriverOrder?.id || null,
        assetId: currentAssetForDispense?.id || null,
      });

      Toast.show({
        type: 'info',
        text1: 'Recording Paused',
        text2: 'You can resume recording anytime',
      });
    } catch (error) {
      console.error('Pause recording error:', error);
      setIsPaused(false);
      Toast.show({
        type: 'error',
        text1: 'Pause Failed',
        text2: 'Unable to pause recording',
      });
    } finally {
      setIsPausingRecording(false);
    }
  };

  const resumeRecording = async () => {
    if (!cameraRef.current || !isPaused) return;

    try {
      setIsResumingRecording(true);
      setIsPaused(false);
      setStreamingState('started');

      // Update stream status via API (no loader for task state)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_RESUMED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentDriverOrder?.id,
          customer_asset_id: currentAssetForDispense?.id,
        },
      });

      // Update stream status
      await saveStreamState({
        isRecording: true,
        isPaused: false,
        recordingDuration,
        streamingState: 'started',
        hasStreamedOnce: true,
        taskId: currentDriverOrder?.id || null,
        assetId: currentAssetForDispense?.id || null,
      });

      Toast.show({
        type: 'success',
        text1: 'Recording Resumed',
        text2: 'Live stream is recording again',
      });
    } catch (error) {
      console.error('Resume recording error:', error);
      setIsPaused(true);
      Toast.show({
        type: 'error',
        text1: 'Resume Failed',
        text2: 'Unable to resume recording',
      });
    } finally {
      setIsResumingRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || (!isRecording && !isPaused)) return;

    try {
      setIsStoppingRecording(true);
      setStreamingState('stopped');

      // Update stream status via API (no loader for task state)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_STOPPED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentDriverOrder?.id,
          customer_asset_id: currentAssetForDispense?.id,
        },
      });

      await orderService.updateTaskLiveDispensingStatus({
        task_id: currentDriverOrder?.id || '',
        is_live_dispensing: false,
      });

      // Stop camera recording if recording was ever started (regardless of pause state)
      if (isRecording || isPaused) {
        cameraRef.current.stopRecording();
      }

      setIsRecording(false);
      setIsPaused(false);

      // Reset timer states
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCanStopStream(false);
      setRecordingDuration(0);

      // Clear persisted state since recording is complete
      await clearStreamState();

      // Remove from interrupted recording array since recording is now complete
      const currentAssetId = currentAssetForDispense?.id;
      if (currentAssetId) {
        orderStore.setState(state => ({
          ...state,
          assetsWithInterruptedRecording:
            state.assetsWithInterruptedRecording.filter(
              id => id !== currentAssetId,
            ),
        }));
      }

      Toast.show({
        type: 'success',
        text1: 'Recording Stopped',
        text2: 'Live stream has been saved',
      });
    } catch (error) {
      console.error('Stop recording error:', error);
      Toast.show({
        type: 'error',
        text1: 'Stop Failed',
        text2: 'Unable to stop recording properly',
      });
    } finally {
      setIsStoppingRecording(false);
    }
  };

  // Check storage permissions for Android
  const checkStoragePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't require explicit storage permissions for app directories
    }

    try {
      // For Android 13+ (API 33+), WRITE_EXTERNAL_STORAGE is deprecated
      // For Android 10-12 (API 29-32), scoped storage is used
      // For older versions, we still need WRITE_EXTERNAL_STORAGE
      const androidVersion = Platform.Version as number;

      // For Android 10+ (API 29+), try without permission first
      if (androidVersion >= 29) {
        // Android 10+ uses scoped storage, might not need explicit permission
        // Try to write directly and fall back to permission request if it fails
        return true;
      }

      // For older Android versions, check for WRITE_EXTERNAL_STORAGE permission
      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      const hasPermission = await PermissionsAndroid.check(permission);

      if (hasPermission) {
        return true;
      }

      // Request permission if not granted
      const granted = await PermissionsAndroid.request(permission, {
        title: 'Storage Permission',
        message:
          'This app needs access to storage to save recorded videos to Downloads folder',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking storage permissions:', error);
      return false;
    }
  };

  const saveVideoToDevice = async (
    sourceUri: string,
    fileName: string,
  ): Promise<string | null> => {
    try {
      // Create a unique file path in the Documents directory (always accessible)
      const documentsPath = RNFS.DocumentDirectoryPath;
      const videoPath = `${documentsPath}/${fileName}`;

      // Copy the video file to Documents directory (this should always work)
      await RNFS.copyFile(sourceUri, videoPath);
      console.log(`Video saved locally at: ${videoPath}`);

      let externalPath = null;
      let savedToDownloads = false;

      // Try to save to external storage (Downloads folder) for easier access
      if (Platform.OS === 'android') {
        try {
          const hasStoragePermission = await checkStoragePermissions();

          if (hasStoragePermission) {
            const downloadsPath = RNFS.DownloadDirectoryPath;
            externalPath = `${downloadsPath}/${fileName}`;
            await RNFS.copyFile(sourceUri, externalPath);
            savedToDownloads = true;
            console.log(`Video also saved to Downloads: ${externalPath}`);
          } else {
            console.log(
              'Storage permission denied - video saved to app folder only',
            );
          }
        } catch (externalError) {
          console.warn('Failed to save to Downloads folder:', externalError);
          // Continue with internal storage only
        }
      }

      // Show appropriate success message
      Toast.show({
        type: 'info',
        text1: 'Video Saved Locally',
        text2: savedToDownloads
          ? 'Saved to Downloads folder and app documents'
          : 'Saved in app documents folder',
        visibilityTime: 4000,
      });

      return externalPath || videoPath;
    } catch (error) {
      console.error('Failed to save video locally:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Unable to save video to device',
        visibilityTime: 4000,
      });
      return null;
    }
  };

  const getVideoFormat = (uri: string, mimeType?: string) => {
    // Check the MIME type first if available
    if (mimeType) {
      if (mimeType.includes('webm')) return 'webm';
      if (mimeType.includes('mp4')) return 'mp4';
    }

    // Fallback to URI extension check
    if (uri.toLowerCase().includes('.webm')) return 'webm';
    if (uri.toLowerCase().includes('.mp4')) return 'mp4';

    // Default based on platform - Android often produces webm from camera
    return Platform.OS === 'android' ? 'webm' : 'mp4';
  };

  const handleRecordingFinished = async (data: any) => {
    try {
      startLoader('uploadVideo');

      // Detect actual video format
      const videoFormat = getVideoFormat(data.uri, data.codec);
      const contentType = `video/${videoFormat}`;
      const fileName = `Recording_${currentDriverOrder?.customer_order?.order_code}.${videoFormat}`;

      let uploadedUrl = data.uri || ''; // Fallback to local URI
      let uploadSuccess = false;
      let localVideoPath: string | null = null;

      // Always save video locally first
      localVideoPath = await saveVideoToDevice(data.uri, fileName);
      if (localVideoPath) {
        setRecordedVideoFile(localVideoPath);
      }

      try {
        // Convert video URI to blob for upload
        const response = await fetch(data.uri);
        const blob = await response.blob();

        console.log(`Video size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(
          `Video format detected: ${videoFormat}, Content-Type: ${contentType}`,
        );

        // Upload video to Google Cloud Storage
        const uploadResult = await supportService.uploadFile({
          fileName: fileName,
          contentType: contentType,
          fileData: blob,
        });

        if (uploadResult.storeUrl) {
          uploadedUrl = uploadResult.storeUrl;
          uploadSuccess = true;
          setIsStreamUploaded(true);
          setUploadError(false);
        }
      } catch (uploadError) {
        console.warn('Cloud upload failed, video saved locally:', uploadError);
        setUploadError(true);
        uploadSuccess = false;
        // Continue with local URI as fallback
      }

      // Save the task action with uploaded video URL or local URI (no loader for task state)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'LIVE_STREAM_RECORDING',
          url: uploadedUrl,
          value: fileName,
          quantity_dispensed: 0,
          task_id: currentDriverOrder?.id,
          customer_asset_id: currentAssetForDispense?.id,
        },
      });

      // Mark asset as having uploaded video
      const currentAssetId = currentAssetForDispense?.id;
      if (currentAssetId && uploadSuccess) {
        addAssetWithUploadedVideo(currentAssetId);
        // Also save to persistent storage
        await saveAssetWithUploadedVideo(
          currentDriverOrder?.id || '',
          currentAssetId,
        );
      }

      Toast.show({
        type: uploadSuccess ? 'success' : 'info',
        text1: uploadSuccess ? 'Recording Uploaded' : 'Recording Saved Locally',
        text2: uploadSuccess
          ? 'Successfully uploaded to cloud storage'
          : 'Video saved to device - you can retry upload manually',
      });
    } catch (error) {
      console.error('Process recording error:', error);
      setIsStreamUploaded(false);
      setUploadError(true);
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: 'Failed to save recording. Please try again.',
      });
    } finally {
      stopLoader('uploadVideo');
    }
  };

  const goNext = () => {
    const canProceed =
      (!isRecording && hasStreamedOnce && streamingState === 'stopped') ||
      (!isRecording && hasStreamedOnce && isStreamUploaded); // Allow if video was uploaded from device

    if (!canProceed) {
      Alert.alert(
        'Complete Video Upload',
        'Please complete video recording/upload before proceeding to the next step.',
      );
      return;
    }

    // Reset streaming state
    setStreamingState('not_started');
    setHasStreamedOnce(false);
    setRecordingDuration(0);
    setCanStopStream(false);

    // Show quantity bottom sheet for tower drivers
    setShowQuantityBottomSheet(true);
  };

  const showVideoLocation = async () => {
    if (!recordedVideoFile) {
      Toast.show({
        type: 'info',
        text1: 'No Video File',
        text2: 'No video file recorded yet',
      });
      return;
    }

    // Check if file exists
    const fileExists = await RNFS.exists(recordedVideoFile);

    Alert.alert(
      'Video File Location',
      `File Path: ${recordedVideoFile}\n\nFile Exists: ${
        fileExists ? 'Yes' : 'No'
      }

For Android Emulator:
1. Use Device File Explorer in Android Studio
2. Navigate to: /data/data/com.customer_app_in/files/
3. Or check Downloads folder

For iOS Simulator:
1. Simulator → Device → Photos
2. Or check app sandbox in Finder`,
      [
        {
          text: 'Copy Path',
          onPress: () => {
            // You can implement clipboard copy here if needed
            console.log('File path:', recordedVideoFile);
          },
        },
        {text: 'OK'},
      ],
    );
  };

  const uploadVideoFromDevice = async () => {
    try {
      setIsUploadingFromDevice(true);

      // Open document picker to select video file
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const selectedFile = result[0];

        // Validate file size (limit to 100MB)
        const maxSizeInBytes = 100 * 1024 * 1024; // 100MB
        if (selectedFile.size && selectedFile.size > maxSizeInBytes) {
          Toast.show({
            type: 'error',
            text1: 'File Too Large',
            text2: 'Please select a video file smaller than 100MB',
          });
          return;
        }

        // Validate file type
        if (!selectedFile.type?.includes('video/')) {
          Toast.show({
            type: 'error',
            text1: 'Invalid File Type',
            text2: 'Please select a valid video file',
          });
          return;
        }

        // Show confirmation dialog
        Alert.alert(
          'Upload Video',
          `Are you sure you want to upload this video?\n\nFile: ${
            selectedFile.name
          }\nSize: ${((selectedFile.size || 0) / 1024 / 1024).toFixed(2)}MB`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Upload',
              onPress: () => processSelectedVideo(selectedFile),
            },
          ],
        );
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        console.log('User cancelled video selection');
      } else {
        console.error('Error picking video:', error);
        Toast.show({
          type: 'error',
          text1: 'Selection Failed',
          text2: 'Failed to select video file',
        });
      }
    } finally {
      setIsUploadingFromDevice(false);
    }
  };

  const processSelectedVideo = async (selectedFile: any) => {
    try {
      startLoader('uploadVideo');
      setIsUploadingFromDevice(true);

      // Detect video format from selected file
      const detectedFormat = selectedFile.type?.includes('webm')
        ? 'webm'
        : selectedFile.type?.includes('mp4')
        ? 'mp4'
        : selectedFile.name?.toLowerCase().includes('.webm')
        ? 'webm'
        : 'mp4';
      const contentType = selectedFile.type || `video/${detectedFormat}`;
      const fileName = `Upload_${
        currentDriverOrder?.customer_order?.order_code
      }_${Date.now()}.${detectedFormat}`;

      // Try to upload the file directly using the file object
      // Many upload services can handle the file object with uri, type, and name
      const fileData = {
        uri: selectedFile.uri,
        type: contentType,
        name: fileName,
      };

      console.log(
        `Selected video size: ${(
          (selectedFile.size || 0) /
          1024 /
          1024
        ).toFixed(2)} MB`,
      );
      console.log(
        `Selected video format: ${detectedFormat}, Content-Type: ${contentType}`,
      );

      // Upload video to Google Cloud Storage
      const uploadResult = await supportService.uploadFile({
        fileName: fileName,
        contentType: contentType,
        fileData: fileData, // Pass the file object directly
      });

      if (uploadResult.storeUrl) {
        // Save the task action with uploaded video URL (no loader for task state)
        await orderService.upsertStepTaskAction({
          object: {
            key: 'LIVE_STREAM_RECORDING',
            url: uploadResult.storeUrl,
            value: fileName,
            quantity_dispensed: 0,
            task_id: currentDriverOrder?.id,
            customer_asset_id: currentAssetForDispense?.id,
          },
        });

        // Mark asset as having uploaded video
        const currentAssetId = currentAssetForDispense?.id;
        if (currentAssetId) {
          addAssetWithUploadedVideo(currentAssetId);
        }

        // Mark as streamed and completed
        setHasStreamedOnce(true);
        setStreamingState('stopped');
        setIsStreamUploaded(true);
        setUploadError(false); // Clear any previous upload errors

        // Clear any recorded video file since we uploaded from device
        setRecordedVideoFile(null);

        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: 'Video has been uploaded successfully',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Failed to upload selected video. Please try again.',
      });
    } finally {
      stopLoader('uploadVideo');
      setIsUploadingFromDevice(false);
    }
  };

  const handleManualUpload = async () => {
    if (!recordedVideoFile) {
      Toast.show({
        type: 'error',
        text1: 'No Recording Found',
        text2: 'No video file available for upload',
      });
      return;
    }

    try {
      startLoader('uploadVideo');
      setIsManualUploading(true);

      // Detect format from recorded file path
      const detectedFormat = recordedVideoFile.toLowerCase().includes('.webm')
        ? 'webm'
        : 'mp4';
      const contentType = `video/${detectedFormat}`;
      const fileName = `Recording_${currentDriverOrder?.customer_order?.order_code}.${detectedFormat}`;

      // Create file object for upload
      const fileData = {
        uri: recordedVideoFile,
        type: contentType,
        name: fileName,
      };

      console.log(
        `Manual upload format detected: ${detectedFormat}, Content-Type: ${contentType}`,
      );

      // Upload video to Google Cloud Storage
      const uploadResult = await supportService.uploadFile({
        fileName: fileName,
        contentType: contentType,
        fileData: fileData,
      });

      if (uploadResult.storeUrl) {
        // Update the task action with the new URL (no loader for task state)
        await orderService.upsertStepTaskAction({
          object: {
            key: 'LIVE_STREAM_RECORDING',
            url: uploadResult.storeUrl,
            value: fileName,
            quantity_dispensed: 0,
            task_id: currentDriverOrder?.id,
            customer_asset_id: currentAssetForDispense?.id,
          },
        });

        // Mark asset as having uploaded video
        const currentAssetId = currentAssetForDispense?.id;
        if (currentAssetId) {
          addAssetWithUploadedVideo(currentAssetId);
        }

        setUploadError(false);
        setIsStreamUploaded(true);

        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: 'Video has been uploaded to cloud storage',
        });

        // Clean up local file after successful upload (optional - keep for backup)
        // try {
        //   await RNFS.unlink(recordedVideoFile);
        //   setRecordedVideoFile(null);
        // } catch (cleanupError) {
        //   console.warn('Failed to delete local file:', cleanupError);
        // }
      }
    } catch (error) {
      console.error('Manual upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Failed to upload video. Please try again later.',
      });
    } finally {
      stopLoader('uploadVideo');
      setIsManualUploading(false);
    }
  };

  const handleSkipQuantityAndGoBack = () => {
    // If video was uploaded but user doesn't want to enter quantity now,
    // mark asset as partially filled so they can fill it later
    const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
    const assetsWithUploadedVideos =
      orderStore.getState().assetsWithUploadedVideos;

    if (currentAssetId && assetsWithUploadedVideos.includes(currentAssetId)) {
      // Asset has uploaded video but no quantity dispensed, mark as partially filled
      addPartiallyFilledAsset(currentAssetId);
    }

    // Navigate back to choose asset screen
    navigation.navigate('choose-asset');
  };

  const handleQuantityProceedBuddyCan = async (quantity: number) => {
    try {
      setIsLoading(true);
      setShowQuantityBottomSheet(false);

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;

      // Validate required data
      if (!currentDriverOrder?.id || !currentAssetId) {
        throw new Error('Missing required order or asset data');
      }

      // Get current location for task action
      const coordinates = await getCurrentLocation();

      // First, create step task action (following Vue.js pattern with TOTALIZER_AFTER_READING)
      const taskActionResponse = await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: '', // No image URL for livestream flow
          value: '0.0',
          quantity_dispensed: quantity,
          task_id: currentDriverOrder?.id, // Use task_id not customer_order.id
          customer_asset_id: currentAssetId,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Check if taskAction was successful (following Vue.js error handling)
      if (typeof taskActionResponse === 'string') {
        throw new Error(taskActionResponse);
      }

      // Update asset quantity (using correct parameters matching Vue.js)
      await orderService.updateAssetQty({
        customerAssetId: currentAssetId,
        customerOrderId: currentDriverOrder?.customer_order?.id,
        qty: quantity,
      });

      // Mark order as dispensing ONLY if it's currently in ARRIVED state (following Vue.js pattern)
      if (currentDriverOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          id: currentDriverOrder.id,
        });
      }

      // Update the local store to reflect the change immediately
      const updatedAssets = orderStore
        .getState()
        .orderAssets?.map((asset: any) => {
          const assetId =
            asset.customer_asset?.id || asset.id || asset.customer_asset_id;
          if (assetId === currentAssetId) {
            return {...asset, quantity_dispensed: quantity};
          }
          return asset;
        });

      orderStore.setState(state => ({
        ...state,
        orderAssets: updatedAssets,
      }));

      // Get requested quantity for this asset to determine if it's partially filled
      const currentAsset = updatedAssets?.find((asset: any) => {
        const assetId =
          asset.customer_asset?.id || asset.id || asset.customer_asset_id;
        return assetId === currentAssetId;
      });

      const requestedQuantity = currentAsset?.quantity_requested || 0;

      // Remove from uploaded videos array since quantity is now entered
      removeAssetWithUploadedVideo(currentAssetId);

      // Update partially filled assets array based on the dispensed quantity
      if (quantity > 0 && quantity < requestedQuantity) {
        // Asset is now partially filled
        addPartiallyFilledAsset(currentAssetId);
      } else if (quantity >= requestedQuantity) {
        // Asset is now complete, remove from partially filled array
        removePartiallyFilledAsset(currentAssetId);
      }

      Toast.show({
        type: 'success',
        text1: 'Quantity Updated',
        text2: `${quantity}L has been dispensed`,
      });

      // Navigate to choose asset page (following Vue.js flow)
      navigation.navigate('choose-asset');
    } catch (error) {
      console.error('Error in handleQuantityProceedBuddyCan:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Failed to update quantity. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityProceedBowser = async (quantity: number) => {
    try {
      setIsLoading(true);
      setShowQuantityBottomSheet(false);

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
      const driverVehicleId = currentDriverOrder?.driver_vehicle_id;

      // Validate required data for bowser (FILL_UP)
      if (!currentDriverOrder?.id || (!currentAssetId && !driverVehicleId)) {
        throw new Error('Missing required order or vehicle data for bowser');
      }

      // Get current location for task action
      const coordinates = await getCurrentLocation();

      // Create step task action for bowser (similar to Vue totalizer after manual)
      const taskActionResponse = await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: '', // No image URL for livestream flow
          value: '0.0', // This would be totalizer reading + before reading in Vue
          quantity_dispensed: quantity,
          task_id: currentDriverOrder?.id,
          ...(orderStore.getState().currentDriverOrder?.category === 'DELIVERY'
            ? {customer_asset_id: `${currentAssetId}`}
            : {
                vehicle_id:
                  currentAssetId ||
                  checkinStore.getState().driverVehicleDetails?.id,
              }),
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Check if taskAction was successful
      if (typeof taskActionResponse === 'string') {
        throw new Error(taskActionResponse);
      }

      // Update asset quantity (using correct parameters matching Vue.js)
      if (orderStore.getState().currentDriverOrder?.category === 'DELIVERY') {
        await orderService.updateAssetQty({
          customerAssetId: currentAssetId,
          customerOrderId: currentDriverOrder?.customer_order?.id,
          qty: quantity,
        });
      }

      // For bowser, no asset quantity update needed as it's vehicle-to-vehicle transfer
      // Mark order as dispensing if in ARRIVED state
      if (currentDriverOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          id: currentDriverOrder.id,
        });
      }

      // Update the local store to reflect the change immediately
      const updatedAssets = orderStore
        .getState()
        .orderAssets?.map((asset: any) => {
          const assetId =
            asset.customer_asset?.id || asset.id || asset.customer_asset_id;
          if (assetId === currentAssetId) {
            return {...asset, quantity_dispensed: quantity};
          }
          return asset;
        });

      // Get requested quantity for this asset to determine if it's partially filled
      const currentAsset = updatedAssets?.find((asset: any) => {
        const assetId =
          asset.customer_asset?.id || asset.id || asset.customer_asset_id;
        return assetId === currentAssetId;
      });

      // Update both orderAssets and quantityDispensed in store for bowser
      console.log('=== BOWSER QUANTITY UPDATE DEBUG ===');
      console.log('currentAssetId:', currentAssetId);
      console.log('quantity:', quantity);
      console.log(
        'updatedAssets:',
        JSON.stringify(
          updatedAssets?.map(a => ({
            id: a.customer_asset?.id || a.id,
            quantity_dispensed: a.quantity_dispensed,
          })),
          null,
          2,
        ),
      );
      console.log('currentAsset found:', currentAsset);

      orderStore.setState(state => ({
        ...state,
        orderAssets: updatedAssets,
        quantityDispensed: quantity,
      }));

      const requestedQuantity = currentAsset?.quantity_requested || 0;

      // Remove from uploaded videos array since quantity is now entered (only if currentAssetId exists)
      if (currentAssetId) {
        removeAssetWithUploadedVideo(currentAssetId);

        // Update partially filled assets array based on the dispensed quantity
        if (quantity > 0 && quantity < requestedQuantity) {
          // Asset is now partially filled
          addPartiallyFilledAsset(currentAssetId);
        } else if (quantity >= requestedQuantity) {
          // Asset is now complete, remove from partially filled array
          removePartiallyFilledAsset(currentAssetId);
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Quantity Updated',
        text2: `${quantity}L has been dispensed to bowser`,
      });

      // For bowser flow, navigate back or to completion screen
      navigation.navigate('choose-asset');
    } catch (error) {
      console.error('Error in handleQuantityProceedBowser:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Failed to update bowser quantity. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityProceed = async (quantity: number) => {
    // Route to appropriate handler based on order category
    if (orderStore.getState().currentDriverOrder?.is_enable_buddycan_flow) {
      // Buddy can flow
      await handleQuantityProceedBuddyCan(quantity);
    } else if (orderStore.getState().currentDriverOrder?.is_done_locally) {
      // Bowser flow
      await handleQuantityProceedBowser(quantity);
    } else {
      Alert.alert(
        'Unknown Order Type',
        'This order is for automation. Please raise cancel request',
      );
    }
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={FBColors.primary} />
          <Text style={StyleSheet.flatten(styles.loadingText)}>
            Checking permissions...
          </Text>
        </View>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <PermissionScreen
        permissionStatus={permissionStatus}
        isLoading={isLoading}
        onRetry={checkPermissions}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  // Main camera interface
  return (
    <View style={styles.container}>
      {/* Header Section - Fixed height */}
      <View style={styles.headerSection}>
        <OrderInfoCard />
      </View>

      {/* Camera Section - Flexible area that takes remaining space */}
      <View style={styles.cameraSection}>
        <View style={styles.cameraContainer}>
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}
            androidCameraPermissionOptions={{
              title: 'Camera Permission',
              message: 'We need camera access for live streaming',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
            androidRecordAudioPermissionOptions={{
              title: 'Audio Permission',
              message: 'We need microphone access for live streaming',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
          />

          {/* Upload from device overlay - ONLY show after upload failure */}
          {!isRecording &&
            hasStreamedOnce &&
            uploadError &&
            !isStreamUploaded && (
              <View style={styles.uploadOverlay}>
                <TouchableOpacity
                  onPress={uploadVideoFromDevice}
                  disabled={isUploadingFromDevice}
                  style={styles.uploadButton}>
                  <Text
                    size="sm"
                    weight="600"
                    style={styles.uploadButtonText as any}>
                    {isUploadingFromDevice ? 'Uploading...' : '📁 Upload Video'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          <CameraOverlay
            isRecording={isRecording}
            isPaused={isPaused}
            recordingDuration={recordingDuration}
            canStopStream={canStopStream}
            streamingDurationSeconds={streamingDurationSeconds}
          />
        </View>
      </View>

      {/* Controls Section - Fixed height at bottom */}
      <View style={styles.controlsSection}>
        <StreamControls
          isRecording={isRecording}
          isPaused={isPaused}
          isLoading={isLoading}
          canStopStream={canStopStream}
          hasStreamedOnce={hasStreamedOnce}
          streamingState={streamingState}
          isStreamUploaded={isStreamUploaded}
          onStartRecording={startRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onStopRecording={stopRecording}
          onNext={goNext}
          // Button loading states
          isStartingRecording={isStartingRecording}
          isPausingRecording={isPausingRecording}
          isResumingRecording={isResumingRecording}
          isStoppingRecording={isStoppingRecording}
        />

        {/* Upload Error Section - Show within controls area when error occurs */}
        {uploadError && hasStreamedOnce && !isStreamUploaded && (
          <CardElevated cardStyle={styles.uploadErrorCard}>
            <View style={styles.uploadErrorContent}>
              <Text
                size="base"
                weight="600"
                style={styles.uploadErrorTitle as any}>
                Live Stream Upload Failed
              </Text>
              <Text size="sm" style={styles.uploadErrorMessage as any}>
                {recordedVideoFile
                  ? 'Your recorded video was saved locally. You can retry uploading it or upload a different video from your device'
                  : 'Live stream upload failed. You can upload a video from your device to continue'}
              </Text>
              <View style={styles.uploadErrorActions}>
                {recordedVideoFile && (
                  <Button
                    variant="solid"
                    onPress={handleManualUpload}
                    disabled={isManualUploading}
                    loading={isManualUploading}
                    style={styles.retryButton}>
                    {isManualUploading ? 'Retrying...' : 'Retry Recorded'}
                  </Button>
                )}
                <Button
                  variant={recordedVideoFile ? 'outlined' : 'solid'}
                  onPress={uploadVideoFromDevice}
                  disabled={isUploadingFromDevice}
                  loading={isUploadingFromDevice}
                  style={[
                    styles.uploadVideoButton,
                    !recordedVideoFile && styles.uploadVideoButtonSolid,
                  ]}>
                  <Text size="sm" style={styles.uploadVideoButtonText as any}>
                    {isUploadingFromDevice ? 'Uploading...' : 'Upload Video'}
                  </Text>
                </Button>
                {recordedVideoFile && (
                  <Button
                    variant="outlined"
                    onPress={showVideoLocation}
                    style={styles.showPathButton}>
                    <Text size="sm" style={styles.showPathButtonText as any}>
                      Show Path
                    </Text>
                  </Button>
                )}
              </View>
            </View>
          </CardElevated>
        )}
      </View>

      {/* Quantity Bottom Sheet */}
      <QuantityBottomSheet
        visible={showQuantityBottomSheet}
        onClose={() => {
          setShowQuantityBottomSheet(false);
          handleSkipQuantityAndGoBack();
        }}
        onProceed={handleQuantityProceed}
        orderQuantity={
          currentDriverOrder?.customer_order?.customer_order_items?.[0]?.qty ||
          0
        }
        existingQuantity={getCurrentAssetFilledQuantity()}
      />

      {/* FullScreen Loaders - Only for video upload */}
      <FullScreenLoader
        showLoader={loaders.uploadVideo}
        loaderText="Uploading video..."
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: FBColors.white,
    paddingHorizontal: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: FBColors.neutral,
    textAlign: 'center',
  },
  // Header Section - Fixed height
  headerSection: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  orderDetailsCard: {
    padding: 16,
    backgroundColor: FBBackground.white,
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  // Camera Section - Flexible area
  cameraSection: {
    flex: 1,
    minHeight: 300, // Minimum height to ensure camera is usable
    marginVertical: 8,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  camera: {
    flex: 1,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 12,
    zIndex: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
  },
  // Controls Section - Fixed height at bottom
  controlsSection: {
    paddingVertical: 12,
    backgroundColor: FBColors.white,
  },
  // Upload Error Styles
  uploadErrorCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7', // Light amber background
    borderColor: '#F59E0B', // Amber border
    borderWidth: 1,
  },
  uploadErrorContent: {
    alignItems: 'center',
  },
  uploadErrorTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#92400E', // Dark amber text
  },
  uploadErrorMessage: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#92400E',
  },
  uploadErrorActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    minWidth: 110,
  },
  uploadVideoButton: {
    borderColor: '#F59E0B',
    minWidth: 110,
  },
  uploadVideoButtonSolid: {
    backgroundColor: '#F59E0B',
  },
  uploadVideoButtonText: {
    color: '#F59E0B',
  },
  showPathButton: {
    borderColor: '#F59E0B',
    minWidth: 90,
  },
  showPathButtonText: {
    color: '#F59E0B',
  },
  // Legacy styles kept for backward compatibility
  orderDetailsSection: {
    paddingTop: 16,
  },
  cardTitle: {
    marginBottom: 0,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: 80,
  },
});

export default LiveStreamScreen;
