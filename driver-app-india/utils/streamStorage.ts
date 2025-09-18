/**
 * @module StreamStorage
 * @description Utilities for persisting live stream state across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreamState {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  streamingState: 'not_started' | 'started' | 'paused' | 'stopped';
  hasStreamedOnce: boolean;
  taskId: string | null;
  assetId: string | null;
  timestamp: number;
}

const STREAM_STATE_KEY = 'live_stream_state';
const STATE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save stream state to AsyncStorage
 */
export const saveStreamState = async (state: Partial<StreamState>): Promise<void> => {
  try {
    const currentState = await getStreamState();
    const newState: StreamState = {
      ...currentState,
      ...state,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(STREAM_STATE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Failed to save stream state:', error);
  }
};

/**
 * Get stream state from AsyncStorage
 */
export const getStreamState = async (): Promise<StreamState> => {
  try {
    const stateStr = await AsyncStorage.getItem(STREAM_STATE_KEY);

    if (!stateStr) {
      return getDefaultStreamState();
    }

    const state: StreamState = JSON.parse(stateStr);

    // Check if state is expired
    if (Date.now() - state.timestamp > STATE_EXPIRY_TIME) {
      await clearStreamState();
      return getDefaultStreamState();
    }

    return state;
  } catch (error) {
    console.error('Failed to get stream state:', error);
    return getDefaultStreamState();
  }
};

/**
 * Clear stream state from AsyncStorage
 */
export const clearStreamState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STREAM_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear stream state:', error);
  }
};

/**
 * Get default stream state
 */
const getDefaultStreamState = (): StreamState => ({
  isRecording: false,
  isPaused: false,
  recordingDuration: 0,
  streamingState: 'not_started',
  hasStreamedOnce: false,
  taskId: null,
  assetId: null,
  timestamp: Date.now(),
});

/**
 * Check if there's a valid paused stream for the given task and asset
 */
export const hasPausedStreamForTask = async (
  taskId: string,
  assetId: string
): Promise<boolean> => {
  try {
    const state = await getStreamState();
    return (
      state.streamingState === 'paused' &&
      state.taskId === taskId &&
      state.assetId === assetId &&
      Date.now() - state.timestamp <= STATE_EXPIRY_TIME
    );
  } catch (error) {
    console.error('Failed to check paused stream:', error);
    return false;
  }
};