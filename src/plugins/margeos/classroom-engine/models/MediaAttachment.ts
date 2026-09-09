/**
 * MediaAttachment.ts
 *
 * Model for MediaAttachment entity with types, metadata, and permissions.
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface MediaPermissions {
  canView: boolean;
  canDownload: boolean;
  canShare: boolean;
  canDelete: boolean;
}

export interface EducationalContext {
  subject?: string;
  topic?: string;
  gradeLevel?: string;
  relatedConcepts?: string[];
  source?: string;
  license?: string;
}

export interface MediaAttachment {
  id: string;
  classroomId: string;
  channelId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  status: MediaStatus;
  uploadedBy: string;
  uploadedByName: string;
  views: string[];
  viewCount: number;
  downloads: string[];
  downloadCount: number;
  description?: string;
  tags: string[];
  permissions: MediaPermissions;
  educationalContext?: EducationalContext;
  metadata?: Record<string, any>;
  processedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Factory functions
 */

export function getMediaPermissions(): MediaPermissions {
  return {
    canView: true,
    canDownload: true,
    canShare: true,
    canDelete: false
  };
}

export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  return 'other';
}

export function createMediaAttachment(
  classroomId: string,
  channelId: string,
  name: string,
  mimeType: string,
  size: number,
  uploadedBy: string,
  uploadedByName: string,
  educationalContext?: EducationalContext
): MediaAttachment {
  return {
    id: `MED-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    channelId,
    name,
    type: mimeType,
    size,
    url: '',
    status: 'uploading',
    uploadedBy,
    uploadedByName,
    views: [],
    viewCount: 0,
    downloads: [],
    downloadCount: 0,
    tags: [],
    permissions: getMediaPermissions(),
    educationalContext,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createImageAttachment(
  classroomId: string,
  channelId: string,
  name: string,
  url: string,
  size: number,
  width: number,
  height: number,
  uploadedBy: string,
  uploadedByName: string,
  thumbnailUrl?: string
): MediaAttachment {
  const attachment = createMediaAttachment(
    classroomId,
    channelId,
    name,
    'image/jpeg',
    size,
    uploadedBy,
    uploadedByName
  );

  attachment.url = url;
  attachment.thumbnailUrl = thumbnailUrl || url;
  attachment.status = 'ready';
  attachment.metadata = { width, height };

  return attachment;
}

export function createPDFAttachment(
  classroomId: string,
  channelId: string,
  name: string,
  url: string,
  size: number,
  uploadedBy: string,
  uploadedByName: string,
  pageCount?: number
): MediaAttachment {
  const attachment = createMediaAttachment(
    classroomId,
    channelId,
    name,
    'application/pdf',
    size,
    uploadedBy,
    uploadedByName
  );

  attachment.url = url;
  attachment.status = 'ready';
  if (pageCount) {
    attachment.metadata = { pageCount };
  }

  return attachment;
}

export function createVoiceNoteAttachment(
  classroomId: string,
  channelId: string,
  name: string,
  url: string,
  size: number,
  duration: number,
  uploadedBy: string,
  uploadedByName: string
): MediaAttachment {
  const attachment = createMediaAttachment(
    classroomId,
    channelId,
    name,
    'audio/webm',
    size,
    uploadedBy,
    uploadedByName
  );

  attachment.url = url;
  attachment.status = 'ready';
  attachment.metadata = { duration };

  return attachment;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export function isPDFFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function isDocumentFile(mimeType: string): boolean {
  return (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('text') ||
    mimeType.includes('pdf')
  );
}
