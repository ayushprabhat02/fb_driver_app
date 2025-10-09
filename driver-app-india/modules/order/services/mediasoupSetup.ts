/**
 * Mediasoup Client Setup for React Native
 *
 * Configures mediasoup-client to work with react-native-webrtc
 */

import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  mediaDevices,
  RTCRtpSender,
  RTCRtpTransceiver,
  RTCRtpReceiver,
} from 'react-native-webrtc';

// Setup globals first
// @ts-ignore
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.RTCPeerConnection = RTCPeerConnection;
  // @ts-ignore
  global.RTCSessionDescription = RTCSessionDescription;
  // @ts-ignore
  global.RTCIceCandidate = RTCIceCandidate;
  // @ts-ignore
  global.MediaStream = MediaStream;
  // @ts-ignore
  global.RTCRtpSender = RTCRtpSender;
  // @ts-ignore
  global.RTCRtpReceiver = RTCRtpReceiver;
  // @ts-ignore
  global.RTCRtpTransceiver = RTCRtpTransceiver;
  // @ts-ignore
  global.navigator = global.navigator || {};
  // @ts-ignore
  global.navigator.mediaDevices = mediaDevices;
  // @ts-ignore
  global.navigator.product = 'ReactNative';
  // @ts-ignore
  global.navigator.userAgent = 'ReactNative';
  // @ts-ignore
  global.window = global.window || {};
  // @ts-ignore
  global.window.navigator = global.navigator;
  // @ts-ignore
  global.document = global.document || {};
}

// Now import Device after globals are set up
import { Device } from 'mediasoup-client';

export function setupMediasoupForReactNative() {
  // Already set up globally above
  console.log('[mediasoup] Global WebRTC polyfills loaded');
  // @ts-ignore
  console.log('[mediasoup] navigator.product:', global.navigator.product);
  // @ts-ignore
  console.log('[mediasoup] RTCPeerConnection available:', typeof global.RTCPeerConnection !== 'undefined');
  // @ts-ignore
  console.log('[mediasoup] RTCRtpTransceiver available:', typeof global.RTCRtpTransceiver !== 'undefined');
}

// Export the Device class and mediaDevices
export { Device, mediaDevices };