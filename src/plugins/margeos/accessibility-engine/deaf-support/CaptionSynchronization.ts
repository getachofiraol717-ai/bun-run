// Accessibility Engine — Caption Synchronization
// Synchronizes captions with content playback

import type { Caption, CaptionSegment } from "../models/Caption";

export interface SyncPoint {
  time: number;
  segmentIndex: number;
  contentId: string;
}

export interface CaptionSyncConfig {
  offset: number; // ms offset for sync adjustment
  autoSync: boolean;
  syncTolerance: number; // ms tolerance for sync
  previewAhead: number; // ms to preview ahead
  previewBehind: number; // ms to keep behind
}

export class CaptionSynchronization {
  private config: CaptionSyncConfig = {
    offset: 0,
    autoSync: true,
    syncTolerance: 200,
    previewAhead: 500,
    previewBehind: 1000
  };

  private syncPoints: SyncPoint[] = [];
  private currentCaption: Caption | null = null;
  private listeners: Set<(segment: CaptionSegment | null) => void> = new Set();

  // Set caption content
  setCaption(caption: Caption): void {
    this.currentCaption = caption;
    this.generateSyncPoints();
  }

  // Generate sync points from caption
  private generateSyncPoints(): void {
    if (!this.currentCaption) return;

    this.syncPoints = [];

    for (let i = 0; i < this.currentCaption.segments.length; i++) {
      const segment = this.currentCaption.segments[i];
      this.syncPoints.push({
        time: segment.startTime + this.config.offset,
        segmentIndex: i,
        contentId: this.currentCaption.id
      });
    }
  }

  // Get segment at current time
  getSegmentAtTime(currentTime: number): CaptionSegment | null {
    if (!this.currentCaption) return null;

    const adjustedTime = currentTime + this.config.offset;

    for (let i = this.syncPoints.length - 1; i >= 0; i--) {
      const syncPoint = this.syncPoints[i];
      const segment = this.currentCaption.segments[syncPoint.segmentIndex];

      if (adjustedTime >= syncPoint.time && adjustedTime <= segment.endTime) {
        return segment;
      }

      // Look ahead
      if (i < this.syncPoints.length - 1) {
        const nextSyncPoint = this.syncPoints[i + 1];
        if (adjustedTime >= syncPoint.time && adjustedTime < nextSyncPoint.time) {
          return segment;
        }
      }
    }

    // Return first segment if before start
    if (adjustedTime < this.syncPoints[0]?.time) {
      return this.currentCaption.segments[0] || null;
    }

    // Return last segment if after end
    const lastSegment = this.currentCaption.segments[this.currentCaption.segments.length - 1];
    if (adjustedTime > lastSegment?.endTime) {
      return lastSegment;
    }

    return null;
  }

  // Get segments in time range
  getSegmentsInRange(startTime: number, endTime: number): CaptionSegment[] {
    if (!this.currentCaption) return [];

    const adjustedStart = startTime + this.config.offset;
    const adjustedEnd = endTime + this.config.offset;

    return this.currentCaption.segments.filter(segment => {
      return segment.startTime <= adjustedEnd && segment.endTime >= adjustedStart;
    });
  }

  // Get upcoming segments
  getUpcomingSegments(currentTime: number, count: number = 3): CaptionSegment[] {
    if (!this.currentCaption) return [];

    const currentSegment = this.getSegmentAtTime(currentTime);
    if (!currentSegment) return [];

    const currentIndex = this.currentCaption.segments.indexOf(currentSegment);
    const upcoming: CaptionSegment[] = [];

    for (let i = 1; i <= count && currentIndex + i < this.currentCaption.segments.length; i++) {
      upcoming.push(this.currentCaption.segments[currentIndex + i]);
    }

    return upcoming;
  }

  // Get recent segments
  getRecentSegments(currentTime: number, count: number = 3): CaptionSegment[] {
    if (!this.currentCaption) return [];

    const currentSegment = this.getSegmentAtTime(currentTime);
    if (!currentSegment) return [];

    const currentIndex = this.currentCaption.segments.indexOf(currentSegment);
    const recent: CaptionSegment[] = [];

    for (let i = 1; i <= count && currentIndex - i >= 0; i++) {
      recent.unshift(this.currentCaption.segments[currentIndex - i]);
    }

    return recent;
  }

