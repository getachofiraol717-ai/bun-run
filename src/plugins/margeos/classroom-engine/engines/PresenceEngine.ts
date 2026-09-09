/**
 * PresenceEngine.ts
 *
 * Comprehensive engine for managing user presence, online status,
 * typing indicators, read receipts, session tracking, and
 * multi-device support for classroom communications.
 */

const STORAGE_KEY = 'presence_engine_data';
const SESSION_HISTORY_KEY = 'presence_sessions';
const DEVICE_KEY = 'presence_devices';

export interface PresenceEngineConfig {
  updateInterval?: number;
  idleTimeout?: number;
  awayTimeout?: number;
  enableTypingIndicators?: boolean;
  enableReadReceipts?: boolean;
  enableSessionTracking?: boolean;
  enableDeviceTracking?: boolean;
  enableActivityMetrics?: boolean;
  maxSessionHistory?: number;
  typingTimeout?: number;
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: string;
  firstSeen?: string;
  classroomId?: string;
  channelId?: string;
  deviceType?: DeviceType;
  deviceId?: string;
  browser?: string;
  os?: string;
  isTyping: boolean;
  typingChannelId?: string;
  customStatus?: string;
  customStatusExpiresAt?: string;
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'do_not_disturb' | 'offline' | 'invisible';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface TypingUser {
  userId: string;
  userName: string;
  channelId: string;
  startedAt: string;
  timeoutId?: ReturnType<typeof setTimeout>;
  messagePreview?: string;
  characterCount?: number;
}

export interface ReadReceipt {
  userId: string;
  messageId: string;
  readAt: string;
  channelId: string;
}

export interface Session {
  id: string;
  userId: string;
  classroomId?: string;
  channelId?: string;
  startTime: string;
  endTime?: string;
  deviceType: DeviceType;
  deviceId: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  duration?: number;
  messageCount: number;
  actions: SessionAction[];
}

export interface SessionAction {
  type: 'message' | 'reaction' | 'media' | 'thread' | 'channel_switch' | 'classroom_join' | 'classroom_leave';
  timestamp: string;
  channelId?: string;
  metadata?: Record<string, any>;
}

export interface Device {
  id: string;
  userId: string;
  type: DeviceType;
  name: string;
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
  notificationsEnabled: boolean;
  pushEnabled: boolean;
}

export interface ActivityMetrics {
  userId: string;
  date: string;
  onlineMinutes: number;
  activeMinutes: number;
  idleMinutes: number;
  messageCount: number;
  channelVisits: Record<string, number>;
  peakActivityHour: number;
  averageResponseTime: number;
}

export interface PresenceFilter {
  classroomId?: string;
  channelId?: string;
  status?: PresenceStatus[];
  deviceType?: DeviceType[];
}

export interface PresenceHistory {
  userId: string;
  records: PresenceRecord[];
}

export interface PresenceRecord {
  status: PresenceStatus;
  timestamp: string;
  classroomId?: string;
  channelId?: string;
}

class PresenceEngine {
  private static instance: PresenceEngine;
  private presence: Map<string, UserPresence> = new Map();
  private userClassrooms: Map<string, Map<string, string>> = new Map();
  private typingUsers: Map<string, TypingUser> = new Map();
  private readReceipts: Map<string, ReadReceipt[]> = new Map();
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, string[]> = new Map();
  private devices: Map<string, Device> = new Map();
  private userDevices: Map<string, string[]> = new Map();
  private activityMetrics: Map<string, ActivityMetrics> = new Map();
  private presenceHistory: Map<string, PresenceHistory> = new Map();
  private config: PresenceEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private currentSessionId?: string;
  private lastActivityTime: number = Date.now();

  private constructor(config: PresenceEngineConfig = {}) {
    this.config = {
      updateInterval: config.updateInterval || 30000,
      idleTimeout: config.idleTimeout || 300000,
      awayTimeout: config.awayTimeout || 600000,
      enableTypingIndicators: config.enableTypingIndicators !== false,
      enableReadReceipts: config.enableReadReceipts !== false,
      enableSessionTracking: config.enableSessionTracking !== false,
      enableDeviceTracking: config.enableDeviceTracking !== false,
      enableActivityMetrics: config.enableActivityMetrics !== false,
      maxSessionHistory: config.maxSessionHistory || 100,
      typingTimeout: config.typingTimeout || 5000
    };
  }

