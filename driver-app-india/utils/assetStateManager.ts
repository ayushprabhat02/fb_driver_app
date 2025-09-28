/**
 * Asset State Manager - API-based replacement for localStorage
 * Handles video upload, dispensing, and quantity states through task_value table
 */

import { orderStore } from '@/globalStore';
import {
  markVideoUploaded,
  markDispensingStarted,
  markQuantityEntered,
  syncTaskValuesWithStore,
  getAssetsWithUploadedVideos,
  getPartiallyFilledAssets,
  TASK_VALUE_KEYS,
  setTaskValue,
} from './taskValueStorage';

export class AssetStateManager {
  private taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }

  /**
   * Initialize asset states from API when screen loads
   * Replaces localStorage.getItem() calls
   */
  async initializeAssetStates(): Promise<void> {
    try {
      console.log('🔄 Initializing asset states from API...');
      await syncTaskValuesWithStore(this.taskId);
      console.log('✅ Asset states initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize asset states:', error);
    }
  }

  /**
   * Mark video upload completed for an asset
   * Replaces: localStorage.setItem('videoUploaded_assetId', 'true')
   */
  async onVideoUploadCompleted(assetId: string, videoUrl?: string): Promise<void> {
    try {
      console.log(`📹 Marking video uploaded for asset: ${assetId}`);

      // 1. Mark video as uploaded in API
      await markVideoUploaded(this.taskId, assetId, videoUrl);

      // 2. Update local store immediately for UI responsiveness
      orderStore.setState(state => ({
        ...state,
        assetsWithUploadedVideos: [...new Set([...state.assetsWithUploadedVideos, assetId])],
      }));

      console.log(`✅ Video upload status saved for asset: ${assetId}`);
    } catch (error) {
      console.error(`❌ Failed to mark video uploaded for asset ${assetId}:`, error);
    }
  }

  /**
   * Mark dispensing started for an asset
   * Replaces: localStorage.setItem('dispensingStarted_assetId', 'true')
   */
  async onDispensingStarted(assetId: string): Promise<void> {
    try {
      console.log(`⛽ Marking dispensing started for asset: ${assetId}`);

      await markDispensingStarted(this.taskId, assetId);

      console.log(`✅ Dispensing started status saved for asset: ${assetId}`);
    } catch (error) {
      console.error(`❌ Failed to mark dispensing started for asset ${assetId}:`, error);
    }
  }

  /**
   * Mark quantity entered for an asset (completes the flow)
   * Replaces: localStorage.setItem('quantityEntered_assetId', quantity)
   */
  async onQuantityEntered(assetId: string, quantity: number): Promise<void> {
    try {
      console.log(`🔢 Marking quantity entered for asset: ${assetId}, quantity: ${quantity}`);

      // 1. Mark quantity as entered in API
      await markQuantityEntered(this.taskId, assetId, quantity);

      // 2. Remove from uploaded videos array (no longer needs attention)
      orderStore.setState(state => ({
        ...state,
        assetsWithUploadedVideos: state.assetsWithUploadedVideos.filter(id => id !== assetId),
      }));

      console.log(`✅ Quantity entered status saved for asset: ${assetId}`);
    } catch (error) {
      console.error(`❌ Failed to mark quantity entered for asset ${assetId}:`, error);
    }
  }

  /**
   * Mark totalizer before reading for an asset
   * Indicates asset has started but not completed
   */
  async onTotalizerBeforeReading(assetId: string, reading: string, imageUrl?: string): Promise<void> {
    try {
      console.log(`📊 Marking totalizer before reading for asset: ${assetId}`);

      await setTaskValue({
        task_id: this.taskId,
        customer_asset_id: assetId,
        key: TASK_VALUE_KEYS.TOTALIZER_BEFORE_READING,
        value: reading,
        url: imageUrl,
      });

      // Update store for partially filled assets
      orderStore.setState(state => ({
        ...state,
        partiallyFilledAssetsArray: [...new Set([...state.partiallyFilledAssetsArray, assetId])],
      }));

      console.log(`✅ Totalizer before reading saved for asset: ${assetId}`);
    } catch (error) {
      console.error(`❌ Failed to mark totalizer before reading for asset ${assetId}:`, error);
    }
  }

  /**
   * Mark totalizer after reading for an asset
   * Indicates asset is complete
   */
  async onTotalizerAfterReading(assetId: string, reading: string, imageUrl?: string): Promise<void> {
    try {
      console.log(`📊 Marking totalizer after reading for asset: ${assetId}`);

      await setTaskValue({
        task_id: this.taskId,
        customer_asset_id: assetId,
        key: TASK_VALUE_KEYS.TOTALIZER_AFTER_READING,
        value: reading,
        url: imageUrl,
      });

      // Remove from partially filled assets (now complete)
      orderStore.setState(state => ({
        ...state,
        partiallyFilledAssetsArray: state.partiallyFilledAssetsArray.filter(id => id !== assetId),
        assetsWithUploadedVideos: state.assetsWithUploadedVideos.filter(id => id !== assetId),
      }));

      console.log(`✅ Totalizer after reading saved for asset: ${assetId}`);
    } catch (error) {
      console.error(`❌ Failed to mark totalizer after reading for asset ${assetId}:`, error);
    }
  }

  /**
   * Check if video was uploaded for an asset
   * Replaces: localStorage.getItem('videoUploaded_assetId') === 'true'
   */
  isVideoUploaded(assetId: string): boolean {
    const { assetsWithUploadedVideos } = orderStore.getState();
    return assetsWithUploadedVideos.includes(assetId);
  }

  /**
   * Check if asset is partially filled
   * Replaces: localStorage.getItem('partiallyFilled_assetId') === 'true'
   */
  isPartiallyFilled(assetId: string): boolean {
    const { partiallyFilledAssetsArray } = orderStore.getState();
    return partiallyFilledAssetsArray.includes(assetId);
  }

  /**
   * Check if asset has any fill remaining activity
   */
  hasFillRemaining(assetId: string): boolean {
    return this.isVideoUploaded(assetId) || this.isPartiallyFilled(assetId);
  }

  /**
   * Get debug information for troubleshooting
   */
  getDebugInfo(assetId: string) {
    const store = orderStore.getState();
    return {
      assetId,
      isVideoUploaded: this.isVideoUploaded(assetId),
      isPartiallyFilled: this.isPartiallyFilled(assetId),
      hasFillRemaining: this.hasFillRemaining(assetId),
      allUploadedVideos: store.assetsWithUploadedVideos,
      allPartiallyFilled: store.partiallyFilledAssetsArray,
    };
  }

  /**
   * Refresh asset states from API
   * Use this when returning to the screen or after navigation
   */
  async refreshAssetStates(): Promise<void> {
    await this.initializeAssetStates();
  }
}

