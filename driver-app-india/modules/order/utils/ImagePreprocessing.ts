import {Image} from 'react-native';

export interface ImagePreprocessingOptions {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  sharpness?: number; // 0 to 100
}

/**
 * Utility class for image preprocessing to improve OCR accuracy
 */
class ImagePreprocessing {
  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imageUri: string, options: ImagePreprocessingOptions = {}): Promise<string> {
    // For now, return the original image
    // In a production app, you might use libraries like react-native-image-filter-kit
    // or native modules for image enhancement
    
    // Log preprocessing for debugging
    console.log('Image preprocessing options:', options);
    
    return imageUri;
  }

  /**
   * Validate image quality for OCR
   */
  validateImageQuality(imageUri: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    return new Promise((resolve) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          const issues: string[] = [];
          const recommendations: string[] = [];

          // Check resolution
          if (width < 800 || height < 600) {
            issues.push('Low image resolution');
            recommendations.push('Use higher resolution images (minimum 800x600)');
          }

          // Check aspect ratio
          const aspectRatio = width / height;
          if (aspectRatio < 0.5 || aspectRatio > 2) {
            recommendations.push('Ensure the document fills most of the frame');
          }

          // Check if image is too small
          if (width < 400 || height < 300) {
            issues.push('Image too small for accurate OCR');
          }

          resolve({
            isValid: issues.length === 0,
            issues,
            recommendations,
          });
        },
        (error) => {
          resolve({
            isValid: false,
            issues: ['Failed to analyze image'],
            recommendations: ['Please select a valid image'],
          });
        }
      );
    });
  }

  /**
   * Get image quality score (0-100)
   */
  async getImageQualityScore(imageUri: string): Promise<number> {
    try {
      const validation = await this.validateImageQuality(imageUri);
      
      let score = 100;
      
      // Deduct points for issues
      score -= validation.issues.length * 20;
      
      // Deduct points for recommendations (but less than issues)
      score -= validation.recommendations.length * 10;
      
      return Math.max(0, score);
    } catch (error) {
      console.error('Error calculating image quality score:', error);
      return 50; // Default to medium quality
    }
  }

  /**
   * Optimize camera settings for OCR
   */
  getOptimalCameraSettings() {
    return {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.9,
      saveToPhotos: false,
      cameraType: 'back' as const,
      presentationStyle: 'fullScreen' as const,
    };
  }

  /**
   * Check if image needs rotation
   */
  detectImageOrientation(imageUri: string): Promise<{
    rotation: number;
    confidence: number;
  }> {
    // This is a simplified implementation
    // In production, you might use ML-based orientation detection
    return Promise.resolve({
      rotation: 0,
      confidence: 80,
    });
  }

  /**
   * Get OCR best practices tips
   */
  getOCRBestPractices(): string[] {
    return [
      'Ensure good lighting - avoid shadows and glare',
      'Hold camera steady and parallel to document',
      'Fill the frame with the document',
      'Use high contrast between text and background',
      'Avoid blurry images - ensure text is sharp',
      'Use landscape orientation for better results',
      'Ensure text is not cut off in the image',
      'Clean camera lens before taking photo',
    ];
  }
}

export default new ImagePreprocessing();