  // Adjust offset
  setOffset(offset: number): void {
    this.config.offset = offset;
    this.generateSyncPoints();
  }

  // Auto-sync with content
  autoSync(contentDuration: number): void {
    if (!this.currentCaption) return;

    // Calculate optimal offset
    const captionDuration = this.currentCaption.duration;
    const durationDiff = contentDuration - captionDuration;

    if (Math.abs(durationDiff) > this.config.syncTolerance) {
      // Adjust offset to align end times
      this.config.offset = Math.round(durationDiff / 2);
      this.generateSyncPoints();
    }
  }

  // Manual sync point
  setSyncPoint(captionTime: number, contentTime: number): void {
    this.config.offset = contentTime - captionTime;
    this.generateSyncPoints();
  }

  // Reset to default offset
  resetSync(): void {
    this.config.offset = 0;
    this.generateSyncPoints();
  }

  // Get current offset
  getOffset(): number {
    return this.config.offset;
  }

  // Get config
  getConfig(): CaptionSyncConfig {
    return { ...this.config };
  }

  // Update config
  updateConfig(config: Partial<CaptionSyncConfig>): void {
    this.config = { ...this.config, ...config };
    this.generateSyncPoints();
  }

  // Clear caption
  clearCaption(): void {
    this.currentCaption = null;
    this.syncPoints = [];
  }

  // Export sync data
  exportSyncData(): { offset: number; syncPoints: SyncPoint[] } {
    return {
      offset: this.config.offset,
      syncPoints: [...this.syncPoints]
    };
  }

  // Import sync data
  importSyncData(data: { offset: number; syncPoints?: SyncPoint[] }): void {
    this.config.offset = data.offset;
    if (data.syncPoints) {
      this.syncPoints = [...data.syncPoints];
    } else {
      this.generateSyncPoints();
    }
  }

  // Subscribe to segment changes
  subscribe(listener: (segment: CaptionSegment | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  notifyListeners(segment: CaptionSegment | null): void {
    for (const listener of this.listeners) {
      listener(segment);
    }
  }

  // Utility: Merge overlapping segments
  mergeOverlappingSegments(segments: CaptionSegment[], maxGap: number = 100): CaptionSegment[] {
    if (segments.length <= 1) return segments;

    const merged: CaptionSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i];

      // Check if should merge
      if (next.startTime - current.endTime <= maxGap) {
        // Merge
        current.endTime = Math.max(current.endTime, next.endTime);
        current.duration = current.endTime - current.startTime;
        current.text = current.text + " " + next.text;
      } else {
        // Push current and start new
        merged.push(current);
        current = { ...next };
      }
    }

    merged.push(current);
    return merged;
  }

  // Utility: Split long segments
  splitLongSegments(segments: CaptionSegment[], maxDuration: number = 5000): CaptionSegment[] {
    const split: CaptionSegment[] = [];

    for (const segment of segments) {
      if (segment.duration <= maxDuration) {
        split.push(segment);
      } else {
        // Split into multiple segments
        const wordCount = segment.text.split(/\s+/).length;
        const numParts = Math.ceil(segment.duration / maxDuration);
        const wordsPerPart = Math.ceil(wordCount / numParts);
        const words = segment.text.split(/\s+/);

        let currentIndex = 0;
        let currentTime = segment.startTime;
        const timePerWord = segment.duration / wordCount;

        for (let p = 0; p < numParts; p++) {
          const partWords = words.slice(currentIndex, currentIndex + wordsPerPart);
          const partDuration = partWords.length * timePerWord;

          if (partWords.length > 0) {
            split.push({
              id: `${segment.id}-part-${p}`,
              text: partWords.join(" "),
              startTime: currentTime,
              endTime: currentTime + partDuration,
              duration: partDuration,
              position: { x: 0, y: 0, width: 0, height: 0 }
            });

            currentTime += partDuration;
            currentIndex += wordsPerPart;
          }
        }
      }
    }

    return split;
  }
}

// Export singleton
export const captionSynchronization = new CaptionSynchronization();
