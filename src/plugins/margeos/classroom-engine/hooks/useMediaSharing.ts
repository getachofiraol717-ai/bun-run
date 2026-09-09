// @ts-nocheck
/**
 * useMediaSharing.ts
 *
 * React hook for media sharing operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaManager } from '../engines';
import { MediaAttachment, EducationalContext } from '../models';

export interface UseMediaSharingOptions {
  channelId?: string;
  limit?: number;
  type?: 'all' | 'images' | 'documents' | 'videos';
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'failed';
  error?: string;
}

export interface UseMediaSharingReturn {
  media: MediaAttachment[];
  loading: boolean;
  error: string | null;
  uploadProgress: UploadProgress | null;
  uploadFile: (file: File, educationalContext?: EducationalContext) => Promise<MediaAttachment | null>;
  uploadMultiple: (files: File[], educationalContext?: EducationalContext) => Promise<MediaAttachment[]>;
  deleteMedia: (mediaId: string) => boolean;
  viewMedia: (mediaId: string) => void;
  downloadMedia: (mediaId: string) => void;
  searchMedia: (query: string) => MediaAttachment[];
  getMediaStats: () => { totalMedia: number; totalSize: number; imageCount: number; videoCount: number; documentCount: number };
  formatFileSize: (bytes: number) => string;
  isSupported: (file: File) => boolean;
  getFileIcon: (mimeType: string) => string;
}

export function useMediaSharing(
  options: UseMediaSharingOptions = {}
): UseMediaSharingReturn {
  const { channelId, limit, type = 'all' } = options;

  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const mediaManager = MediaManager.getInstance();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Load media
  const loadMedia = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      let loadedMedia: MediaAttachment[];

      switch (type) {
        case 'images':
          loadedMedia = mediaManager.getImages(channelId, limit);
          break;
        case 'documents':
          loadedMedia = mediaManager.getDocuments(channelId, limit);
          break;
        case 'videos':
          loadedMedia = mediaManager.getVideos(channelId, limit);
          break;
        default:
          loadedMedia = mediaManager.getChannelMedia(channelId, limit);
      }

      setMedia(loadedMedia);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [channelId, limit, type, mediaManager]);

  // Initial load
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Subscribe to updates
  useEffect(() => {
    if (!channelId) return;

    const unsubscribe = mediaManager.subscribe('mediaAdded', (newMedia) => {
      if (newMedia.channelId === channelId) {
        setMedia(prev => [newMedia, ...prev]);
      }
    });

    const unsubscribeDeleted = mediaManager.subscribe('mediaDeleted', (data) => {
      if (data.channelId === channelId) {
        setMedia(prev => prev.filter(m => m.id !== data.mediaId));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeDeleted();
    };
  }, [channelId, mediaManager]);

  // Upload file
  const uploadFile = useCallback(async (
    file: File,
    educationalContext?: EducationalContext
  ): Promise<MediaAttachment | null> => {
    if (!channelId) return null;

    const uploadId = `upload-${Date.now()}`;
    const controller = new AbortController();
    abortControllersRef.current.set(uploadId, controller);

    setUploadProgress({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    });

    try {
      // Read file
      const reader = new FileReader();

      const media = await new Promise<MediaAttachment>((resolve, reject) => {
        reader.onload = () => {
          const dataUrl = reader.result as string;

          setUploadProgress(prev => prev ? { ...prev, progress: 50, status: 'processing' } : null);

          try {
            const attachment = mediaManager.createMediaFromData(
              channelId,
              channelId,
              file.name,
              file.type,
              dataUrl,
              file.size,
              'current-user',
              'Current User',
              educationalContext
            );

            setUploadProgress(prev => prev ? { ...prev, progress: 100, status: 'complete' } : null);
            resolve(attachment);
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      setTimeout(() => setUploadProgress(null), 1000);
      return media;
    } catch (err) {
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'failed',
        error: (err as Error).message
      });
      setError((err as Error).message);
      return null;
    } finally {
      abortControllersRef.current.delete(uploadId);
    }
  }, [channelId, mediaManager]);

  // Upload multiple files
  const uploadMultiple = useCallback(async (
    files: File[],
    educationalContext?: EducationalContext
  ): Promise<MediaAttachment[]> => {
    const results: MediaAttachment[] = [];

    for (const file of files) {
      const result = await uploadFile(file, educationalContext);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }, [uploadFile]);

  // Delete media
  const deleteMedia = useCallback((mediaId: string): boolean => {
    try {
      const result = mediaManager.deleteMedia(mediaId);
      if (result) {
        setMedia(prev => prev.filter(m => m.id !== mediaId));
      }
      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [mediaManager]);

  // View media
  const viewMedia = useCallback((mediaId: string) => {
    const userId = 'current-user';
    mediaManager.addView(mediaId, userId);
  }, [mediaManager]);

  // Download media
  const downloadMedia = useCallback((mediaId: string) => {
    const userId = 'current-user';
    const attachment = mediaManager.getMedia(mediaId);

    if (!attachment || !attachment.url) return;

    mediaManager.addDownload(mediaId, userId);

    // Trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [mediaManager]);

  // Search media
  const searchMedia = useCallback((query: string): MediaAttachment[] => {
    if (!channelId) return [];
    return mediaManager.searchMedia(query, { channelId });
  }, [channelId, mediaManager]);

  // Get stats
  const getMediaStats = useCallback(() => {
    if (!channelId) {
      return { totalMedia: 0, totalSize: 0, imageCount: 0, videoCount: 0, documentCount: 0 };
    }
    return mediaManager.getMediaStats(channelId);
  }, [channelId, mediaManager]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    return mediaManager.formatFileSize(bytes);
  }, [mediaManager]);

  // Check if file is supported
  const isSupported = useCallback((file: File): boolean => {
    const supportedTypes = [
      'image/', 'video/', 'audio/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument'
    ];

    return supportedTypes.some(t => file.type.startsWith(t) || file.type.includes(t));
  }, []);

  // Get file icon
  const getFileIcon = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'file-pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    return 'file';
  }, []);

  return {
    media,
    loading,
    error,
    uploadProgress,
    uploadFile,
    uploadMultiple,
    deleteMedia,
    viewMedia,
    downloadMedia,
    searchMedia,
    getMediaStats,
    formatFileSize,
    isSupported,
    getFileIcon
  };
}

export default useMediaSharing;
