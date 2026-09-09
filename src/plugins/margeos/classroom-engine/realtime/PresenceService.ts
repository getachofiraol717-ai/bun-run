// @ts-nocheck
/**
 * PresenceService.ts
 *
 * Service for managing real-time user presence.
 */

import { PresenceEngine } from '../engines';

export interface PresenceUpdate {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  classroomId: string;
  channelId?: string;
  lastSeen: string;
}

export interface PresenceChange {
  type: 'status_change' | 'channel_change' | 'typing_start' | 'typing_stop';
  userId: string;
  userName: string;
  classroomId: string;
  data: any;
  timestamp: string;
}

type PresenceCallback = (update: PresenceUpdate) => void;
type PresenceChangeCallback = (change: PresenceChange) => void;

class PresenceService {
  private static instance: PresenceService;
  private presenceEngine: PresenceEngine;
  private presenceCallbacks: Map<string, Set<PresenceCallback>> = new Map();
  private changeCallbacks: Set<PresenceChangeCallback> = new Set();
  private updateInterval?: NodeJS.Timeout;
  private localUserId?: string;
  private localClassroomId?: string;

  private constructor() {
    this.presenceEngine = PresenceEngine.getInstance();
  }

  static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  async initialize(): Promise<void> {
    await this.presenceEngine.initialize();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.presenceEngine.subscribe('presenceChanged', (presence: any) => {
      const update: PresenceUpdate = {
        userId: presence.userId,
        userName: presence.userId, // Would need to resolve name
        status: presence.status,
        classroomId: presence.classroomId || '',
        channelId: presence.channelId,
        lastSeen: presence.lastSeen
      };

      this.notifyPresenceChange({
        type: 'status_change',
        userId: presence.userId,
        userName: update.userName,
        classroomId: presence.classroomId || '',
        data: { status: presence.status },
        timestamp: new Date().toISOString()
      });
    });

    this.presenceEngine.subscribe('channelChanged', (data: any) => {
      this.notifyPresenceChange({
        type: 'channel_change',
        userId: data.userId,
        userName: data.userId,
        classroomId: data.classroomId,
        data: { channelId: data.channelId },
        timestamp: new Date().toISOString()
      });
    });
  }

  // Local User Presence
  setLocalUser(userId: string, classroomId: string): void {
    this.localUserId = userId;
    this.localClassroomId = classroomId;
    this.presenceEngine.setUserOnline(userId, classroomId);
    this.startUpdateLoop();
  }

  updateLocalChannel(channelId: string): void {
    if (this.localUserId && this.localClassroomId) {
      this.presenceEngine.updateCurrentChannel(this.localUserId, this.localClassroomId, channelId);
    }
  }

  setLocalStatus(status: 'online' | 'away' | 'busy'): void {
    if (this.localUserId && this.localClassroomId) {
      this.presenceEngine.updatePresenceStatus(this.localUserId, this.localClassroomId, status);
    }
  }

  goOffline(): void {
    if (this.localUserId && this.localClassroomId) {
      this.presenceEngine.setUserOffline(this.localUserId, this.localClassroomId);
      this.stopUpdateLoop();
    }
  }

  // Presence Queries
  getUserPresence(userId: string, classroomId: string): any {
    return this.presenceEngine.getPresence(userId, classroomId);
  }

  getClassroomPresence(classroomId: string): PresenceUpdate[] {
    const presenceList = this.presenceEngine.getClassroomPresence(classroomId);
    return presenceList.map(p => ({
      userId: p.userId,
      userName: p.userId,
      status: p.status,
      classroomId: p.classroomId || classroomId,
      channelId: p.channelId,
      lastSeen: p.lastSeen
    }));
  }

  getOnlineUsers(classroomId: string): string[] {
    return this.presenceEngine.getOnlineUsers(classroomId);
  }

  getOnlineCount(classroomId: string): number {
    return this.getOnlineUsers(classroomId).length;
  }

  // Presence Subscriptions
  subscribeToPresence(classroomId: string, callback: PresenceCallback): () => void {
    if (!this.presenceCallbacks.has(classroomId)) {
      this.presenceCallbacks.set(classroomId, new Set());
    }
    this.presenceCallbacks.get(classroomId)!.add(callback);

    return () => {
      this.presenceCallbacks.get(classroomId)?.delete(callback);
    };
  }

  subscribeToChanges(callback: PresenceChangeCallback): () => void {
    this.changeCallbacks.add(callback);
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  private notifyPresenceChange(change: PresenceChange): void {
    // Notify global change listeners
    this.changeCallbacks.forEach(callback => {
      try {
        callback(change);
      } catch (error) {
        console.error('Error in presence change callback:', error);
      }
    });
  }

  // Typing Indicators
  startTyping(channelId: string, userName: string): void {
    if (this.localUserId) {
      this.presenceEngine.startTyping(this.localUserId, userName, channelId);
    }
  }

  stopTyping(channelId: string): void {
    if (this.localUserId) {
      this.presenceEngine.stopTyping(this.localUserId, channelId);
    }
  }

  getTypingUsers(channelId: string): Array<{ userId: string; userName: string }> {
    return this.presenceEngine.getTypingUsers(channelId).map(u => ({
      userId: u.userId,
      userName: u.userName
    }));
  }

  isUserTyping(userId: string, channelId: string): boolean {
    return this.presenceEngine.isUserTyping(userId, channelId);
  }

  // Update Loop (for activity tracking)
  private startUpdateLoop(): void {
    this.stopUpdateLoop();

    this.updateInterval = setInterval(() => {
      if (this.localUserId && this.localClassroomId) {
        // Simulate activity update
        this.presenceEngine.setUserOnline(this.localUserId, this.localClassroomId);
      }
    }, 30000); // Every 30 seconds
  }

  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  // Cleanup
  destroy(): void {
    this.goOffline();
    this.presenceCallbacks.clear();
    this.changeCallbacks.clear();
  }
}

export default PresenceService;