  static getInstance(config?: PresenceEngineConfig): PresenceEngine {
    if (!PresenceEngine.instance) {
      PresenceEngine.instance = new PresenceEngine(config);
    }
    return PresenceEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.startHeartbeat();
    this.startActivityTracker();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.presence = new Map(Object.entries(data.presence || {}));
        this.sessions = new Map(Object.entries(data.sessions || {}));
        this.userSessions = new Map(Object.entries(data.userSessions || {}));
        this.devices = new Map(Object.entries(data.devices || {}));
        this.userDevices = new Map(Object.entries(data.userDevices || {}));
        this.activityMetrics = new Map(Object.entries(data.activityMetrics || {}));
      }
    } catch (error) {
      console.error('Failed to load presence data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        presence: Object.fromEntries(this.presence),
        sessions: Object.fromEntries(this.sessions),
        userSessions: Object.fromEntries(this.userSessions),
        devices: Object.fromEntries(this.devices),
        userDevices: Object.fromEntries(this.userDevices),
        activityMetrics: Object.fromEntries(this.activityMetrics)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save presence data:', error);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.checkPresenceStatus();
      this.checkExpiredSessions();
      this.updateActivityMetrics();
    }, this.config.updateInterval!);
  }

  private startActivityTracker(): void {
    if (typeof window !== 'undefined') {
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

      const handleActivity = () => {
        this.lastActivityTime = Date.now();
      };

      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });
    }
  }

  private checkPresenceStatus(): void {
    const now = Date.now();

    this.presence.forEach((p, key) => {
      if (p.status === 'online') {
        const lastSeenTime = new Date(p.lastSeen).getTime();
        const timeSinceLastSeen = now - lastSeenTime;

        if (timeSinceLastSeen > this.config.awayTimeout!) {
          this.updatePresenceStatus(p.userId, p.classroomId!, 'offline');
        } else if (timeSinceLastSeen > this.config.idleTimeout!) {
          this.updatePresenceStatus(p.userId, p.classroomId!, 'away');
        }
      }
    });
  }

  private checkExpiredSessions(): void {
    if (!this.config.enableSessionTracking) return;

    this.sessions.forEach((session, id) => {
      if (!session.endTime) {
        const lastActivity = this.lastActivityTime;
        const timeSinceActivity = Date.now() - lastActivity;

        if (timeSinceActivity > this.config.awayTimeout!) {
          this.endSession(id);
        }
      }
    });
  }

  private updateActivityMetrics(): void {
    if (!this.config.enableActivityMetrics) return;

    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

    this.presence.forEach((p) => {
      const metricId = `${p.userId}:${dateKey}`;
      let metric = this.activityMetrics.get(metricId);

      if (!metric) {
        metric = {
          userId: p.userId,
          date: dateKey,
          onlineMinutes: 0,
          activeMinutes: 0,
          idleMinutes: 0,
          messageCount: 0,
          channelVisits: {},
          peakActivityHour: now.getHours(),
          averageResponseTime: 0
        };
        this.activityMetrics.set(metricId, metric);
      }

      if (p.status === 'online') {
        metric.onlineMinutes += Math.floor(this.config.updateInterval! / 60000);

        const timeSinceActivity = Date.now() - this.lastActivityTime;
        if (timeSinceActivity < this.config.idleTimeout!) {
          metric.activeMinutes += Math.floor(this.config.updateInterval! / 60000);
        } else {
          metric.idleMinutes += Math.floor(this.config.updateInterval! / 60000);
        }
      }
    });

    this.saveToStorage();
  }

  private getPresenceKey(userId: string, classroomId?: string): string {
    return classroomId ? `${userId}:${classroomId}` : userId;
  }

  setUserOnline(userId: string, classroomId?: string, channelId?: string, deviceInfo?: { type?: DeviceType; browser?: string; os?: string }): UserPresence {
    const key = this.getPresenceKey(userId, classroomId);
    const now = new Date().toISOString();

    const presence: UserPresence = {
      userId,
      status: 'online',
      lastSeen: now,
      classroomId,
      channelId,
      isTyping: false,
      firstSeen: this.presence.get(key)?.firstSeen || now
    };

    if (deviceInfo) {
      if (deviceInfo.type) presence.deviceType = deviceInfo.type;
      if (deviceInfo.browser) presence.browser = deviceInfo.browser;
      if (deviceInfo.os) presence.os = deviceInfo.os;
    }

    this.presence.set(key, presence);

    this.addPresenceHistory(userId, 'online', classroomId, channelId);

    if (this.config.enableDeviceTracking && deviceInfo?.type) {
      this.trackDevice(userId, deviceInfo.type, deviceInfo.browser, deviceInfo.os);
    }

    if (this.config.enableSessionTracking) {
      this.startSession(userId, classroomId, channelId, deviceInfo);
    }

    this.saveToStorage();
    this.emit('presenceChanged', presence);
    return presence;
  }

  setUserOffline(userId: string, classroomId?: string): void {
    const key = this.getPresenceKey(userId, classroomId);
    const presence = this.presence.get(key);

    if (presence) {
      presence.status = 'offline';
      presence.lastSeen = new Date().toISOString();
      presence.isTyping = false;

      this.addPresenceHistory(userId, 'offline', classroomId, presence.channelId);

      if (this.currentSessionId) {
        this.endSession(this.currentSessionId);
      }

      this.saveToStorage();
      this.emit('presenceChanged', presence);
    }
  }

  updatePresenceStatus(userId: string, classroomId: string, status: PresenceStatus): UserPresence | undefined {
    const key = this.getPresenceKey(userId, classroomId);
    const presence = this.presence.get(key);

    if (presence) {
      const previousStatus = presence.status;
      presence.status = status;
      presence.lastSeen = new Date().toISOString();

      this.addPresenceHistory(userId, status, classroomId, presence.channelId);

      this.saveToStorage();
      this.emit('presenceChanged', presence);
      this.emit(`status:${status}`, presence);

      if (previousStatus !== status) {
        this.emit('statusChanged', { userId, previousStatus, currentStatus: status });
      }

      return presence;
    }

    return undefined;
  }

  setCustomStatus(userId: string, classroomId: string, status: string, expiresIn?: number): void {
    const key = this.getPresenceKey(userId, classroomId);
    const presence = this.presence.get(key);

    if (presence) {
      presence.customStatus = status;

      if (expiresIn) {
        presence.customStatusExpiresAt = new Date(Date.now() + expiresIn).toISOString();
      }

      this.saveToStorage();
      this.emit('customStatusSet', { userId, status, expiresAt: presence.customStatusExpiresAt });
    }
  }

  clearCustomStatus(userId: string, classroomId: string): void {
    const key = this.getPresenceKey(userId, classroomId);
    const presence = this.presence.get(key);

    if (presence) {
      presence.customStatus = undefined;
      presence.customStatusExpiresAt = undefined;

      this.saveToStorage();
      this.emit('customStatusCleared', { userId });
    }
  }

  updateCurrentChannel(userId: string, classroomId: string, channelId: string): void {
    const key = this.getPresenceKey(userId, classroomId);
    const presence = this.presence.get(key);

    if (presence) {
      const previousChannelId = presence.channelId;
      presence.channelId = channelId;
      presence.lastSeen = new Date().toISOString();

      this.addPresenceHistory(userId, presence.status, classroomId, channelId);

      this.saveToStorage();
      this.emit('channelChanged', { userId, classroomId, channelId, previousChannelId });

      if (this.config.enableSessionTracking) {
        this.recordSessionAction(this.currentSessionId!, 'channel_switch', channelId);
      }
    }
  }

  updateDeviceType(userId: string, classroomId: string, deviceType: DeviceType): void {
    const key = this.getPresenceKey(userId, classroomId);
    const presence = this.presence.get(key);

    if (presence) {
      presence.deviceType = deviceType;
      this.saveToStorage();
      this.emit('deviceTypeChanged', { userId, deviceType });
    }
  }

  getPresence(userId: string, classroomId?: string): UserPresence | undefined {
    const key = this.getPresenceKey(userId, classroomId);
    return this.presence.get(key);
  }

  getPresenceForFilter(filter: PresenceFilter): UserPresence[] {
    let results: UserPresence[] = [];

    this.presence.forEach((p) => {
      if (filter.classroomId && p.classroomId !== filter.classroomId) return;
      if (filter.channelId && p.channelId !== filter.channelId) return;
      if (filter.status && !filter.status.includes(p.status)) return;
      if (filter.deviceType && !filter.deviceType.includes(p.deviceType || 'unknown')) return;

      results.push(p);
    });

    return results;
  }

  getClassroomPresence(classroomId: string): UserPresence[] {
    return this.getPresenceForFilter({ classroomId, status: ['online', 'away', 'busy', 'do_not_disturb'] });
  }

  getOnlineUsers(classroomId: string): string[] {
    return this.getClassroomPresence(classroomId)
      .filter(p => p.status === 'online')
      .map(p => p.userId);
  }

  getAwayUsers(classroomId: string): string[] {
    return this.getClassroomPresence(classroomId)
      .filter(p => p.status === 'away')
      .map(p => p.userId);
  }

  getAllOnlineUsers(): UserPresence[] {
    return Array.from(this.presence.values())
      .filter(p => p.status === 'online')
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }

  private addPresenceHistory(userId: string, status: PresenceStatus, classroomId?: string, channelId?: string): void {
    let history = this.presenceHistory.get(userId);

    if (!history) {
      history = { userId, records: [] };
      this.presenceHistory.set(userId, history);
    }

    const record: PresenceRecord = {
      status,
      timestamp: new Date().toISOString(),
      classroomId,
      channelId
    };

    history.records.push(record);

    if (history.records.length > 1000) {
      history.records = history.records.slice(-1000);
    }
  }

  getPresenceHistory(userId: string, limit?: number): PresenceRecord[] {
    const history = this.presenceHistory.get(userId);
    if (!history) return [];

    const records = history.records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return limit ? records.slice(0, limit) : records;
  }

  getPresenceStats(userId: string, days: number = 7): { totalOnline: number; averagePerDay: number; peakHour: number } {
    const history = this.presenceHistory.get(userId);
    if (!history) return { totalOnline: 0, averagePerDay: 0, peakHour: 0 };

    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const recentRecords = history.records.filter(r => new Date(r.timestamp).getTime() >= cutoff);
    const onlineRecords = recentRecords.filter(r => r.status === 'online');

    const hourCounts: Record<number, number> = {};
    recentRecords.forEach(r => {
      const hour = new Date(r.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = 0;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });

    return {
      totalOnline: onlineRecords.length,
      averagePerDay: Math.round(onlineRecords.length / days * 10) / 10,
      peakHour
    };
  }

  // Typing Indicators
  startTyping(userId: string, userName: string, channelId: string, messagePreview?: string): void {
    if (!this.config.enableTypingIndicators) return;

    const key = `${userId}:${channelId}`;
    let typingUser = this.typingUsers.get(key);

    if (typingUser?.timeoutId) {
      clearTimeout(typingUser.timeoutId);
    }

    typingUser = {
      userId,
      userName,
      channelId,
      startedAt: new Date().toISOString(),
      messagePreview,
      characterCount: messagePreview?.length
    };

    typingUser.timeoutId = setTimeout(() => {
      this.stopTyping(userId, channelId);
    }, this.config.typingTimeout!);

    this.typingUsers.set(key, typingUser);
    this.emit('userStartedTyping', typingUser);

    const presenceKey = this.getPresenceKey(userId);
    const presence = this.presence.get(presenceKey);
    if (presence) {
      presence.isTyping = true;
      presence.typingChannelId = channelId;
    }
  }

  stopTyping(userId: string, channelId: string): void {
    const key = `${userId}:${channelId}`;
    const typingUser = this.typingUsers.get(key);

    if (typingUser) {
      if (typingUser.timeoutId) {
        clearTimeout(typingUser.timeoutId);
      }
      this.typingUsers.delete(key);
      this.emit('userStoppedTyping', { userId, channelId });

      const presenceKey = this.getPresenceKey(userId);
      const presence = this.presence.get(presenceKey);
      if (presence) {
        presence.isTyping = false;
        presence.typingChannelId = undefined;
      }
    }
  }

  getTypingUsers(channelId: string): TypingUser[] {
    const users: TypingUser[] = [];

    this.typingUsers.forEach((u) => {
      if (u.channelId === channelId) {
        users.push(u);
      }
    });

    return users;
  }

  getTypingUserCount(channelId: string): number {
    return this.getTypingUsers(channelId).length;
  }

  isUserTyping(userId: string, channelId: string): boolean {
    const key = `${userId}:${channelId}`;
    return this.typingUsers.has(key);
  }

  getTypingPreview(channelId: string): string {
    const typingUsers = this.getTypingUsers(channelId);

    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0].userName} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;

    return `${typingUsers.length} people are typing...`;
  }

  // Read Receipts
  markAsRead(userId: string, channelId: string, messageId: string): void {
    if (!this.config.enableReadReceipts) return;

    const receipts = this.readReceipts.get(channelId) || [];

    const existingIndex = receipts.findIndex(r => r.userId === userId);
    if (existingIndex > -1) {
      receipts.splice(existingIndex, 1);
    }

    receipts.push({
      userId,
      messageId,
      readAt: new Date().toISOString(),
      channelId
    });

    if (receipts.length > 100) {
      receipts.shift();
    }

    this.readReceipts.set(channelId, receipts);
    this.emit('messageRead', { userId, channelId, messageId });
  }

  markMultipleAsRead(userId: string, channelId: string, messageIds: string[]): void {
    messageIds.forEach(messageId => {
      this.markAsRead(userId, channelId, messageId);
    });
  }

  getReadReceipts(channelId: string): ReadReceipt[] {
    return this.readReceipts.get(channelId) || [];
  }

  getLastReadMessageId(channelId: string, userId: string): string | undefined {
    const receipts = this.readReceipts.get(channelId) || [];
    const userReceipt = receipts.find(r => r.userId === userId);
    return userReceipt?.messageId;
  }

  getUnreadMessageIds(channelId: string, userId: string, allMessageIds: string[]): string[] {
    const lastReadId = this.getLastReadMessageId(channelId, userId);
    if (!lastReadId) return allMessageIds;

    const lastReadIndex = allMessageIds.indexOf(lastReadId);
    if (lastReadIndex === -1) return allMessageIds;

    return allMessageIds.slice(lastReadIndex + 1);
  }

  hasReadReceipt(channelId: string, userId: string, messageId: string): boolean {
    const receipts = this.readReceipts.get(channelId) || [];
    return receipts.some(r => r.userId === userId && r.messageId === messageId);
  }

  getChannelReaders(channelId: string): string[] {
    const receipts = this.readReceipts.get(channelId) || [];
    return [...new Set(receipts.map(r => r.userId))];
  }

  clearReadReceipts(channelId: string): void {
    this.readReceipts.delete(channelId);
    this.emit('readReceiptsCleared', { channelId });
  }

  // Session Management
  startSession(userId: string, classroomId?: string, channelId?: string, deviceInfo?: { type?: DeviceType; browser?: string; os?: string }): Session {
    if (!this.config.enableSessionTracking) {
      throw new Error('Session tracking is disabled');
    }

    const deviceId = this.getOrCreateDeviceId(userId, deviceInfo?.type);

    const session: Session = {
      id: `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      classroomId,
      channelId,
      startTime: new Date().toISOString(),
      deviceType: deviceInfo?.type || 'unknown',
      deviceId,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      messageCount: 0,
      actions: []
    };

    this.sessions.set(session.id, session);

    const userSessionIds = this.userSessions.get(userId) || [];
    userSessionIds.push(session.id);
    this.userSessions.set(userId, userSessionIds);

    if (classroomId) {
      this.recordSessionAction(session.id, 'classroom_join', undefined, { classroomId });
    }

    this.currentSessionId = session.id;
    this.saveToStorage();
    this.emit('sessionStarted', session);

    return session;
  }

  endSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || session.endTime) return undefined;

    session.endTime = new Date().toISOString();
    session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();

    this.saveToStorage();
    this.emit('sessionEnded', session);

    if (this.currentSessionId === sessionId) {
      this.currentSessionId = undefined;
    }

    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getUserSessions(userId: string, limit?: number): Session[] {
    const sessionIds = this.userSessions.get(userId) || [];
    let sessions = sessionIds
      .map(id => this.sessions.get(id))
      .filter((s): s is Session => s !== undefined)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return limit ? sessions.slice(0, limit) : sessions;
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values())
      .filter(s => !s.endTime)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getCurrentSession(): Session | undefined {
    if (!this.currentSessionId) return undefined;
    return this.sessions.get(this.currentSessionId);
  }

  recordSessionAction(sessionId: string, type: SessionAction['type'], channelId?: string, metadata?: Record<string, any>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const action: SessionAction = {
      type,
      timestamp: new Date().toISOString(),
      channelId,
      metadata
    };

    session.actions.push(action);

    if (type === 'message') {
      session.messageCount++;
    }

    this.saveToStorage();
  }

  getSessionActions(sessionId: string, type?: SessionAction['type']): SessionAction[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    if (type) {
      return session.actions.filter(a => a.type === type);
    }

    return session.actions;
  }

  private getOrCreateDeviceId(userId: string, type?: DeviceType): string {
    const deviceType = type || 'unknown';
    const existingDevices = this.userDevices.get(userId) || [];
    const deviceId = `${userId}:${deviceType}:${Date.now()}`;
    return deviceId;
  }

  // Device Management
  trackDevice(userId: string, type: DeviceType, browser?: string, os?: string): Device {
    if (!this.config.enableDeviceTracking) {
      throw new Error('Device tracking is disabled');
    }

    const deviceId = `${userId}:${type}:${Date.now()}`;

    const device: Device = {
      id: deviceId,
      userId,
      type,
      name: this.generateDeviceName(type, browser),
      browser: browser || 'Unknown',
      os: os || 'Unknown',
      lastActive: new Date().toISOString(),
      isCurrent: true,
      notificationsEnabled: true,
      pushEnabled: true
    };

    this.devices.set(deviceId, device);

    const userDeviceIds = this.userDevices.get(userId) || [];
    userDeviceIds.push(deviceId);
    this.userDevices.set(userId, userDeviceIds);

    const allDevices = Array.from(this.devices.values()).filter(d => d.userId === userId);
    allDevices.forEach(d => {
      if (d.id !== deviceId) {
        d.isCurrent = false;
      }
    });

    this.saveToStorage();
    this.emit('deviceTracked', device);

    return device;
  }

  private generateDeviceName(type: DeviceType, browser?: string): string {
    const browserName = browser?.split(' ')[0] || 'Browser';
    const typeNames: Record<DeviceType, string> = {
      desktop: 'Desktop',
      mobile: 'Mobile',
      tablet: 'Tablet',
      unknown: 'Device'
    };
    return `${typeNames[type]} - ${browserName}`;
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  getUserDevices(userId: string): Device[] {
    const deviceIds = this.userDevices.get(userId) || [];
    return deviceIds
      .map(id => this.devices.get(id))
      .filter((d): d is Device => d !== undefined)
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  }

  getCurrentDevice(userId: string): Device | undefined {
    return this.getUserDevices(userId).find(d => d.isCurrent);
  }

  updateDeviceSettings(deviceId: string, updates: Partial<Pick<Device, 'notificationsEnabled' | 'pushEnabled'>>): Device | undefined {
    const device = this.devices.get(deviceId);
    if (!device) return undefined;

    if (updates.notificationsEnabled !== undefined) {
      device.notificationsEnabled = updates.notificationsEnabled;
    }
    if (updates.pushEnabled !== undefined) {
      device.pushEnabled = updates.pushEnabled;
    }

    this.saveToStorage();
    this.emit('deviceSettingsUpdated', device);

    return device;
  }

  removeDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    this.devices.delete(deviceId);

    const userDeviceIds = this.userDevices.get(device.userId) || [];
    const filtered = userDeviceIds.filter(id => id !== deviceId);
    this.userDevices.set(device.userId, filtered);

    this.saveToStorage();
    this.emit('deviceRemoved', { deviceId, userId: device.userId });

    return true;
  }

  // Activity Metrics
  getActivityMetrics(userId: string, date?: string): ActivityMetrics | undefined {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const metricId = `${userId}:${targetDate}`;
    return this.activityMetrics.get(metricId);
  }

  getActivityHistory(userId: string, days: number = 7): ActivityMetrics[] {
    const metrics: ActivityMetrics[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const metricId = `${userId}:${dateKey}`;
      const metric = this.activityMetrics.get(metricId);

      if (metric) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  incrementMessageCount(userId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const metricId = `${userId}:${today}`;
    let metric = this.activityMetrics.get(metricId);

    if (!metric) {
      metric = {
        userId,
        date: today,
        onlineMinutes: 0,
        activeMinutes: 0,
        idleMinutes: 0,
        messageCount: 0,
        channelVisits: {},
        peakActivityHour: new Date().getHours(),
        averageResponseTime: 0
      };
      this.activityMetrics.set(metricId, metric);
    }

    metric.messageCount++;
    this.saveToStorage();
  }

  recordChannelVisit(userId: string, channelId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const metricId = `${userId}:${today}`;
    let metric = this.activityMetrics.get(metricId);

    if (!metric) {
      metric = {
        userId,
        date: today,
        onlineMinutes: 0,
        activeMinutes: 0,
        idleMinutes: 0,
        messageCount: 0,
        channelVisits: {},
        peakActivityHour: new Date().getHours(),
        averageResponseTime: 0
      };
      this.activityMetrics.set(metricId, metric);
    }

    metric.channelVisits[channelId] = (metric.channelVisits[channelId] || 0) + 1;
    this.saveToStorage();
  }

  // Clearing
  clearPresenceForClassroom(classroomId: string): void {
    const keysToDelete: string[] = [];

    this.presence.forEach((p, key) => {
      if (p.classroomId === classroomId) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      const presence = this.presence.get(key);
      if (presence) {
        this.addPresenceHistory(presence.userId, 'offline', classroomId, presence.channelId);
      }
      this.presence.delete(key);
    });

    this.saveToStorage();
    this.emit('classroomPresenceCleared', { classroomId });
  }

  clearUserPresence(userId: string, classroomId?: string): void {
    if (classroomId) {
      const key = this.getPresenceKey(userId, classroomId);
      const presence = this.presence.get(key);
      if (presence) {
        this.addPresenceHistory(userId, 'offline', classroomId, presence.channelId);
      }
      this.presence.delete(key);
    } else {
      const keysToDelete: string[] = [];

      this.presence.forEach((p, key) => {
        if (p.userId === userId) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => {
        const presence = this.presence.get(key);
        if (presence) {
          this.addPresenceHistory(userId, 'offline', presence.classroomId, presence.channelId);
        }
        this.presence.delete(key);
      });
    }

    this.saveToStorage();
    this.emit('userPresenceCleared', { userId, classroomId });
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

  // Statistics
  getStats(): {
    onlineUsers: number;
    typingUsers: number;
    activeSessions: number;
    totalDevices: number;
    presenceByStatus: Record<PresenceStatus, number>;
  } {
    const statusCounts: Record<PresenceStatus, number> = {
      online: 0,
      away: 0,
      busy: 0,
      do_not_disturb: 0,
      offline: 0,
      invisible: 0
    };

    this.presence.forEach(p => {
      statusCounts[p.status]++;
    });

    return {
      onlineUsers: statusCounts.online,
      typingUsers: this.typingUsers.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => !s.endTime).length,
      totalDevices: this.devices.size,
      presenceByStatus: statusCounts
    };
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

export default PresenceEngine;
