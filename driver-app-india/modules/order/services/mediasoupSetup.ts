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
} from 'react-native-webrtc';

// Import and load WebRTC polyfills BEFORE importing Device
import {loadWebRTC} from 'mediasoup-client';

// Load WebRTC polyfills first
loadWebRTC();

// Inject WebRTC classes into global scope BEFORE importing Device
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
  global.navigator = global.navigator || {};
  // @ts-ignore
  global.navigator.mediaDevices = mediaDevices;
  // @ts-ignore
  global.navigator.userAgent = 'Chrome';
  // @ts-ignore
  global.window = global.window || {};
  // @ts-ignore
  global.window.navigator = global.navigator;
  // @ts-ignore
  global.document = global.document || {};
}

// Import Device AFTER setting up globals
import {Device} from 'mediasoup-client';

export function setupMediasoupForReactNative() {
  // Already set up globally above
  console.log('[mediasoup] Global WebRTC polyfills loaded');
}

export {Device, mediaDevices};
