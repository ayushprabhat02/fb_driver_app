import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import {ScaledSheet} from 'react-native-size-matters';

// WebRTC imports
import {
  RTCView,
  mediaDevices,
  MediaStream,
  registerGlobals,
} from 'react-native-webrtc';
import * as mediasoupClient from 'mediasoup-client';
import type {Device, Transport, Producer} from 'mediasoup-client/lib/types';

// Register WebRTC globals for mediasoup-client compatibility
registerGlobals();

// Components
import {
  Text,
  CardElevated,
  QuantityBottomSheet,
  FullScreenLoader,
} from '@/components';
import PermissionScreen from '../components/PermissionScreen';
import CameraOverlay from '../components/CameraOverlay';
import StreamControls from '../components/StreamControls';

// Store
import {checkinStore, orderStore, authStore} from '@/globalStore';

// Services
import orderService from '../services';

// Types
import {FBColors, FBBackground} from '@/types/styles';
import {OrderStackParamList} from '@/navigator/containers/Order';
import {getCurrentLocation} from '@/utils/location';
import {
  clearStreamState,
  saveAssetWithUploadedVideo,
} from '@/utils/streamStorage';

// Firebase
import auth from '@react-native-firebase/auth';

type LiveStreamNavigationProp = StackNavigationProp<
  OrderStackParamList,
  'live-stream'
>;

interface LiveStreamScreenProps {
  route?: any;
}

// WebSocket URL for mediasoup server
// const WS_URL = 'wss://soup.fuelbuddy.in';
// Staging URL
const WS_URL = 'https://staging-soup.fuelbuddy.dev/rooms';
// LOCAL
// const WS_URL = 'ws://localhost:3000';

// Video quality settings
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const VIDEO_FRAMERATE = 15;

