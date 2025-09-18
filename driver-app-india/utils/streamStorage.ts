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
const ASSETS_WITH_VIDEOS_KEY = 'assets_with_uploaded_videos';
const STATE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

interface AssetVideoState {
  taskId: string;
  assetId: string;
  timestamp: number;
}

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

/**
 * Save asset with uploaded video state
 */
export const saveAssetWithUploadedVideo = async (
  taskId: string,
  assetId: string
): Promise<void> => {
  try {
    const existingAssets = await getAssetsWithUploadedVideos();
    const newAsset: AssetVideoState = {
      taskId,
      assetId,
      timestamp: Date.now(),
    };
    
    // Remove existing entry for this asset if it exists
    const filteredAssets = existingAssets.filter(
      asset => !(asset.taskId === taskId && asset.assetId === assetId)
    );
    
    // Add the new entry
    const updatedAssets = [...filteredAssets, newAsset];
    
    await AsyncStorage.setItem(ASSETS_WITH_VIDEOS_KEY, JSON.stringify(updatedAssets));
  } catch (error) {
    console.error('Failed to save asset with uploaded video:', error);
  }
};

/**
 * Get all assets with uploaded videos
 */
export const getAssetsWithUploadedVideos = async (): Promise<AssetVideoState[]> => {
  try {
    const assetsStr = await AsyncStorage.getItem(ASSETS_WITH_VIDEOS_KEY);
    
    if (!assetsStr) {
      return [];
    }
    
    const assets: AssetVideoState[] = JSON.parse(assetsStr);
    
    // Filter out expired entries
    const validAssets = assets.filter(
      asset => Date.now() - asset.timestamp <= STATE_EXPIRY_TIME
    );
    
    // Save back the filtered list if any were removed
    if (validAssets.length !== assets.length) {
      await AsyncStorage.setItem(ASSETS_WITH_VIDEOS_KEY, JSON.stringify(validAssets));
    }
    
    return validAssets;
  } catch (error) {
    console.error('Failed to get assets with uploaded videos:', error);
    return [];
  }
};

/**
 * Remove asset from uploaded videos list
 */
export const removeAssetWithUploadedVideo = async (
  taskId: string,
  assetId: string
): Promise<void> => {
  try {
    const existingAssets = await getAssetsWithUploadedVideos();
    const filteredAssets = existingAssets.filter(
      asset => !(asset.taskId === taskId && asset.assetId === assetId)
    );
    
    await AsyncStorage.setItem(ASSETS_WITH_VIDEOS_KEY, JSON.stringify(filteredAssets));
  } catch (error) {
    console.error('Failed to remove asset with uploaded video:', error);
  }
};

/**
 * Clear all assets with uploaded videos
 */
export const clearAssetsWithUploadedVideos = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ASSETS_WITH_VIDEOS_KEY);
  } catch (error) {
    console.error('Failed to clear assets with uploaded videos:', error);
  }
};

/**
 * Get asset IDs with uploaded videos for a specific task
 */
export const getAssetIdsWithUploadedVideosForTask = async (
  taskId: string
): Promise<string[]> => {
  try {
    const assets = await getAssetsWithUploadedVideos();
    return assets
      .filter(asset => asset.taskId === taskId)
      .map(asset => asset.assetId);
  } catch (error) {
    console.error('Failed to get asset IDs with uploaded videos for task:', error);
    return [];
  }
};

/**
 * Check if there's an interrupted recording session for a specific asset
 */
export const hasInterruptedRecordingForAsset = async (
  taskId: string,
  assetId: string
): Promise<boolean> => {
  try {
    const state = await getStreamState();
    return (
      (state.streamingState === 'paused' || state.streamingState === 'started') &&
      state.taskId === taskId &&
      state.assetId === assetId &&
      Date.now() - state.timestamp <= STATE_EXPIRY_TIME
    );
  } catch (error) {
    console.error('Failed to check interrupted recording:', error);
    return false;
  }
};

/**
 * Get all asset IDs with interrupted recording sessions for a task
 */
export const getAssetIdsWithInterruptedRecording = async (
  taskId: string
): Promise<string[]> => {
  try {
    const state = await getStreamState();
    console.log('Checking interrupted recording state:', {
      streamingState: state.streamingState,
      taskId: state.taskId,
      assetId: state.assetId,
      timestamp: state.timestamp,
      isExpired: Date.now() - state.timestamp > STATE_EXPIRY_TIME
    });
    
    if (
      (state.streamingState === 'paused' || state.streamingState === 'started') &&
      state.taskId === taskId &&
      state.assetId &&
      Date.now() - state.timestamp <= STATE_EXPIRY_TIME
    ) {
      console.log('Found interrupted recording for asset:', state.assetId);
      return [state.assetId];
    }
    return [];
  } catch (error) {
    console.error('Failed to get asset IDs with interrupted recording:', error);
    return [];
  }
};