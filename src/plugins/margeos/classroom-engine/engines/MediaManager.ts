/**
 * MediaManager.ts
 *
 * Comprehensive engine for managing media attachments in classroom messages.
 * Supports images, videos, documents, voice notes, and educational resources
 * with advanced processing, analytics, and organization features.
 */

import { MediaAttachment, createMediaAttachment, createImageAttachment, createPDFAttachment, createVoiceNoteAttachment, EducationalContext } from '../models';

const STORAGE_KEY = 'media_manager_data';
const MEDIA_LIBRARY_KEY = 'media_library';

export interface MediaManagerConfig {
  maxFileSize?: number;
  allowedTypes?: string[];
  enableCompression?: boolean;
  enableThumbnail?: boolean;
  maxAttachments?: number;
  enableVideoProcessing?: boolean;
  enableMediaAnalytics?: boolean;
  enableMediaCategories?: boolean;
  enableMediaConversion?: boolean;
  thumbnailSize?: { width: number; height: number };
  compressionQuality?: number;
}

export interface MediaFilter {
  classroomId?: string;
  channelId?: string;
  type?: string;
  category?: string;
  uploadedBy?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  mimeTypes?: string[];
}

export interface MediaCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  classroomId?: string;
  isSystem: boolean;
  mediaCount: number;
}

export interface MediaAnalytics {
  mediaId: string;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  uniqueViewers: string[];
  avgWatchTime?: number;
  completionRate?: number;
  peakViewTime: string;
  trending: boolean;
  engagementScore: number;
}

export interface MediaThumbnail {
  id: string;
  mediaId: string;
  type: 'small' | 'medium' | 'large';
  url: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface MediaMetadata {
  mediaId: string;
  title?: string;
  description?: string;
  tags: string[];
  subject?: string;
  gradeLevel?: string;
  author?: string;
  source?: string;
  license?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  fileFormat?: string;
  fileSize?: number;
  colorSpace?: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  hasTransparency?: boolean;
  createdAt: string;
  modifiedAt?: string;
}

export interface MediaConversion {
  id: string;
  originalMediaId: string;
  targetFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface MediaLibrary {
  id: string;
  name: string;
  description?: string;
  classroomId?: string;
  channelId?: string;
  mediaIds: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaProcessingOptions {
  compress?: boolean;
  generateThumbnail?: boolean;
  extractMetadata?: boolean;
  watermark?: boolean;
  watermarkText?: string;
  resize?: { width?: number; height?: number };
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: number;
  flip?: 'horizontal' | 'vertical';
  quality?: number;
}

export interface MediaShareSettings {
  mediaId: string;
  sharedWith: string[];
  shareLink?: string;
  expiresAt?: string;
  allowDownload: boolean;
  allowReuse: boolean;
  requireAttribution: boolean;
}

class MediaManager {
  private static instance: MediaManager;
  private media: Map<string, MediaAttachment> = new Map();
  private channelMedia: Map<string, string[]> = new Map();
  private mediaCategories: Map<string, MediaCategory> = new Map();
  private mediaAnalytics: Map<string, MediaAnalytics> = new Map();
  private mediaThumbnails: Map<string, MediaThumbnail[]> = new Map();
  private mediaMetadata: Map<string, MediaMetadata> = new Map();
  private mediaConversions: Map<string, MediaConversion> = new Map();
  private mediaLibraries: Map<string, MediaLibrary> = new Map();
  private userMediaLibraries: Map<string, string[]> = new Map();
  private mediaShares: Map<string, MediaShareSettings> = new Map();
  private config: MediaManagerConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: MediaManagerConfig = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024,
      allowedTypes: config.allowedTypes || [
        'image/*', 'video/*', 'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/*'
      ],
      enableCompression: config.enableCompression !== false,
      enableThumbnail: config.enableThumbnail !== false,
      maxAttachments: config.maxAttachments || 10,
      enableVideoProcessing: config.enableVideoProcessing !== false,
      enableMediaAnalytics: config.enableMediaAnalytics !== false,
      enableMediaCategories: config.enableMediaCategories !== false,
      enableMediaConversion: config.enableMediaConversion !== false,
      thumbnailSize: config.thumbnailSize || { width: 200, height: 200 },
      compressionQuality: config.compressionQuality || 0.8
    };

    this.initializeDefaultCategories();
  }

