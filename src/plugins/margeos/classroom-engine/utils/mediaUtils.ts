/**
 * mediaUtils.ts
 *
 * Utility functions for media operations.
 */

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get file type category from MIME type
 */
export function getFileTypeCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('spreadsheet')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  return 'other';
}

/**
 * Get icon name for file type
 */
export function getFileIcon(mimeType: string): string {
  const category = getFileTypeCategory(mimeType);
  const icons: Record<string, string> = {
    image: 'image',
    video: 'video',
    audio: 'music',
    document: 'file-text',
    archive: 'archive',
    other: 'file'
  };
  return icons[category];
}

/**
 * Check if file type is supported
 */
export function isFileSupported(file: File): boolean {
  const supportedTypes = [
    'image/', 'video/', 'audio/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'text/'
  ];

  return supportedTypes.some(type => file.type.startsWith(type) || file.type.includes(type));
}

/**
 * Generate thumbnail URL for images
 */
export function generateThumbnail(dataUrl: string, maxSize: number = 200): string {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  }) as any;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number = 100 * 1024 * 1024): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatFileSize(maxSize)}`
    };
  }
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes?: string[]): { valid: boolean; error?: string } {
  if (!isFileSupported(file)) {
    return {
      valid: false,
      error: 'File type is not supported'
    };
  }

  if (allowedTypes && !allowedTypes.some(type => file.type.startsWith(type) || file.type.includes(type))) {
    return {
      valid: false,
      error: 'File type is not allowed'
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = getFileExtension(originalName);
  const baseName = originalName.replace(`.${ext}`, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseName}_${timestamp}_${random}.${ext}`;
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Get video thumbnail at specific time
 */
export function getVideoThumbnail(file: File, timeSeconds: number = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    video.onerror = () => reject(new Error('Failed to load video'));

    video.src = URL.createObjectURL(file);
  });
}