const LiveStreamScreen: React.FC<LiveStreamScreenProps> = () => {
  const navigation = useNavigation<LiveStreamNavigationProp>();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC refs
  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Producer[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  // State
  const [isStreaming, setIsStreaming] = useState(false);
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
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Button loading states
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [isStoppingStream, setIsStoppingStream] = useState(false);

  // Store
  const currentDriverOrder = orderStore.use.currentDriverOrder();
  const orderAssets = orderStore.use.orderAssets();
  const addPartiallyFilledAsset = orderStore.use.addPartiallyFilledAsset();
  const removePartiallyFilledAsset =
    orderStore.use.removePartiallyFilledAsset();
  const addAssetWithUploadedVideo = orderStore.use.addAssetWithUploadedVideo();
  const removeAssetWithUploadedVideo =
    orderStore.use.removeAssetWithUploadedVideo();
  const startLoader = orderStore.use.startLoader();
  const stopLoader = orderStore.use.stopLoader();
  const loaders = orderStore.use.loaders();

  // Minimum streaming duration (10 seconds for testing)
  const streamingDurationSeconds = 10;

  // Generate room ID similar to Vue.js
  const getRoomId = useCallback(() => {
    const currentTask = orderStore.getState().currentDriverOrder;
    const currentAsset = orderStore.getState().currentAssetForDispense;
    const orderCode = currentTask?.customer_order?.order_code;
    const driverVehicleId = currentTask?.driver_vehicle_id;
    const assetId = currentAsset?.id;
    return orderCode && driverVehicleId && assetId
      ? `${orderCode}-${driverVehicleId}-${assetId}`
      : '';
  }, []);

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

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Timer effect - only runs when streaming
  useEffect(() => {
    if (!isStreaming) {
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
  }, [isStreaming]);

  // Enable stop after threshold
  useEffect(() => {
    if (
      isStreaming &&
      recordingDuration >= streamingDurationSeconds &&
      !canStopStream
    ) {
      setCanStopStream(true);
      Toast.show({
        type: 'info',
        text1: 'Minimum Duration Reached',
        text2: 'You can now stop the stream',
      });
    }
  }, [recordingDuration, isStreaming, canStopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediasoup();
      cleanupLocalMedia();
    };
  }, []);

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

      const currentCameraStatus = await check(cameraPermission);
      const currentMicStatus = await check(micPermission);

      let cameraResult = currentCameraStatus;
      let micResult = currentMicStatus;

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
    } catch (err) {
      console.error('Permission error:', err);
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

  // Send message via WebSocket
  const sendMessage = useCallback(
    async (msg: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Get fresh values from store
        const currentTask = orderStore.getState().currentDriverOrder;
        const currentAsset = orderStore.getState().currentAssetForDispense;
        const userId = authStore.getState().firebaseUser?.uid;
        const authToken = authStore.getState().authToken;

        // Get fresh Firebase ID token
        let idToken = authToken;
        const firebaseUser = auth().currentUser;
        if (firebaseUser && !idToken) {
          try {
            idToken = await firebaseUser.getIdToken();
          } catch (e) {
            console.error('Failed to get Firebase ID token:', e);
          }
        }

        const userData = {
          userId: userId,
          userClaim: null, // Will be filled by server if needed
          authToken: idToken,
          refreshToken: null, // Not supported in React Native Firebase
          organisationUserId: null,
          email: firebaseUser?.email,
          taskId: currentTask?.id,
          customerAssetId: currentAsset?.id,
        };

        const messagePayload = {
          ...msg,
          roomId: getRoomId(),
          isViewer: false,
          user: userData,
        };

        console.log(`[WebSocket] Sending message:`, {
          type: msg.type,
          hasAuthToken: !!userData.authToken,
          userId: userData.userId,
        });

        wsRef.current.send(JSON.stringify(messagePayload));
      }
    },
    [getRoomId],
  );

  // Initialize WebSocket
  const initWebSocket = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected');
        resolve();
      };

      wsRef.current.onerror = e => {
        console.error('[WebSocket] Error:', e);
        reject(new Error('WebSocket connection failed'));
      };

      wsRef.current.onmessage = handleWebSocketMessage;

      wsRef.current.onclose = () => {
        console.log('[WebSocket] Closed');
      };
    });
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = async (event: {data?: string}) => {
    try {
      if (!event.data) return;
      const msg = JSON.parse(event.data);
      console.log('[WebSocket] Received:', msg.type);

      switch (msg.type) {
        case 'room-joined':
          deviceRef.current = new mediasoupClient.Device();
          sendMessage({type: 'get-rtp-capabilities'});
          break;

        case 'rtp-capabilities':
          if (deviceRef.current && !deviceRef.current.loaded) {
            try {
              await deviceRef.current.load({
                routerRtpCapabilities: msg.rtpCapabilities,
              });
              sendMessage({type: 'create-send-transport'});
            } catch (err: any) {
              setError(`Error loading device: ${err.message}`);
              console.error(err);
            }
          }
          break;

        case 'transport-created':
          if (msg.direction === 'send') {
            await setupSendTransport(msg.transportOptions);
          }
          break;

        case 'recording-stopped':
          // Server-side recording finished - receive the video URL
          console.log(
            '[WebSocket] Recording stopped, video URL:',
            msg.videoUrl,
          );
          if (msg.videoUrl) {
            await handleRecordingComplete(msg.videoUrl);
          }
          break;

        case 'error':
          setError(msg.error);
          console.error('[WebSocket] Error:', msg.error);
          break;
      }
    } catch (err) {
      console.error('[WebSocket] Message parse error:', err);
    }
  };

  // Setup send transport for producing video/audio
  const setupSendTransport = async (transportOptions: any) => {
    if (!deviceRef.current) return;

    sendTransportRef.current =
      deviceRef.current.createSendTransport(transportOptions);

    sendTransportRef.current.on('connect', ({dtlsParameters}, callback) => {
      sendMessage({
        type: 'connect-transport',
        transportId: sendTransportRef.current?.id,
        dtlsParameters,
      });
      callback();
    });

    sendTransportRef.current.on(
      'produce',
      ({kind, rtpParameters}, callback) => {
        sendMessage({
          type: 'produce',
          transportId: sendTransportRef.current?.id,
          kind,
          rtpParameters,
        });
        callback({id: Date.now().toString()});
      },
    );

    // Produce local tracks
    await produceLocalTracks();
  };

  // Produce video and audio tracks
  const produceLocalTracks = async () => {
    if (!localStreamRef.current || !sendTransportRef.current) return;

    const tracks = localStreamRef.current.getTracks();

    for (const track of tracks) {
      try {
        const producer = await sendTransportRef.current.produce({
          track,
        });
        producersRef.current.push(producer);
        console.log(`[MediaSoup] Produced ${track.kind} track`);
      } catch (err) {
        console.error(`[MediaSoup] Failed to produce ${track.kind}:`, err);
      }
    }
  };

  // Cleanup mediasoup resources
  const cleanupMediasoup = () => {
    producersRef.current.forEach(p => p.close());
    producersRef.current = [];

    sendTransportRef.current?.close();
    sendTransportRef.current = null;

    wsRef.current?.close();
    wsRef.current = null;

    deviceRef.current = null;
  };

  // Cleanup local media
  const cleanupLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  };

  // Handle recording complete with server URL
  const handleRecordingComplete = async (videoUrl: string) => {
    try {
      startLoader('uploadVideo');

      const currentTask = orderStore.getState().currentDriverOrder;
      const currentAsset = orderStore.getState().currentAssetForDispense;

      // Save the task action with server-provided video URL
      await orderService.upsertStepTaskAction({
        object: {
          key: 'LIVE_STREAM_RECORDING',
          url: videoUrl,
          value: `Recording_${currentTask?.customer_order?.order_code}.webm`,
          quantity_dispensed: 0,
          task_id: currentTask?.id,
          customer_asset_id: currentAsset?.id,
        },
      });

      // Mark asset as having uploaded video
      const currentAssetId = currentAsset?.id;
      if (currentAssetId) {
        addAssetWithUploadedVideo(currentAssetId);
        await saveAssetWithUploadedVideo(currentTask?.id || '', currentAssetId);
      }

      setIsStreamUploaded(true);

      Toast.show({
        type: 'success',
        text1: 'Stream Recorded',
        text2: 'Video has been saved to cloud storage',
      });
    } catch (err) {
      console.error('Error saving recording:', err);
      Toast.show({
        type: 'error',
        text1: 'Recording Save Failed',
        text2: 'Failed to save recording data',
      });
    } finally {
      stopLoader('uploadVideo');
      setIsStoppingStream(false);
    }
  };

  // Start streaming
  const startStream = async () => {
    try {
      setIsStartingStream(true);
      setError(null);

      // Validate required data
      const currentTask = orderStore.getState().currentDriverOrder;
      const currentAsset = orderStore.getState().currentAssetForDispense;

      if (!currentTask?.customer_order?.id) {
        throw new Error('Order data is missing');
      }

      if (!currentAsset?.id) {
        throw new Error('Asset data is missing');
      }

      // Reset states
      setRecordingDuration(0);
      setCanStopStream(false);
      setHasStreamedOnce(true);
      setStreamingState('started');

      // Get camera stream using react-native-webrtc
      const stream = await mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
          frameRate: VIDEO_FRAMERATE,
        },
        audio: true,
      });

      localStreamRef.current = stream as MediaStream;
      setLocalStream(stream as MediaStream);

      // Update stream status via API
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_STARTED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentTask?.id,
          customer_asset_id: currentAsset?.id,
        },
      });

      await orderService.updateTaskLiveDispensingStatus({
        task_id: currentTask?.id,
        is_live_dispensing: true,
      });

      // Connect to WebSocket and join room
      await initWebSocket();
      sendMessage({
        type: 'join-room',
        isViewer: false,
        orderCode: currentTask?.customer_order?.order_code,
        driverVehicleId: currentTask?.driver_vehicle_id,
        assetId: currentAsset?.id,
      });

      setIsStreaming(true);

      Toast.show({
        type: 'success',
        text1: 'Stream Started',
        text2: 'Live streaming is now active',
      });
    } catch (err: any) {
      console.error('Start stream error:', err);
      setError(err.message);
      cleanupLocalMedia();
      Toast.show({
        type: 'error',
        text1: 'Stream Failed',
        text2: err.message || 'Unable to start streaming',
      });
    } finally {
      setIsStartingStream(false);
    }
  };

  // Stop streaming
  const stopStream = async () => {
    if (!canStopStream) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Stop Stream',
        text2: `Please stream for at least ${streamingDurationSeconds} seconds`,
      });
      return;
    }

    try {
      setIsStoppingStream(true);
      setStreamingState('stopped');

      const currentTask = orderStore.getState().currentDriverOrder;
      const currentAsset = orderStore.getState().currentAssetForDispense;

      // Update stream status via API
      await orderService.upsertStepTaskAction({
        object: {
          key: 'STREAM_STOPPED',
          url: '',
          value: new Date().toISOString(),
          task_id: currentTask?.id,
          customer_asset_id: currentAsset?.id,
        },
      });

      await orderService.updateTaskLiveDispensingStatus({
        task_id: currentTask?.id || '',
        is_live_dispensing: false,
      });

      // Send leave-room message - server will send recording-stopped with video URL
      sendMessage({type: 'leave-room'});

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Cleanup
      cleanupMediasoup();
      cleanupLocalMedia();

      setIsStreaming(false);
      setRecordingDuration(0);
      setCanStopStream(false);

      // Clear persisted state
      await clearStreamState();

      Toast.show({
        type: 'info',
        text1: 'Stream Stopped',
        text2: 'Processing recording... Please wait',
      });

      // Note: isStoppingStream will be reset in handleRecordingComplete
      // when we receive the recording-stopped message with video URL

      // If we don't receive recording-stopped within 10 seconds,
      // reset the state anyway
      setTimeout(() => {
        setIsStoppingStream(prev => {
          if (prev) {
            // Server didn't respond with video URL
            Toast.show({
              type: 'info',
              text1: 'Stream Complete',
              text2: 'Recording saved on server',
            });
            setIsStreamUploaded(true);
            return false;
          }
          return prev;
        });
      }, 10000);
    } catch (err: any) {
      console.error('Stop stream error:', err);
      Toast.show({
        type: 'error',
        text1: 'Stop Failed',
        text2: 'Unable to stop stream properly',
      });
      setIsStoppingStream(false);
    }
  };

  const goNext = () => {
    const canProceed =
      !isStreaming && hasStreamedOnce && streamingState === 'stopped';

    if (!canProceed) {
      Alert.alert(
        'Complete Streaming',
        'Please complete streaming (start and stop) before proceeding to the next step.',
      );
      return;
    }

    // Reset streaming state
    setStreamingState('not_started');
    setHasStreamedOnce(false);
    setRecordingDuration(0);
    setCanStopStream(false);

    // Show quantity bottom sheet
    setShowQuantityBottomSheet(true);
  };

  const handleSkipQuantityAndGoBack = () => {
    const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
    const assetsWithUploadedVideos =
      orderStore.getState().assetsWithUploadedVideos;

    if (currentAssetId && assetsWithUploadedVideos.includes(currentAssetId)) {
      addPartiallyFilledAsset(currentAssetId);
    }

    navigation.navigate('choose-asset');
  };

  const handleQuantityProceedBuddyCan = async (quantity: number) => {
    try {
      startLoader('uploadVideo');

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
      const currentTask = orderStore.getState().currentDriverOrder;

      if (!currentTask?.id || !currentAssetId) {
        throw new Error('Missing required order or asset data');
      }

      const coordinates = await getCurrentLocation();

      const taskActionResponse = await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: '',
          value: '0.0',
          quantity_dispensed: quantity,
          task_id: currentTask?.id,
          customer_asset_id: currentAssetId,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      });

      if (typeof taskActionResponse === 'string') {
        throw new Error(taskActionResponse);
      }

      await orderService.updateAssetQty({
        customerAssetId: currentAssetId,
        customerOrderId: currentTask?.customer_order?.id,
        qty: quantity,
      });

      if (currentTask?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          id: currentTask.id,
        });
      }

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

      const currentAsset = updatedAssets?.find((asset: any) => {
        const assetId =
          asset.customer_asset?.id || asset.id || asset.customer_asset_id;
        return assetId === currentAssetId;
      });

      const requestedQuantity = currentAsset?.quantity_requested || 0;

      removeAssetWithUploadedVideo(currentAssetId);

      if (quantity > 0 && quantity < requestedQuantity) {
        addPartiallyFilledAsset(currentAssetId);
      } else if (quantity >= requestedQuantity) {
        removePartiallyFilledAsset(currentAssetId);
      }

      stopLoader('uploadVideo');
      setShowQuantityBottomSheet(false);

      Toast.show({
        type: 'success',
        text1: 'Quantity Updated',
        text2: `${quantity}L has been dispensed`,
      });

      navigation.navigate('choose-asset');
    } catch (err: any) {
      console.error('Error in handleQuantityProceedBuddyCan:', err);
      stopLoader('uploadVideo');
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.message || 'Failed to update quantity. Please try again.',
      });
    }
  };

  const handleQuantityProceedBowser = async (quantity: number) => {
    try {
      startLoader('uploadVideo');

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
      const currentTask = orderStore.getState().currentDriverOrder;
      const driverVehicleId = currentTask?.driver_vehicle_id;

      if (!currentTask?.id || (!currentAssetId && !driverVehicleId)) {
        throw new Error('Missing required order or vehicle data for bowser');
      }

      const coordinates = await getCurrentLocation();

      const taskActionResponse = await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: '',
          value: '0.0',
          quantity_dispensed: quantity,
          task_id: currentTask?.id,
          ...(currentTask?.category === 'DELIVERY'
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

      if (typeof taskActionResponse === 'string') {
        throw new Error(taskActionResponse);
      }

      if (currentTask?.category === 'DELIVERY') {
        await orderService.updateAssetQty({
          customerAssetId: currentAssetId,
          customerOrderId: currentTask?.customer_order?.id,
          qty: quantity,
        });
      }

      if (currentTask?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          id: currentTask.id,
        });
      }

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

      const currentAsset = updatedAssets?.find((asset: any) => {
        const assetId =
          asset.customer_asset?.id || asset.id || asset.customer_asset_id;
        return assetId === currentAssetId;
      });

      orderStore.setState(state => ({
        ...state,
        orderAssets: updatedAssets,
        quantityDispensed: quantity,
      }));

      const requestedQuantity = currentAsset?.quantity_requested || 0;

      if (currentAssetId) {
        removeAssetWithUploadedVideo(currentAssetId);

        if (quantity > 0 && quantity < requestedQuantity) {
          addPartiallyFilledAsset(currentAssetId);
        } else if (quantity >= requestedQuantity) {
          removePartiallyFilledAsset(currentAssetId);
        }
      }

      stopLoader('uploadVideo');
      setShowQuantityBottomSheet(false);

      Toast.show({
        type: 'success',
        text1: 'Quantity Updated',
        text2: `${quantity}L has been dispensed to bowser`,
      });

      navigation.navigate('choose-asset');
    } catch (err: any) {
      console.error('Error in handleQuantityProceedBowser:', err);
      stopLoader('uploadVideo');
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2:
          err.message || 'Failed to update bowser quantity. Please try again.',
      });
    }
  };

  const handleQuantityProceed = async (quantity: number) => {
    const currentTask = orderStore.getState().currentDriverOrder;
    if (currentTask?.is_enable_buddycan_flow) {
      await handleQuantityProceedBuddyCan(quantity);
    } else if (currentTask?.is_done_locally) {
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

  // Main streaming interface
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <CardElevated cardStyle={styles.orderDetailsCard}>
          <View style={styles.orderDetailsHeader}>
            <Text weight="bold" size="lg" color="primary">
              Order Details
            </Text>
          </View>

          <View style={styles.orderDetailsRow}>
            <Text weight="600" size="sm" color="neutral">
              Customer Name:
            </Text>
            <Text weight="400" size="sm" style={styles.orderValue as any}>
              {`${
                currentDriverOrder?.customer_order?.organization_user?.user
                  ?.first_name || ''
              } ${
                currentDriverOrder?.customer_order?.organization_user?.user
                  ?.last_name || ''
              }`.trim() || 'N/A'}
            </Text>
          </View>

          <View style={styles.orderDetailsRow}>
            <Text weight="600" size="sm" color="neutral">
              Order Code:
            </Text>
            <Text weight="400" size="sm" style={styles.orderValue as any}>
              {currentDriverOrder?.customer_order?.order_code || 'N/A'}
            </Text>
          </View>
        </CardElevated>
      </View>

      {/* Camera Section */}
      {(isStreaming || (!isStreaming && !isStreamUploaded)) && (
        <View style={styles.cameraSection}>
          <View style={styles.cameraContainer}>
            {localStream ? (
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.camera}
                objectFit="cover"
                mirror={false}
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.placeholderText as any}>
                  Camera preview will appear here
                </Text>
              </View>
            )}

            <CameraOverlay
              isRecording={isStreaming}
              isPaused={false}
              recordingDuration={recordingDuration}
              canStopStream={canStopStream}
              streamingDurationSeconds={streamingDurationSeconds}
            />
          </View>
        </View>
      )}

      {/* Success message when stream is complete */}
      {!isStreaming && isStreamUploaded && (
        <View style={styles.cameraSection}>
          <CardElevated cardStyle={styles.successCard}>
            <View style={styles.successContent}>
              <Text weight="bold" size="lg" color="primary">
                ✓ Stream Recorded Successfully
              </Text>
              <Text size="sm" style={styles.successMessage as any}>
                Your stream has been recorded and saved. You can now proceed to
                the next step.
              </Text>
            </View>
          </CardElevated>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText as any}>{error}</Text>
        </View>
      )}

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        <StreamControls
          isRecording={isStreaming}
          isPaused={false}
          isLoading={isLoading}
          canStopStream={canStopStream}
          hasStreamedOnce={hasStreamedOnce}
          streamingState={streamingState}
          isStreamUploaded={isStreamUploaded}
          onStartRecording={startStream}
          onPauseRecording={() => {}}
          onResumeRecording={() => {}}
          onStopRecording={stopStream}
          onNext={goNext}
          isStartingRecording={isStartingStream}
          isPausingRecording={false}
          isResumingRecording={false}
          isStoppingRecording={isStoppingStream}
        />
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

      {/* FullScreen Loader */}
      <FullScreenLoader
        showLoader={loaders.uploadVideo}
        loaderText="Processing stream..."
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
  cameraSection: {
    flex: 1,
    minHeight: 300,
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
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  controlsSection: {
    paddingVertical: 12,
    backgroundColor: FBColors.white,
  },
  successCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: FBBackground.white,
  },
  successContent: {
    alignItems: 'center',
  },
  successMessage: {
    marginTop: 8,
    textAlign: 'center',
    color: FBColors.neutral,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
});

export default LiveStreamScreen;
