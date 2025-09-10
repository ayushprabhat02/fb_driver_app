import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';

// Components
import {
  Text,
  CardElevated,
  QuantityBottomSheet,
  Divider,
} from '@/components';
import PermissionScreen from '../components/PermissionScreen';
import CameraOverlay from '../components/CameraOverlay';
import StreamControls from '../components/StreamControls';

// Store
import {orderStore} from '@/globalStore';

// Services
import orderService from '../services';
import supportService from '@/modules/support/services';

// Types
import {FBColors, FBBackground} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';

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
    'not_started' | 'started' | 'stopped'
  >('not_started');
  const [showQuantityBottomSheet, setShowQuantityBottomSheet] = useState(false);

  // Store
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const orderAssets = orderStore.use.orderAssets();
  const addPartiallyFilledAsset = orderStore.use.addPartiallyFilledAsset();
  const removePartiallyFilledAsset = orderStore.use.removePartiallyFilledAsset();
  const addAssetWithUploadedVideo = orderStore.use.addAssetWithUploadedVideo();
  const removeAssetWithUploadedVideo = orderStore.use.removeAssetWithUploadedVideo();

  console.log('--currentDriverOrder---', currentDriverOrder);

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

  // Check permissions on component mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Setup recording timer (increments duration only)
  useEffect(() => {
    if (!isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

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
      setIsLoading(true);
      setStreamingState('started');

      // Validate required data
      if (!currentDriverOrder?.customer_order?.id) {
        throw new Error('Order data is missing');
      }

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
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

      // Update stream status via API
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

      // Start recording without blocking the UI; allow Stop button to enable after 10s
      const recordPromise = cameraRef.current.recordAsync(recordOptions);
      // We are done with the "starting" state, enable controls
      setIsLoading(false);

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
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      setIsLoading(true);
      setStreamingState('stopped');

      // Update stream status via API
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_STOPPED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentDriverOrder?.id,
          customer_asset_id: orderStore.getState().currentAssetForDispense?.id,
        },
      });

      await orderService.updateTaskLiveDispensingStatus({
        task_id: currentDriverOrder?.id || '',
        is_live_dispensing: false,
      });

      cameraRef.current.stopRecording();
      setIsRecording(false);

      // Reset timer states
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCanStopStream(false);
      setRecordingDuration(0);

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
      setIsLoading(false);
    }
  };

  const handleRecordingFinished = async (data: any) => {
    try {
      // filename
      const fileName = `Recording_${currentDriverOrder?.customer_order?.order_code}.mp4`;

      let uploadedUrl = data.uri || ''; // Fallback to local URI
      let uploadSuccess = false;

      try {
        // Convert video URI to blob for upload
        const response = await fetch(data.uri);
        const blob = await response.blob();

        console.log(`Video size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

        // Upload video to Google Cloud Storage
        const uploadResult = await supportService.uploadFile({
          fileName: fileName,
          contentType: 'video/mp4',
          fileData: blob,
        });

        if (uploadResult.storeUrl) {
          uploadedUrl = uploadResult.storeUrl;
          uploadSuccess = true;
          setIsStreamUploaded(true);
        }
      } catch (uploadError) {
        console.warn('Cloud upload failed, using local file:', uploadError);
        // Continue with local URI as fallback
      }

      // Save the task action with uploaded video URL or local URI
      await orderService.upsertStepTaskAction({
        object: {
          key: 'LIVE_STREAM_RECORDING',
          url: uploadedUrl,
          value: fileName,
          quantity_dispensed: 0,
          task_id: currentDriverOrder?.id,
          customer_asset_id: orderStore.getState().currentAssetForDispense?.id,
        },
      });

      // Mark asset as having uploaded video
      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
      if (currentAssetId && uploadSuccess) {
        addAssetWithUploadedVideo(currentAssetId);
      }

      Toast.show({
        type: 'success',
        text1: uploadSuccess ? 'Recording Uploaded' : 'Recording Saved',
        text2: uploadSuccess
          ? 'Successfully uploaded to cloud storage'
          : 'Saved locally - will sync when connection improves',
      });
    } catch (error) {
      console.error('Process recording error:', error);
      setIsStreamUploaded(false);
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: 'Failed to save recording. Please try again.',
      });
    }
  };

  const goNext = () => {
    const canProceed =
      !isRecording && hasStreamedOnce && streamingState === 'stopped';

    if (!canProceed) {
      Alert.alert(
        'Complete Streaming',
        'Please complete streaming before proceeding to the next step.',
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

  const handleSkipQuantityAndGoBack = () => {
    // If video was uploaded but user doesn't want to enter quantity now,
    // mark asset as partially filled so they can fill it later
    const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
    const assetsWithUploadedVideos = orderStore.getState().assetsWithUploadedVideos;
    
    if (currentAssetId && assetsWithUploadedVideos.includes(currentAssetId)) {
      // Asset has uploaded video but no quantity dispensed, mark as partially filled
      addPartiallyFilledAsset(currentAssetId);
    }

    // Navigate back to choose asset screen
    navigation.navigate('choose-asset');
  };

  const handleQuantityProceed = async (quantity: number) => {
    try {
      setIsLoading(true);
      setShowQuantityBottomSheet(false);

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;

      // Get current location for task action
      const getCurrentLocation = (): Promise<{
        latitude: number;
        longitude: number;
      }> => {
        return new Promise(resolve => {
          // Use fallback coordinates for now (actual implementation would use proper geolocation)
          resolve({
            latitude: 28.626330828,
            longitude: 77.218499126,
          });
        });
      };

      const coordinates = await getCurrentLocation();

      // Create step task action for quantity dispensed (similar to TOTALIZER_AFTER_READING in Vue.js)
      await orderService.upsertStepTaskAction({
        object: {
          key: 'QUANTITY_DISPENSED',
          url: '', // No image URL for now
          value: '0.0',
          quantity_dispensed: quantity,
          task_id: currentDriverOrder?.customer_order?.id,
          customer_asset_id: currentAssetId,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      // Update asset quantity
      await orderService.updateAssetQty({
        customerAssetId: currentAssetId,
        customerOrderId: currentDriverOrder?.customer_order?.id,
        qty: quantity,
      });

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
        const assetId = asset.customer_asset?.id || asset.id || asset.customer_asset_id;
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

      // Mark order as dispensing if it's currently in ARRIVED state
      if (currentDriverOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          task_id: currentDriverOrder.id,
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Quantity Updated',
        text2: `${quantity}L has been dispensed`,
      });

      // Navigate to choose asset page (following Vue.js flow)
      navigation.navigate('choose-asset');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update quantity. Please try again.',
      });
    } finally {
      setIsLoading(false);
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
      {/* Order Details Card */}
      <CardElevated
        cardStyle={{
          // marginBottom: 16,
          padding: 16,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
          <Text weight="bold" size="lg" color="primary">
            Order Details
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text weight="600" size="sm" color="neutral">
            Customer Name:
          </Text>
          <Text weight="400" size="sm" style={{flex: 1, textAlign: 'right'}}>
            {`${
              currentDriverOrder?.customer_order?.organization_user?.user
                ?.first_name || ''
            } ${
              currentDriverOrder?.customer_order?.organization_user?.user
                ?.last_name || ''
            }`.trim() || 'N/A'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}>
          <Text weight="600" size="sm" color="neutral">
            Order Code:
          </Text>
          <Text weight="400" size="sm" style={{flex: 1, textAlign: 'right'}}>
            {currentDriverOrder?.customer_order?.order_code || 'N/A'}
          </Text>
        </View>
      </CardElevated>

      <Divider height={50} />

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

        <CameraOverlay
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          canStopStream={canStopStream}
          streamingDurationSeconds={streamingDurationSeconds}
        />
      </View>

      <Divider height={10} />

      <StreamControls
        isRecording={isRecording}
        isLoading={isLoading}
        canStopStream={canStopStream}
        hasStreamedOnce={hasStreamedOnce}
        streamingState={streamingState}
        isStreamUploaded={isStreamUploaded}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onNext={goNext}
      />

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
  orderDetailsSection: {
    paddingTop: 16,
  },
  orderDetailsCard: {
    padding: 16,
    backgroundColor: FBBackground.white,
  },
  cardTitle: {
    marginBottom: 0,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  camera: {
    flex: 1,
    width: '100%',
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
