import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { RTCView } from 'react-native-webrtc';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import { ScaledSheet } from 'react-native-size-matters';
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
import { checkinStore, orderStore } from '@/globalStore';

// Services
import orderService from '../services';
import supportService from '@/modules/support/services';
import {
  Device,
  mediaDevices,
  setupMediasoupForReactNative,
} from '../services/mediasoupSetup';

// Types
import { FBColors, FBBackground } from '@/types/styles';
import { OrderStackParamList } from '@/navigator/containers/Order';
import { getCurrentLocation } from '@/utils/location';
import {
  saveStreamState,
  getStreamState,
  clearStreamState,
  hasPausedStreamForTask,
  saveAssetWithUploadedVideo,
} from '@/utils/streamStorage';

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
  const [mode, setMode] = useState<'live' | 'record' | null>('live'); // Auto-set to live streaming (no selection)
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
  const [showCamera, setShowCamera] = useState(true);

  // Individual button loading states
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isPausingRecording, setIsPausingRecording] = useState(false);
  const [isResumingRecording, setIsResumingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  // WebRTC/Mediasoup state for live streaming
  const deviceRef = useRef<any>(null);
  const sendTransportRef = useRef<any>(null);
  const producersRef = useRef<any[]>([]);
  const liveStreamRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsOpenRef = useRef(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // MediaRecorder for recording WebRTC stream
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<any[]>([]);

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

  // Minimum streaming duration set to 5 minutes for all users
  // const streamingDurationSeconds = 300; // 5 minutes (300 seconds)
  const streamingDurationSeconds = 10; //10 seconds

  const WS_URL = 'wss://soup.fuelbuddy.in';

  type SoupMessage =
    | { type: 'join-room'; isViewer: boolean }
    | { type: 'leave-room' }
    | { type: 'get-rtp-capabilities' }
    | { type: 'create-send-transport' }
    | { type: 'create-recv-transport' }
    | { type: 'connect-transport'; transportId: string; dtlsParameters: any }
    | {
      type: 'produce';
      transportId: string;
      kind: 'audio' | 'video';
      rtpParameters: any;
    }
    | {
      type: 'consume';
      transportId: string;
      producerId: string;
      rtpCapabilities: any;
    }
    | { type: 'resume-consumer'; consumerId: string }
    | { type: 'ping' }
    | { type: string;[k: string]: any }; // generic

  // Build the same roomId as Vue: `${orderCode}-${driverVehicleId}-${assetId}`
  const roomId = React.useMemo(() => {
    const orderCode =
      orderStore.getState().currentDriverOrder?.customer_order?.order_code;
    const driverVehicleId =
      orderStore.getState().currentDriverOrder?.driver_vehicle_id;
    const assetId = orderStore.getState().currentAssetForDispense?.id;
    return orderCode && driverVehicleId && assetId
      ? `${orderCode}-${driverVehicleId}-${assetId}`
      : '';
  }, [
    orderStore.getState().currentDriverOrder?.id,
    orderStore.getState().currentAssetForDispense?.id,
  ]);

  // Send JSON with the same envelope that Vue adds (roomId + isViewer)
  const sendToSoup = React.useCallback(
    (msg: SoupMessage, isViewer = false, explicitRoomId?: string) => {
      if (wsRef.current && wsOpenRef.current) {
        const payload = JSON.stringify({
          ...msg,
          roomId: explicitRoomId || roomId,
          isViewer,
        });
        wsRef.current!.send(payload);
      }
    },
    [roomId],
  );

  const connectSoup = (): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        if (wsRef.current && wsOpenRef.current) {
          return resolve();
        }
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          wsOpenRef.current = true;
          console.log('[WebRTC] WebSocket connected');
          // optional keepalive/ping
          if (!pingIntervalRef.current) {
            pingIntervalRef.current = setInterval(() => {
              sendToSoup({ type: 'ping' });
            }, 15000);
          }
          resolve();
        };

        ws.onerror = e => {
          console.log('[WebRTC] ws error', e);
          reject(new Error('WebSocket error'));
        };

        ws.onclose = () => {
          console.log('[WebRTC] WebSocket closed');
          wsOpenRef.current = false;
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
        };

        ws.onmessage = async evt => {
          try {
            const data = JSON.parse(evt.data);
            console.log('[WebRTC] received:', data);

            // Step 1: After joining room, request RTP capabilities
            if (data.type === 'room-joined') {
              console.log('[WebRTC] Room joined, requesting RTP capabilities');
              sendToSoup({ type: 'get-rtp-capabilities' });
            }

            // Step 2: When server sends RTP caps, create Device and request send transport
            if (data.type === 'rtp-capabilities') {
              console.log('[WebRTC] Got RTP caps, creating Device');

              try {
                // Setup mediasoup to use react-native-webrtc
                setupMediasoupForReactNative();

                // Create and load Device
                deviceRef.current = new Device();
                await deviceRef.current.load({
                  routerRtpCapabilities: data.rtpCapabilities,
                });

                console.log(
                  '[WebRTC] Device loaded, requesting send transport',
                );
                sendToSoup({ type: 'create-send-transport' });
              } catch (err: any) {
                console.error('[WebRTC] Device load error:', err);
                Toast.show({
                  type: 'error',
                  text1: 'Device Setup Failed',
                  text2: err.message || 'Could not initialize streaming',
                });
              }
            }

            // Step 3: When transport created, set up transport and produce media
            if (
              data.type === 'transport-created' &&
              data.direction === 'send'
            ) {
              console.log(
                '[WebRTC] Send transport created',
                data.transportOptions,
              );

              try {
                // Create send transport
                sendTransportRef.current =
                  deviceRef.current.createSendTransport(data.transportOptions);

                // Handle connect event
                sendTransportRef.current.on(
                  'connect',
                  async ({ dtlsParameters }: any, callback: any) => {
                    console.log('[WebRTC] Transport connecting...');
                    sendToSoup({
                      type: 'connect-transport',
                      transportId: sendTransportRef.current.id,
                      dtlsParameters,
                    });
                    callback();
                  },
                );

                // Handle produce event
                sendTransportRef.current.on(
                  'produce',
                  async ({ kind, rtpParameters }: any, callback: any) => {
                    console.log(`[WebRTC] Producing ${kind} track`);
                    sendToSoup({
                      type: 'produce',
                      transportId: sendTransportRef.current.id,
                      kind,
                      rtpParameters,
                    });
                    callback({ id: `${kind}-${Date.now()}` });
                  },
                );

                // Get camera and microphone stream for WebRTC
                console.log(
                  '[WebRTC] Getting media stream for live streaming...',
                );
                const stream = await mediaDevices.getUserMedia({
                  video: {
                    width: 640,
                    height: 480,
                    frameRate: 15,
                    facingMode: 'environment', // Back camera
                  },
                  audio: true,
                });

                liveStreamRef.current = stream;
                mediaStreamRef.current = stream;
                console.log('[WebRTC] Got media stream, producing tracks...');

                // Produce video track
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                  const videoProducer = await sendTransportRef.current.produce({
                    track: videoTrack,
                    encodings: [{ maxBitrate: 2000000 }],
                  });
                  producersRef.current.push(videoProducer);
                  console.log('[WebRTC] ✅ Video producer created');
                }

                // Produce audio track
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                  const audioProducer = await sendTransportRef.current.produce({
                    track: audioTrack,
                  });
                  producersRef.current.push(audioProducer);
                  console.log('[WebRTC] ✅ Audio producer created');
                }

                console.log(
                  '[WebRTC] 🎉 Live streaming ACTIVE - dashboard should see video now!',
                );

                // Request server-side recording
                console.log('[RECORDING] Requesting server to start recording...');
                sendToSoup({ type: 'start-recording', roomId });

                Toast.show({
                  type: 'success',
                  text1: 'Live Streaming Active!',
                  text2: 'Video is now streaming to dashboard',
                });
              } catch (err: any) {
                console.error('[WebRTC] Error producing media:', err);
                Toast.show({
                  type: 'error',
                  text1: 'Live Streaming Failed',
                  text2: err.message || 'Could not start video stream',
                });
              }
            }

            // Handle server recording completion
            if (data.type === 'recording-complete') {
              console.log('[RECORDING] Server recording complete:', data);
              try {
                const storeUrl = data.videoUrl || data.storeUrl;
                const fileName = `Order_Code_${currentDriverOrder?.customer_order?.order_code || Date.now()}.webm`;

                if (storeUrl) {
                  console.log('[RECORDING] Uploading video URL to database:', storeUrl);

                  // Save to database using upsertStepTaskAction
                  await orderService.upsertStepTaskAction({
                    object: {
                      key: 'LIVE_STREAM_RECORDING',
                      url: storeUrl,
                      value: fileName,
                      quantity_dispensed: 0,
                      task_id: currentDriverOrder?.id,
                      customer_asset_id: currentAssetForDispense?.id,
                    },
                  });

                  setIsStreamUploaded(true);
                  console.log('[RECORDING] ✅ Recording URL saved to database');

                  Toast.show({
                    type: 'success',
                    text1: 'Recording Saved',
                    text2: 'Video uploaded successfully!',
                  });
                } else {
                  console.warn('[RECORDING] No video URL in recording-complete event');
                }
              } catch (err: any) {
                console.error('[RECORDING] Error saving recording:', err);
                Toast.show({
                  type: 'error',
                  text1: 'Recording Save Failed',
                  text2: err.message || 'Could not save recording',
                });
              }
            }

            // Handle recording errors
            if (data.type === 'recording-error') {
              console.error('[RECORDING] Server recording error:', data.error);
              Toast.show({
                type: 'error',
                text1: 'Recording Failed',
                text2: data.error || 'Server could not record stream',
              });
            }
          } catch (err) {
            console.log('[WebRTC] bad json', err);
          }
        };
      } catch (err) {
        reject(err);
      }
    });

  const disconnectSoup = () => {
    try {
      if (wsRef.current && wsOpenRef.current) {
        try {
          sendToSoup({ type: 'leave-room' });
        } catch { }
        wsRef.current?.close();
      }
    } finally {
      wsRef.current = null;
      wsOpenRef.current = false;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    }
  };

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
    // For record mode, we need cameraRef. For live mode, we don't
    if (mode === 'record' && !cameraRef.current) return;
    if (isRecording) return;

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

      // Show camera when starting new recording
      setShowCamera(true);

      // Always reset timer states when starting new recording
      console.log(`[${mode?.toUpperCase()}] Starting - resetting timer states`);
      setRecordingDuration(0);
      setCanStopStream(false);

      const orderCode =
        orderStore.getState().currentDriverOrder?.customer_order?.order_code;
      const driverVehicleId =
        orderStore.getState().currentDriverOrder?.driver_vehicle_id;
      const assetId = orderStore.getState().currentAssetForDispense?.id;

      const roomIdLocal =
        orderCode && driverVehicleId && assetId
          ? `${orderCode}-${driverVehicleId}-${assetId}`
          : '';

      if (!roomIdLocal) {
        throw new Error(
          'Room ID not ready yet. Please wait a second and try again.',
        );
      }
      console.log('[WebRTC] roomIdLocal =', roomIdLocal);

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

      // Set recording state IMMEDIATELY
      setIsRecording(true);

      if (mode === 'record') {
        // RECORD MODE: Use RNCamera for recording
        console.log('[RECORD] Starting RNCamera recording...');
        const recordOptions = {
          quality: RNCamera.Constants.VideoQuality['720p'],
          videoBitrate: 800000,
          audioBitrate: 64000,
        };

        Toast.show({
          type: 'success',
          text1: 'Recording Started',
          text2: 'Video recording active',
        });

        const recordPromise = cameraRef.current!.recordAsync(recordOptions);

        recordPromise.then(handleRecordingFinished).catch(error => {
          console.error('[RECORD] Recording error:', error);
          Toast.show({
            type: 'error',
            text1: 'Recording Error',
            text2: 'An error occurred while recording',
          });
        });
      } else if (mode === 'live') {
        // LIVE MODE: Use WebRTC for live streaming
        console.log('[LIVE] Starting WebRTC live stream...');

        Toast.show({
          type: 'success',
          text1: 'Live Streaming Started',
          text2: 'Connecting to dashboard...',
        });

        // Get media stream for live streaming
        const { mediaDevices } = require('../services/mediasoupSetup');

        try {
          const stream = await mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          });

          mediaStreamRef.current = stream;
          liveStreamRef.current = stream;

          // Connect to WebSocket and start streaming
          connectSoup()
            .then(() => {
              if (!roomIdLocal) {
                console.log('[LIVE] No roomId; skipping signals');
                return;
              }
              sendToSoup(
                { type: 'join-room', isViewer: false } as any,
                false,
                roomIdLocal,
              );
            })
            .catch(err => {
              console.warn('[LIVE] connectSoup failed:', err);
              Toast.show({
                type: 'error',
                text1: 'Connection Failed',
                text2: 'Unable to connect to dashboard',
              });
            });
        } catch (err) {
          console.error('[LIVE] getUserMedia failed:', err);
          Toast.show({
            type: 'error',
            text1: 'Camera Access Failed',
            text2: 'Unable to access camera for live streaming',
          });
          setIsRecording(false);
        }
      }
    } catch (error) {
      console.error('Start recording error:', error);
      setIsRecording(false);
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

      // Update stream status via API
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

      // Update stream status via API
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
    // For record mode, we need cameraRef. For live mode, we don't
    if (mode === 'record' && !cameraRef.current) return;
    if (!isRecording && !isPaused) return;

    // Prevent stopping if minimum duration not reached
    if (!canStopStream) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Stop Recording',
        text2: `Please record for at least ${streamingDurationSeconds / 60
          } minutes before stopping`,
      });
      return;
    }

    try {
      setIsStoppingRecording(true);
      setStreamingState('stopped');

      // Update stream status via API
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

      // Request server to stop recording and upload
      console.log('[RECORDING] Requesting server to stop recording...');
      sendToSoup({ type: 'stop-recording', roomId });

      // Stop camera recording if in record mode (legacy code)
      if (mode === 'record' && cameraRef.current && (isRecording || isPaused)) {
        cameraRef.current.stopRecording();
      }

      // Stop WebRTC live streaming
      try {
        console.log('[WebRTC] Stopping live stream...');
        producersRef.current.forEach((producer: any) => {
          try {
            producer.close();
          } catch (err) {
            console.error('[WebRTC] Error closing producer:', err);
          }
        });
        producersRef.current = [];

        if (sendTransportRef.current) {
          try {
            sendTransportRef.current.close();
          } catch (err) {
            console.error('[WebRTC] Error closing transport:', err);
          }
          sendTransportRef.current = null;
        }

        if (liveStreamRef.current) {
          liveStreamRef.current.getTracks().forEach((track: any) => {
            try {
              track.stop();
            } catch (err) {
              console.error('[WebRTC] Error stopping track:', err);
            }
          });
          liveStreamRef.current = null;
        }

        deviceRef.current = null;

        if (wsRef.current && wsOpenRef.current) {
          sendToSoup({ type: 'leave-room' });
        }

        console.log('[WebRTC] ✅ Live stream stopped');
      } finally {
        disconnectSoup();
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

      // Remove from interrupted recording array
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

      // For live mode, mark as completed without video upload
      if (mode === 'live') {
        setIsStreamUploaded(true);
        setIsStoppingRecording(false);

        Toast.show({
          type: 'success',
          text1: 'Live Stream Stopped',
          text2: 'You can now proceed to the next step',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Recording Stopped',
          text2: 'Processing video... Please wait',
        });
      }

      // Hide camera after recording is stopped
      setShowCamera(false);
    } catch (error) {
      console.error('Stop recording error:', error);
      Toast.show({
        type: 'error',
        text1: 'Stop Failed',
        text2: 'Unable to stop recording properly',
      });
      setIsStoppingRecording(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSoup();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: any) => {
          track.stop();
        });
      }
    };
  }, []);

  // Check storage permissions for Android
  const checkStoragePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const androidVersion = Platform.Version as number;

      if (androidVersion >= 29) {
        return true;
      }

      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      const hasPermission = await PermissionsAndroid.check(permission);

      if (hasPermission) {
        return true;
      }

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
      const documentsPath = RNFS.DocumentDirectoryPath;
      const videoPath = `${documentsPath}/${fileName}`;

      await RNFS.copyFile(sourceUri, videoPath);
      console.log(`[Camera] Video saved locally at: ${videoPath}`);

      let externalPath = null;
      let savedToDownloads = false;

      if (Platform.OS === 'android') {
        try {
          const hasStoragePermission = await checkStoragePermissions();

          if (hasStoragePermission) {
            const downloadsPath = RNFS.DownloadDirectoryPath;
            externalPath = `${downloadsPath}/${fileName}`;
            await RNFS.copyFile(sourceUri, externalPath);
            savedToDownloads = true;
            console.log(
              `[Camera] Video also saved to Downloads: ${externalPath}`,
            );
          } else {
            console.log(
              '[Camera] Storage permission denied - video saved to app folder only',
            );
          }
        } catch (externalError) {
          console.warn(
            '[Camera] Failed to save to Downloads folder:',
            externalError,
          );
        }
      }

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
      console.error('[Camera] Failed to save video locally:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Unable to save video to device',
        visibilityTime: 4000,
      });
      return null;
    }
  };

  const getVideoFormat = (uri: string, codec?: string) => {
    if (uri?.toLowerCase().endsWith('.mp4')) return 'mp4';
    if (uri?.toLowerCase().endsWith('.mov')) return 'mp4';
    if (codec && /mp4|h264|avc|aac/i.test(codec)) return 'mp4';
    return 'mp4';
  };

  const handleRecordingFinished = async (data: any) => {
    try {
      startLoader('uploadVideo');

      const videoFormat = getVideoFormat(data.uri, data.codec);
      const contentType = `video/${videoFormat}`;
      const fileName = `Recording_${currentDriverOrder?.customer_order?.order_code}.${videoFormat}`;

      let uploadedUrl = data.uri || '';
      let uploadSuccess = false;
      let localVideoPath: string | null = null;

      // Always save video locally first
      localVideoPath = await saveVideoToDevice(data.uri, fileName);
      if (localVideoPath) {
        setRecordedVideoFile(localVideoPath);
      }

      try {
        const filePath = data.uri.replace('file://', '');
        const fileStats = await RNFS.stat(filePath);
        console.log(
          `[Camera] Video size: ${(fileStats.size / 1024 / 1024).toFixed(
            2,
          )} MB`,
        );
        console.log(`[Camera] Uploading video from: ${filePath}`);

        const uploadResult = await supportService.uploadVideoFile({
          fileName: fileName,
          contentType: contentType,
          fileData: { uri: data.uri, path: filePath },
        });

        if (uploadResult.storeUrl) {
          uploadedUrl = uploadResult.storeUrl;
          uploadSuccess = true;
          setIsStreamUploaded(true);
          setUploadError(false);
        }
        setShowCamera(false);
      } catch (uploadError) {
        console.warn(
          '[Camera] Cloud upload failed, video saved locally:',
          uploadError,
        );
        setUploadError(true);
        uploadSuccess = false;
      }

      // Save the task action with uploaded video URL or local URI
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
      console.error('[Camera] Process recording error:', error);
      setIsStreamUploaded(false);
      setUploadError(true);
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: 'Failed to save recording. Please try again.',
      });
    } finally {
      stopLoader('uploadVideo');
      setIsStoppingRecording(false);
      console.log('✅ Upload process completed - buttons re-enabled');
    }
  };

  const goNext = () => {
    const canProceed =
      (!isRecording && hasStreamedOnce && streamingState === 'stopped') ||
      (!isRecording && hasStreamedOnce && isStreamUploaded);

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

    // Show quantity bottom sheet
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

    const fileExists = await RNFS.exists(recordedVideoFile);

    Alert.alert(
      'Video File Location',
      `File Path: ${recordedVideoFile}\n\nFile Exists: ${fileExists ? 'Yes' : 'No'
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
            console.log('File path:', recordedVideoFile);
          },
        },
        { text: 'OK' },
      ],
    );
  };

  const uploadVideoFromDevice = async () => {
    try {
      setIsUploadingFromDevice(true);

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const selectedFile = result[0];

        const maxSizeInBytes = 100 * 1024 * 1024;
        if (selectedFile.size && selectedFile.size > maxSizeInBytes) {
          Toast.show({
            type: 'error',
            text1: 'File Too Large',
            text2: 'Please select a video file smaller than 100MB',
          });
          return;
        }

        if (!selectedFile.type?.includes('video/')) {
          Toast.show({
            type: 'error',
            text1: 'Invalid File Type',
            text2: 'Please select a valid video file',
          });
          return;
        }

        Alert.alert(
          'Upload Video',
          `Are you sure you want to upload this video?\n\nFile: ${selectedFile.name
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

      const detectedFormat = selectedFile.type?.includes('webm')
        ? 'webm'
        : selectedFile.type?.includes('mp4')
          ? 'mp4'
          : selectedFile.name?.toLowerCase().includes('.webm')
            ? 'webm'
            : 'mp4';
      const contentType = selectedFile.type || `video/${detectedFormat}`;
      const fileName = `Upload_${currentDriverOrder?.customer_order?.order_code
        }_${Date.now()}.${detectedFormat}`;

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

      const uploadResult = await supportService.uploadVideoFile({
        fileName: fileName,
        contentType: contentType,
        fileData: fileData,
      });

      if (uploadResult.storeUrl) {
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

        const currentAssetId = currentAssetForDispense?.id;
        if (currentAssetId) {
          addAssetWithUploadedVideo(currentAssetId);
        }

        setHasStreamedOnce(true);
        setStreamingState('stopped');
        setIsStreamUploaded(true);
        setUploadError(false);
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

      const detectedFormat = recordedVideoFile.toLowerCase().includes('.webm')
        ? 'webm'
        : 'mp4';
      const contentType = `video/${detectedFormat}`;
      const fileName = `Recording_${currentDriverOrder?.customer_order?.order_code}.${detectedFormat}`;

      const fileData = {
        uri: recordedVideoFile,
        type: contentType,
        name: fileName,
      };

      const uploadResult = await supportService.uploadVideoFile({
        fileName: fileName,
        contentType: contentType,
        fileData: fileData,
      });

      if (uploadResult.storeUrl) {
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

      if (!currentDriverOrder?.id || !currentAssetId) {
        throw new Error('Missing required order or asset data');
      }

      const coordinates = await getCurrentLocation();

      const taskActionResponse = await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: '',
          value: '0.0',
          quantity_dispensed: quantity,
          task_id: currentDriverOrder?.id,
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
        customerOrderId: currentDriverOrder?.customer_order?.id,
        qty: quantity,
      });

      if (currentDriverOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          id: currentDriverOrder.id,
        });
      }

      const updatedAssets = orderStore
        .getState()
        .orderAssets?.map((asset: any) => {
          const assetId =
            asset.customer_asset?.id || asset.id || asset.customer_asset_id;
          if (assetId === currentAssetId) {
            return { ...asset, quantity_dispensed: quantity };
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
    } catch (error) {
      console.error('Error in handleQuantityProceedBuddyCan:', error);
      stopLoader('uploadVideo');
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Failed to update quantity. Please try again.',
      });
    }
  };

  const handleQuantityProceedBowser = async (quantity: number) => {
    try {
      startLoader('uploadVideo');

      const currentAssetId = orderStore.getState().currentAssetForDispense?.id;
      const driverVehicleId = currentDriverOrder?.driver_vehicle_id;

      if (!currentDriverOrder?.id || (!currentAssetId && !driverVehicleId)) {
        throw new Error('Missing required order or vehicle data for bowser');
      }

      const coordinates = await getCurrentLocation();

      const taskActionResponse = await orderService.upsertStepTaskAction({
        object: {
          key: 'TOTALIZER_AFTER_READING',
          url: '',
          value: '0.0',
          quantity_dispensed: quantity,
          task_id: currentDriverOrder?.id,
          ...(orderStore.getState().currentDriverOrder?.category === 'DELIVERY'
            ? { customer_asset_id: `${currentAssetId}` }
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

      if (orderStore.getState().currentDriverOrder?.category === 'DELIVERY') {
        await orderService.updateAssetQty({
          customerAssetId: currentAssetId,
          customerOrderId: currentDriverOrder?.customer_order?.id,
          qty: quantity,
        });
      }

      if (currentDriverOrder?.state === 'ARRIVED') {
        await orderService.markOrderDispensing({
          id: currentDriverOrder.id,
        });
      }

      const updatedAssets = orderStore
        .getState()
        .orderAssets?.map((asset: any) => {
          const assetId =
            asset.customer_asset?.id || asset.id || asset.customer_asset_id;
          if (assetId === currentAssetId) {
            return { ...asset, quantity_dispensed: quantity };
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
    } catch (error) {
      console.error('Error in handleQuantityProceedBowser:', error);
      stopLoader('uploadVideo');
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Failed to update bowser quantity. Please try again.',
      });
    }
  };

  const handleQuantityProceed = async (quantity: number) => {
    if (orderStore.getState().currentDriverOrder?.is_enable_buddycan_flow) {
      await handleQuantityProceedBuddyCan(quantity);
    } else if (orderStore.getState().currentDriverOrder?.is_done_locally) {
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

  // Main interface
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
              {`${currentDriverOrder?.customer_order?.organization_user?.user
                ?.first_name || ''
                } ${currentDriverOrder?.customer_order?.organization_user?.user
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



      {/* Video Section - Shows AFTER mode selection */}
      {mode && (
        <View style={styles.cameraSection}>
          <View style={styles.cameraContainer}>
            {/* Live Streaming Mode - Show RTCView */}
            {mode === 'live' &&
              mediaStreamRef.current &&
              isRecording &&
              !isPaused && (
                <RTCView
                  streamURL={mediaStreamRef.current.toURL()}
                  style={styles.camera}
                  objectFit="cover"
                  mirror={false}
                />
              )}

            {/* Recording Mode - Show RNCamera */}
            {mode === 'record' && (
              <RNCamera
                ref={cameraRef}
                style={styles.camera}
                type={RNCamera.Constants.Type.back}
                flashMode={RNCamera.Constants.FlashMode.off}
                captureAudio={true}
                androidCameraPermissionOptions={{
                  title: 'Camera Permission',
                  message: 'We need camera access for recording',
                  buttonPositive: 'Ok',
                  buttonNegative: 'Cancel',
                }}
                androidRecordAudioPermissionOptions={{
                  title: 'Audio Permission',
                  message: 'We need microphone access for recording',
                  buttonPositive: 'Ok',
                  buttonNegative: 'Cancel',
                }}
              />
            )}

            {/* Upload from device overlay */}
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
                      {isUploadingFromDevice
                        ? 'Uploading...'
                        : '📁 Upload Video'}
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
      )}

      {/* Success message when recording is done */}
      {!showCamera && isStreamUploaded && (
        <View style={styles.successCard}>
          <View style={styles.successContent}>
            <Text weight="bold" size="lg" color="primary">
              ✓ Video Uploaded Successfully
            </Text>
            <Text size="sm" style={styles.successMessage as any}>
              Your video has been uploaded. You can now proceed to the next
              step.
            </Text>
          </View>
        </View>
      )}

      {/* Controls Section */}
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
          isStartingRecording={isStartingRecording}
          isPausingRecording={isPausingRecording}
          isResumingRecording={isResumingRecording}
          isStoppingRecording={isStoppingRecording}
        />

        {/* Upload Error Section */}
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

      {/* FullScreen Loaders */}
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
  // HIDDEN camera for background recording only
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -1000, // Move it off-screen
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
  controlsSection: {
    paddingVertical: 12,
    backgroundColor: FBColors.white,
  },
  uploadErrorCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  uploadErrorContent: {
    alignItems: 'center',
  },
  uploadErrorTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#92400E',
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
  // Mode selection styles
  modeSelectionSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modeSelectionCard: {
    padding: 20,
    backgroundColor: FBBackground.white,
  },
  modeTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: FBColors.primary,
  },
  modeSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: FBColors.neutral,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FBColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeIcon: {
    fontSize: 30,
  },
  modeContent: {
    flex: 1,
  },
  modeDescription: {
    marginTop: 4,
    color: FBColors.neutral,
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
});

export default LiveStreamScreen;