/**
 * Factory function to create AssetStateManager instance
 */
export const createAssetStateManager = (taskId: string): AssetStateManager => {
  return new AssetStateManager(taskId);
};

/**
 * Hook-like function for React components
 */
export const useAssetStateManager = (taskId: string) => {
  const manager = new AssetStateManager(taskId);

  return {
    initializeStates: () => manager.initializeAssetStates(),
    onVideoUploadCompleted: (assetId: string, videoUrl?: string) =>
      manager.onVideoUploadCompleted(assetId, videoUrl),
    onDispensingStarted: (assetId: string) =>
      manager.onDispensingStarted(assetId),
    onQuantityEntered: (assetId: string, quantity: number) =>
      manager.onQuantityEntered(assetId, quantity),
    onTotalizerBeforeReading: (assetId: string, reading: string, imageUrl?: string) =>
      manager.onTotalizerBeforeReading(assetId, reading, imageUrl),
    onTotalizerAfterReading: (assetId: string, reading: string, imageUrl?: string) =>
      manager.onTotalizerAfterReading(assetId, reading, imageUrl),
    isVideoUploaded: (assetId: string) => manager.isVideoUploaded(assetId),
    isPartiallyFilled: (assetId: string) => manager.isPartiallyFilled(assetId),
    hasFillRemaining: (assetId: string) => manager.hasFillRemaining(assetId),
    getDebugInfo: (assetId: string) => manager.getDebugInfo(assetId),
    refreshStates: () => manager.refreshAssetStates(),
  };
};