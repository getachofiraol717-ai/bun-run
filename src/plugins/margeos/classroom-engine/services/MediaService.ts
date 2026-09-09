// @ts-nocheck
/**
 * MediaService.ts
 *
 * High-level service for media handling operations.
 */

import { MediaManager } from '../engines';
import { MediaAttachment, EducationalContext } from '../models';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'failed';
  error?: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

class MediaService {
  private static instance: MediaService;
  private mediaManager: MediaManager;
  private uploadCallbacks: Map<string, ProgressCallback> = new Map();

  private constructor() {
    this.mediaManager = MediaManager.getInstance();
  }

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  async initialize(): Promise<void> {
    await this.mediaManager.initialize();
  }

  // Upload a file with progress tracking
  async uploadMedia(
    classroomId: string,
    channelId: string,
    file: File,
    uploadedBy: string,
    uploadedByName: string,
    educationalContext?: EducationalContext,
    onProgress?: ProgressCallback
  ): Promise<MediaAttachment> {
    const uploadId = `upload-${Date.now()}`;

    // Register progress callback
    if (onProgress) {
      this.uploadCallbacks.set(uploadId, onProgress);
    }

    try {
      // Report upload start
      this.reportProgress(uploadId, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      // Read file as data URL for small files
      const dataUrl = await this.readFileAsDataUrl(file);

      // Report processing
      this.reportProgress(uploadId, {
        fileName: file.name,
        progress: 50,
        status: 'processing'
      });

      // Create media attachment
      const media = this.mediaManager.createMediaFromData(
        classroomId,
        channelId,
        file.name,
        file.type,
        dataUrl,
        file.size,
        uploadedBy,
        uploadedByName,
        educationalContext
      );

      // Report complete
      this.reportProgress(uploadId, {
        fileName: file.name,
        progress: 100,
        status: 'complete'
      });

      return media;
    } catch (error) {
      this.reportProgress(uploadId, {
        fileName: file.name,
        progress: 0,
        status: 'failed',
        error: (error as Error).message
      });
      throw error;
    } finally {
      this.uploadCallbacks.delete(uploadId);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private reportProgress(uploadId: string, progress: UploadProgress): void {
    const callback = this.uploadCallbacks.get(uploadId);
    if (callback) {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in upload progress callback:', error);
      }
    }
  }

  // Get media by ID
  getMedia(mediaId: string): MediaAttachment | undefined {
    return this.mediaManager.getMedia(mediaId);
  }

  // Get channel media
  getChannelMedia(channelId: string, limit?: number): MediaAttachment[] {
    return this.mediaManager.getChannelMedia(channelId, limit);
  }

  // Get images only
  getChannelImages(channelId: string, limit?: number): MediaAttachment[] {
    return this.mediaManager.getImages(channelId, limit);
  }

  // Get documents only
  getChannelDocuments(channelId: string, limit?: number): MediaAttachment[] {
    return this.mediaManager.getDocuments(channelId, limit);
  }

  // Get videos only
  getChannelVideos(channelId: string, limit?: number): MediaAttachment[] {
    return this.mediaManager.getVideos(channelId, limit);
  }

  // View media
  viewMedia(mediaId: string, userId: string): boolean {
    return this.mediaManager.addView(mediaId, userId);
  }

  // Download media
  downloadMedia(mediaId: string, userId: string): boolean {
    return this.mediaManager.addDownload(mediaId, userId);
  }

  // Delete media
  deleteMedia(mediaId: string): boolean {
    return this.mediaManager.deleteMedia(mediaId);
  }

  // Search media
  searchMedia(query: string, filter?: { classroomId?: string; channelId?: string }): MediaAttachment[] {
    return this.mediaManager.searchMedia(query, filter);
  }

  // Get media stats
  getMediaStats(channelId: string): {
    totalMedia: number;
    totalSize: number;
    imageCount: number;
    videoCount: number;
    documentCount: number;
    totalViews: number;
    totalDownloads: number;
  } {
    return this.mediaManager.getMediaStats(channelId);
  }

  // Format file size
  formatFileSize(bytes: number): string {
    return this.mediaManager.formatFileSize(bytes);
  }

  // Get supported file types
  getSupportedTypes(): { type: string; extensions: string[]; icon: string }[] {
    return [
      { type: 'image', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'], icon: 'image' },
      { type: 'video', extensions: ['mp4', 'webm', 'mov', 'avi'], icon: 'video' },
      { type: 'audio', extensions: ['mp3', 'wav', 'ogg', 'webm'], icon: 'audio' },
      { type: 'pdf', extensions: ['pdf'], icon: 'file-pdf' },
      { type: 'document', extensions: ['doc', 'docx', 'txt', 'rtf'], icon: 'file-text' },
      { type: 'spreadsheet', extensions: ['xls', 'xlsx', 'csv'], icon: 'table' },
      { type: 'archive', extensions: ['zip', 'rar', '7z', 'tar'], icon: 'archive' }
    ];
  }

  // Check if file type is supported
  isSupported(file: File): boolean {
    const supportedTypes = this.getSupportedTypes();
    const mimeType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    return supportedTypes.some(t =>
      mimeType.startsWith(t.type) || t.extensions.includes(extension)
    );
  }

  // Get file icon based on type
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'file-pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    return 'file';
  }
}

export default MediaService;