  static getInstance(config?: MediaManagerConfig): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager(config);
    }
    return MediaManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private initializeDefaultCategories(): void {
    if (!this.config.enableMediaCategories) return;

    const defaultCategories: Omit<MediaCategory, 'id' | 'mediaCount'>[] = [
      { name: 'Images', description: 'Images and photos', icon: 'image', color: '#5865F2', isSystem: true },
      { name: 'Videos', description: 'Video content', icon: 'video', color: '#ED4245', isSystem: true },
      { name: 'Documents', description: 'PDFs and documents', icon: 'file', color: '#57F287', isSystem: true },
      { name: 'Audio', description: 'Audio files and voice notes', icon: 'audio', color: '#FEE75C', isSystem: true },
      { name: 'Educational', description: 'Learning resources', icon: 'book', color: '#EB459E', isSystem: true },
      { name: 'Assignments', description: 'Assignment submissions', icon: 'assignment', color: '#FAA61A', isSystem: true }
    ];

    defaultCategories.forEach(category => {
      const id = `CAT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      this.mediaCategories.set(id, { ...category, id, mediaCount: 0 });
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.media = new Map(Object.entries(data.media || {}));
        this.channelMedia = new Map(Object.entries(data.channelMedia || {}));
        this.mediaCategories = new Map(Object.entries(data.categories || {}));
        this.mediaAnalytics = new Map(Object.entries(data.analytics || {}));
        this.mediaThumbnails = new Map(Object.entries(data.thumbnails || {}));
        this.mediaMetadata = new Map(Object.entries(data.metadata || {}));
        this.mediaConversions = new Map(Object.entries(data.conversions || {}));
        this.mediaLibraries = new Map(Object.entries(data.libraries || {}));
        this.userMediaLibraries = new Map(Object.entries(data.userLibraries || {}));
        this.mediaShares = new Map(Object.entries(data.shares || {}));
      }
    } catch (error) {
      console.error('Failed to load media from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        media: Object.fromEntries(this.media),
        channelMedia: Object.fromEntries(this.channelMedia),
        categories: Object.fromEntries(this.mediaCategories),
        analytics: Object.fromEntries(this.mediaAnalytics),
        thumbnails: Object.fromEntries(this.mediaThumbnails),
        metadata: Object.fromEntries(this.mediaMetadata),
        conversions: Object.fromEntries(this.mediaConversions),
        libraries: Object.fromEntries(this.mediaLibraries),
        userLibraries: Object.fromEntries(this.userMediaLibraries),
        shares: Object.fromEntries(this.mediaShares)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save media to storage:', error);
    }
  }

  // Media Addition
  addMedia(
    classroomId: string,
    channelId: string,
    file: File,
    uploadedBy: string,
    uploadedByName: string,
    educationalContext?: EducationalContext,
    options?: {
      category?: string;
      tags?: string[];
      processingOptions?: MediaProcessingOptions;
      metadata?: Partial<MediaMetadata>;
    }
  ): MediaAttachment {
    if (file.size > this.config.maxFileSize!) {
      throw new Error(`File size exceeds maximum of ${this.formatFileSize(this.config.maxFileSize!)}`);
    }

    const media = createMediaAttachment(
      classroomId,
      channelId,
      file.name,
      file.type,
      file.size,
      uploadedBy,
      uploadedByName,
      educationalContext
    );

    if (options?.tags) {
      media.tags = [...media.tags, ...options.tags];
    }

    if (options?.category) {
      (media as any).category = options.category;
    }

    this.media.set(media.id, media);

    const channelMediaIds = this.channelMedia.get(channelId) || [];
    channelMediaIds.push(media.id);
    this.channelMedia.set(channelId, channelMediaIds);

    if (this.config.enableMediaAnalytics) {
      this.initializeMediaAnalytics(media.id);
    }

    if (this.config.enableThumbnail && file.type.startsWith('image/')) {
      this.generateThumbnails(media.id, file);
    }

    if (this.config.enableMediaConversion && options?.processingOptions) {
      this.processMedia(media.id, options.processingOptions);
    }

    if (options?.metadata) {
      this.updateMediaMetadata(media.id, options.metadata);
    }

    this.saveToStorage();
    this.emit('mediaAdded', media);

    return media;
  }

  createMediaFromData(
    classroomId: string,
    channelId: string,
    fileName: string,
    mimeType: string,
    dataUrl: string,
    size: number,
    uploadedBy: string,
    uploadedByName: string,
    educationalContext?: EducationalContext,
    options?: {
      category?: string;
      tags?: string[];
      metadata?: Partial<MediaMetadata>;
    }
  ): MediaAttachment {
    if (size > this.config.maxFileSize!) {
      throw new Error(`File size exceeds maximum of ${this.formatFileSize(this.config.maxFileSize!)}`);
    }

    const media = createMediaAttachment(
      classroomId,
      channelId,
      fileName,
      mimeType,
      size,
      uploadedBy,
      uploadedByName,
      educationalContext
    );

    media.url = dataUrl;
    media.status = 'ready';

    if (options?.tags) {
      media.tags = [...media.tags, ...options.tags];
    }

    if (options?.category) {
      (media as any).category = options.category;
    }

    this.media.set(media.id, media);

    const channelMediaIds = this.channelMedia.get(channelId) || [];
    channelMediaIds.push(media.id);
    this.channelMedia.set(channelId, channelMediaIds);

    if (this.config.enableMediaAnalytics) {
      this.initializeMediaAnalytics(media.id);
    }

    if (options?.metadata) {
      this.updateMediaMetadata(media.id, options.metadata);
    }

    this.saveToStorage();
    this.emit('mediaAdded', media);

    return media;
  }

  // Media Retrieval
  getMedia(mediaId: string): MediaAttachment | undefined {
    return this.media.get(mediaId);
  }

  getMediaByIds(mediaIds: string[]): MediaAttachment[] {
    return mediaIds.map(id => this.media.get(id)).filter((m): m is MediaAttachment => m !== undefined);
  }

  getChannelMedia(channelId: string, options?: { limit?: number; offset?: number; sortBy?: string }): MediaAttachment[] {
    const mediaIds = this.channelMedia.get(channelId) || [];
    let media = mediaIds.map(id => this.media.get(id)).filter((m): m is MediaAttachment => m !== undefined);

    media.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.offset) {
      media = media.slice(options.offset);
    }

    if (options?.limit) {
      media = media.slice(0, options.limit);
    }

    return media;
  }

  getMediaByType(type: string, options?: { limit?: number; classroomId?: string }): MediaAttachment[] {
    let media = Array.from(this.media.values());

    if (options?.classroomId) {
      media = media.filter(m => m.classroomId === options.classroomId);
    }

    if (type === 'image') {
      media = media.filter(m => m.type.startsWith('image/'));
    } else if (type === 'video') {
      media = media.filter(m => m.type.startsWith('video/'));
    } else if (type === 'document') {
      media = media.filter(m =>
        m.type === 'application/pdf' ||
        m.type.includes('document') ||
        m.type.includes('word') ||
        m.type.includes('presentation')
      );
    } else if (type === 'audio') {
      media = media.filter(m => m.type.startsWith('audio/'));
    }

    media.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.limit) {
      media = media.slice(0, options.limit);
    }

    return media;
  }

  getImages(channelId: string, options?: { limit?: number }): MediaAttachment[] {
    return this.getChannelMedia(channelId, options).filter(m => m.type.startsWith('image/'));
  }

  getDocuments(channelId: string, options?: { limit?: number }): MediaAttachment[] {
    return this.getChannelMedia(channelId, options).filter(m =>
      m.type === 'application/pdf' ||
      m.type.includes('document') ||
      m.type.includes('word')
    );
  }

  getVideos(channelId: string, options?: { limit?: number }): MediaAttachment[] {
    return this.getChannelMedia(channelId, options).filter(m => m.type.startsWith('video/'));
  }

  getAudioFiles(channelId: string, options?: { limit?: number }): MediaAttachment[] {
    return this.getChannelMedia(channelId, options).filter(m => m.type.startsWith('audio/'));
  }

  // Media Update
  updateMedia(mediaId: string, updates: Partial<MediaAttachment>): MediaAttachment | undefined {
    const media = this.media.get(mediaId);
    if (!media) return undefined;

    Object.assign(media, updates);
    this.saveToStorage();

    this.emit('mediaUpdated', media);
    return media;
  }

  updateMediaMetadata(mediaId: string, metadata: Partial<MediaMetadata>): MediaMetadata {
    let existingMetadata = this.mediaMetadata.get(mediaId);

    if (!existingMetadata) {
      existingMetadata = {
        mediaId,
        tags: [],
        createdAt: new Date().toISOString()
      };
    }

    Object.assign(existingMetadata, metadata, { modifiedAt: new Date().toISOString() });
    this.mediaMetadata.set(mediaId, existingMetadata);
    this.saveToStorage();

    return existingMetadata;
  }

  addTags(mediaId: string, tags: string[]): boolean {
    const media = this.media.get(mediaId);
    if (!media) return false;

    media.tags = [...new Set([...media.tags, ...tags])];
    this.saveToStorage();

    const metadata = this.mediaMetadata.get(mediaId);
    if (metadata) {
      metadata.tags = media.tags;
    }

    this.emit('mediaTagsUpdated', { mediaId, tags: media.tags });
    return true;
  }

  removeTags(mediaId: string, tags: string[]): boolean {
    const media = this.media.get(mediaId);
    if (!media) return false;

    media.tags = media.tags.filter(t => !tags.includes(t));
    this.saveToStorage();

    const metadata = this.mediaMetadata.get(mediaId);
    if (metadata) {
      metadata.tags = media.tags;
    }

    this.emit('mediaTagsUpdated', { mediaId, tags: media.tags });
    return true;
  }

  // Media Deletion
  deleteMedia(mediaId: string): boolean {
    const media = this.media.get(mediaId);
    if (!media) return false;

    const channelMediaIds = this.channelMedia.get(media.channelId);
    if (channelMediaIds) {
      const index = channelMediaIds.indexOf(mediaId);
      if (index > -1) {
        channelMediaIds.splice(index, 1);
      }
    }

    this.mediaAnalytics.delete(mediaId);
    this.mediaThumbnails.delete(mediaId);
    this.mediaMetadata.delete(mediaId);

    this.media.delete(mediaId);
    this.saveToStorage();

    this.emit('mediaDeleted', { mediaId, channelId: media.channelId });
    return true;
  }

  deleteChannelMedia(channelId: string): void {
    const mediaIds = this.channelMedia.get(channelId) || [];

    mediaIds.forEach(id => {
      this.media.delete(id);
      this.mediaAnalytics.delete(id);
      this.mediaThumbnails.delete(id);
      this.mediaMetadata.delete(id);
    });

    this.channelMedia.delete(channelId);
    this.saveToStorage();
  }

  deleteBulkMedia(mediaIds: string[]): { deleted: string[]; failed: string[] } {
    const result = { deleted: [] as string[], failed: [] as string[] };

    mediaIds.forEach(id => {
      if (this.deleteMedia(id)) {
        result.deleted.push(id);
      } else {
        result.failed.push(id);
      }
    });

    return result;
  }

  // Media Processing
  processMedia(mediaId: string, options: MediaProcessingOptions): void {
    const media = this.media.get(mediaId);
    if (!media) return;

    if (options.generateThumbnail && media.type.startsWith('image/')) {
      this.generateThumbnails(mediaId);
    }

    if (options.compress) {
      this.compressMedia(mediaId, options.quality || this.config.compressionQuality!);
    }

    this.emit('mediaProcessingStarted', { mediaId, options });
  }

  private generateThumbnails(mediaId: string, file?: File): void {
    if (!this.config.enableThumbnail) return;

    const media = this.media.get(mediaId);
    if (!media || !media.type.startsWith('image/')) return;

    const thumbnails: MediaThumbnail[] = [
      {
        id: `THUMB-${mediaId}-small`,
        mediaId,
        type: 'small',
        url: media.url || '',
        width: 100,
        height: 100,
        createdAt: new Date().toISOString()
      },
      {
        id: `THUMB-${mediaId}-medium`,
        mediaId,
        type: 'medium',
        url: media.url || '',
        width: 300,
        height: 300,
        createdAt: new Date().toISOString()
      },
      {
        id: `THUMB-${mediaId}-large`,
        mediaId,
        type: 'large',
        url: media.url || '',
        width: 600,
        height: 600,
        createdAt: new Date().toISOString()
      }
    ];

    this.mediaThumbnails.set(mediaId, thumbnails);
    this.saveToStorage();

    this.emit('thumbnailsGenerated', { mediaId, thumbnails });
  }

  private compressMedia(mediaId: string, quality: number): void {
    const media = this.media.get(mediaId);
    if (!media) return;

    this.emit('mediaCompressionStarted', { mediaId, quality });
  }

  getThumbnails(mediaId: string): MediaThumbnail[] {
    return this.mediaThumbnails.get(mediaId) || [];
  }

  getThumbnail(mediaId: string, type: 'small' | 'medium' | 'large'): MediaThumbnail | undefined {
    const thumbnails = this.mediaThumbnails.get(mediaId);
    return thumbnails?.find(t => t.type === type);
  }

  // Media Processing Status
  processMediaStatus(mediaId: string, status: 'processing' | 'ready' | 'failed', error?: string): boolean {
    const media = this.media.get(mediaId);
    if (!media) return false;

    media.status = status;
    if (error) {
      media.error = error;
    }
    if (status === 'ready') {
      media.processedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.emit('mediaProcessed', { mediaId, status, error });
    return true;
  }

  // Media Analytics
  private initializeMediaAnalytics(mediaId: string): void {
    const analytics: MediaAnalytics = {
      mediaId,
      viewCount: 0,
      downloadCount: 0,
      shareCount: 0,
      uniqueViewers: [],
      peakViewTime: new Date().toISOString(),
      trending: false,
      engagementScore: 0
    };

    this.mediaAnalytics.set(mediaId, analytics);
  }

  getMediaAnalytics(mediaId: string): MediaAnalytics | undefined {
    return this.mediaAnalytics.get(mediaId);
  }

  addView(mediaId: string, userId: string): boolean {
    const media = this.media.get(mediaId);
    if (!media) return false;

    let analytics = this.mediaAnalytics.get(mediaId);
    if (!analytics) {
      this.initializeMediaAnalytics(mediaId);
      analytics = this.mediaAnalytics.get(mediaId);
    }

    if (!analytics!.uniqueViewers.includes(userId)) {
      analytics!.uniqueViewers.push(userId);
    }

    analytics!.viewCount++;
    analytics!.peakViewTime = new Date().toISOString();
    this.updateEngagementScore(mediaId);

    this.saveToStorage();
    this.emit('mediaViewed', { mediaId, userId });
    return true;
  }

  addDownload(mediaId: string, userId: string): boolean {
    const media = this.media.get(mediaId);
    if (!media) return false;

    let analytics = this.mediaAnalytics.get(mediaId);
    if (!analytics) {
      this.initializeMediaAnalytics(mediaId);
      analytics = this.mediaAnalytics.get(mediaId);
    }

    if (!analytics!.uniqueViewers.includes(userId)) {
      analytics!.uniqueViewers.push(userId);
    }

    analytics!.downloadCount++;
    media.downloadCount = analytics!.downloadCount;
    this.updateEngagementScore(mediaId);

    this.saveToStorage();
    this.emit('mediaDownloaded', { mediaId, userId });
    return true;
  }

  recordShare(mediaId: string): boolean {
    const analytics = this.mediaAnalytics.get(mediaId);
    if (!analytics) return false;

    analytics.shareCount++;
    this.updateEngagementScore(mediaId);
    this.saveToStorage();

    this.emit('mediaShared', { mediaId });
    return true;
  }

  private updateEngagementScore(mediaId: string): void {
    const analytics = this.mediaAnalytics.get(mediaId);
    if (!analytics) return;

    const viewsWeight = 1;
    const downloadsWeight = 3;
    const sharesWeight = 5;
    const uniqueViewersWeight = 2;

    const score = (
      analytics.viewCount * viewsWeight +
      analytics.downloadCount * downloadsWeight +
      analytics.shareCount * sharesWeight +
      analytics.uniqueViewers.length * uniqueViewersWeight
    );

    analytics.engagementScore = Math.min(100, score);
    analytics.trending = analytics.engagementScore > 70;
  }

  getTrendingMedia(classroomId?: string, limit: number = 10): MediaAttachment[] {
    let mediaList = Array.from(this.media.values());

    if (classroomId) {
      mediaList = mediaList.filter(m => m.classroomId === classroomId);
    }

    return mediaList
      .filter(m => this.mediaAnalytics.get(m.id)?.trending)
      .sort((a, b) => {
        const scoreA = this.mediaAnalytics.get(a.id)?.engagementScore || 0;
        const scoreB = this.mediaAnalytics.get(b.id)?.engagementScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  getPopularMedia(classroomId?: string, limit: number = 10): MediaAttachment[] {
    let mediaList = Array.from(this.media.values());

    if (classroomId) {
      mediaList = mediaList.filter(m => m.classroomId === classroomId);
    }

    return mediaList
      .sort((a, b) => {
        const scoreA = this.mediaAnalytics.get(a.id)?.viewCount || 0;
        const scoreB = this.mediaAnalytics.get(b.id)?.viewCount || 0;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Media Search
  searchMedia(query: string, filter: MediaFilter = {}): MediaAttachment[] {
    const lowerQuery = query.toLowerCase();
    let results = Array.from(this.media.values()).filter(m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );

    if (filter.classroomId) {
      results = results.filter(m => m.classroomId === filter.classroomId);
    }

    if (filter.channelId) {
      results = results.filter(m => m.channelId === filter.channelId);
    }

    if (filter.type) {
      if (filter.type === 'image') {
        results = results.filter(m => m.type.startsWith('image/'));
      } else if (filter.type === 'video') {
        results = results.filter(m => m.type.startsWith('video/'));
      } else if (filter.type === 'document') {
        results = results.filter(m =>
          m.type === 'application/pdf' ||
          m.type.includes('document')
        );
      }
    }

    if (filter.category) {
      results = results.filter(m => (m as any).category === filter.category);
    }

    if (filter.uploadedBy) {
      results = results.filter(m => m.uploadedBy === filter.uploadedBy);
    }

    if (filter.startDate) {
      results = results.filter(m => m.createdAt >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter(m => m.createdAt <= filter.endDate!);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(m =>
        filter.tags!.some(tag => m.tags.includes(tag))
      );
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Category Management
  createCategory(name: string, description: string, options?: { icon?: string; color?: string; classroomId?: string }): MediaCategory {
    const id = `CAT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const category: MediaCategory = {
      id,
      name,
      description,
      isSystem: false,
      mediaCount: 0
    };

    if (options?.icon) category.icon = options.icon;
    if (options?.color) category.color = options.color;
    if (options?.classroomId) category.classroomId = options.classroomId;

    this.mediaCategories.set(id, category);
    this.saveToStorage();

    this.emit('categoryCreated', category);
    return category;
  }

  getCategory(categoryId: string): MediaCategory | undefined {
    return this.mediaCategories.get(categoryId);
  }

  getAllCategories(): MediaCategory[] {
    return Array.from(this.mediaCategories.values());
  }

  getMediaByCategory(categoryId: string, limit?: number): MediaAttachment[] {
    const category = this.mediaCategories.get(categoryId);
    if (!category) return [];

    let results = Array.from(this.media.values())
      .filter(m => (m as any).category === categoryId);

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  }

  updateCategory(categoryId: string, updates: Partial<MediaCategory>): MediaCategory | undefined {
    const category = this.mediaCategories.get(categoryId);
    if (!category || category.isSystem) return undefined;

    Object.assign(category, updates);
    this.saveToStorage();

    this.emit('categoryUpdated', category);
    return category;
  }

  deleteCategory(categoryId: string): boolean {
    const category = this.mediaCategories.get(categoryId);
    if (!category || category.isSystem) return false;

    this.mediaCategories.delete(categoryId);
    this.saveToStorage();

    this.emit('categoryDeleted', { categoryId });
    return true;
  }

  // Media Library
  createLibrary(name: string, createdBy: string, options?: { description?: string; classroomId?: string; channelId?: string }): MediaLibrary {
    const id = `LIB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const library: MediaLibrary = {
      id,
      name,
      mediaIds: [],
      isPublic: false,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (options?.description) library.description = options.description;
    if (options?.classroomId) library.classroomId = options.classroomId;
    if (options?.channelId) library.channelId = options.channelId;

    this.mediaLibraries.set(id, library);

    const userLibraries = this.userMediaLibraries.get(createdBy) || [];
    userLibraries.push(id);
    this.userMediaLibraries.set(createdBy, userLibraries);

    this.saveToStorage();
    this.emit('libraryCreated', library);
    return library;
  }

  getLibrary(libraryId: string): MediaLibrary | undefined {
    return this.mediaLibraries.get(libraryId);
  }

  getUserLibraries(userId: string): MediaLibrary[] {
    const libraryIds = this.userMediaLibraries.get(userId) || [];
    return libraryIds
      .map(id => this.mediaLibraries.get(id))
      .filter((l): l is MediaLibrary => l !== undefined);
  }

  addToLibrary(libraryId: string, mediaIds: string[]): boolean {
    const library = this.mediaLibraries.get(libraryId);
    if (!library) return false;

    const uniqueMediaIds = [...new Set([...library.mediaIds, ...mediaIds])];
    library.mediaIds = uniqueMediaIds;
    library.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('libraryUpdated', library);
    return true;
  }

  removeFromLibrary(libraryId: string, mediaIds: string[]): boolean {
    const library = this.mediaLibraries.get(libraryId);
    if (!library) return false;

    library.mediaIds = library.mediaIds.filter(id => !mediaIds.includes(id));
    library.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('libraryUpdated', library);
    return true;
  }

  getLibraryMedia(libraryId: string): MediaAttachment[] {
    const library = this.mediaLibraries.get(libraryId);
    if (!library) return [];

    return library.mediaIds
      .map(id => this.media.get(id))
      .filter((m): m is MediaAttachment => m !== undefined);
  }

  deleteLibrary(libraryId: string): boolean {
    const library = this.mediaLibraries.get(libraryId);
    if (!library) return false;

    this.mediaLibraries.delete(libraryId);

    this.userMediaLibraries.forEach((libraries, userId) => {
      const filtered = libraries.filter(id => id !== libraryId);
      this.userMediaLibraries.set(userId, filtered);
    });

    this.saveToStorage();
    this.emit('libraryDeleted', { libraryId });
    return true;
  }

  // Media Conversion
  requestConversion(mediaId: string, targetFormat: string): MediaConversion | undefined {
    if (!this.config.enableMediaConversion) return undefined;

    const media = this.media.get(mediaId);
    if (!media) return undefined;

    const conversion: MediaConversion = {
      id: `CONV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      originalMediaId: mediaId,
      targetFormat,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    this.mediaConversions.set(conversion.id, conversion);
    this.saveToStorage();

    this.emit('conversionRequested', conversion);
    return conversion;
  }

  updateConversion(conversionId: string, updates: Partial<MediaConversion>): MediaConversion | undefined {
    const conversion = this.mediaConversions.get(conversionId);
    if (!conversion) return undefined;

    Object.assign(conversion, updates);

    if (updates.status === 'completed') {
      conversion.completedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.emit('conversionUpdated', conversion);
    return conversion;
  }

  getConversion(conversionId: string): MediaConversion | undefined {
    return this.mediaConversions.get(conversionId);
  }

  getMediaConversions(mediaId: string): MediaConversion[] {
    return Array.from(this.mediaConversions.values())
      .filter(c => c.originalMediaId === mediaId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Media Sharing
  shareMedia(mediaId: string, sharedWith: string[], options?: { expiresIn?: number; allowDownload?: boolean; allowReuse?: boolean }): MediaShareSettings {
    const shareSettings: MediaShareSettings = {
      mediaId,
      sharedWith,
      allowDownload: options?.allowDownload ?? true,
      allowReuse: options?.allowReuse ?? false,
      requireAttribution: true
    };

    if (options?.expiresIn) {
      shareSettings.expiresAt = new Date(Date.now() + options.expiresIn).toISOString();
    }

    this.mediaShares.set(mediaId, shareSettings);
    this.saveToStorage();

    this.recordShare(mediaId);
    this.emit('mediaShared', shareSettings);
    return shareSettings;
  }

  getShareSettings(mediaId: string): MediaShareSettings | undefined {
    return this.mediaShares.get(mediaId);
  }

  revokeShare(mediaId: string): boolean {
    const deleted = this.mediaShares.delete(mediaId);
    if (deleted) {
      this.saveToStorage();
      this.emit('shareRevoked', { mediaId });
    }
    return deleted;
  }

  // Media Stats
  getMediaStats(channelId: string): {
    totalMedia: number;
    totalSize: number;
    imageCount: number;
    videoCount: number;
    documentCount: number;
    audioCount: number;
    totalViews: number;
    totalDownloads: number;
  } {
    const media = this.getChannelMedia(channelId);

    return {
      totalMedia: media.length,
      totalSize: media.reduce((sum, m) => sum + m.size, 0),
      imageCount: media.filter(m => m.type.startsWith('image/')).length,
      videoCount: media.filter(m => m.type.startsWith('video/')).length,
      documentCount: media.filter(m =>
        m.type === 'application/pdf' ||
        m.type.includes('document') ||
        m.type.includes('word')
      ).length,
      audioCount: media.filter(m => m.type.startsWith('audio/')).length,
      totalViews: media.reduce((sum, m) => sum + (this.mediaAnalytics.get(m.id)?.viewCount || 0), 0),
      totalDownloads: media.reduce((sum, m) => sum + (this.mediaAnalytics.get(m.id)?.downloadCount || 0), 0)
    };
  }

  getUserMediaStats(userId: string): {
    totalMedia: number;
    totalSize: number;
    byType: Record<string, number>;
    totalViews: number;
    totalDownloads: number;
  } {
    const media = Array.from(this.media.values()).filter(m => m.uploadedBy === userId);

    const byType: Record<string, number> = {};
    media.forEach(m => {
      const type = m.type.split('/')[0];
      byType[type] = (byType[type] || 0) + 1;
    });

    let totalViews = 0;
    let totalDownloads = 0;

    media.forEach(m => {
      const analytics = this.mediaAnalytics.get(m.id);
      if (analytics) {
        totalViews += analytics.viewCount;
        totalDownloads += analytics.downloadCount;
      }
    });

    return {
      totalMedia: media.length,
      totalSize: media.reduce((sum, m) => sum + m.size, 0),
      byType,
      totalViews,
      totalDownloads
    };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Event System
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  getStats(): { totalMedia: number; totalSize: number; totalViews: number; categories: number; libraries: number } {
    const allMedia = Array.from(this.media.values());
    return {
      totalMedia: allMedia.length,
      totalSize: allMedia.reduce((sum, m) => sum + m.size, 0),
      totalViews: allMedia.reduce((sum, m) => sum + (this.mediaAnalytics.get(m.id)?.viewCount || 0), 0),
      categories: this.mediaCategories.size,
      libraries: this.mediaLibraries.size
    };
  }
}

export default MediaManager;
