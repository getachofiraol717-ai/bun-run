// @ts-nocheck
/**
 * TypingIndicator.ts
 *
 * Service for managing typing indicators in real-time.
 */

export interface TypingState {
  channelId: string;
  users: Map<string, {
    userId: string;
    userName: string;
    startedAt: string;
    timeoutId?: NodeJS.Timeout;
  }>;
}

type TypingCallback = (data: { channelId: string; userId: string; userName: string; isTyping: boolean }) => void;

class TypingIndicator {
  private static instance: TypingIndicator;
  private typingStates: Map<string, TypingState> = new Map();
  private callbacks: Set<TypingCallback> = new Set();
  private localUserId?: string;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly TYPING_TIMEOUT = 3000; // 3 seconds
  private readonly TYPING_DISPLAY_TIME = 2000; // Show for 2 seconds after stop

  private constructor() {}

  static getInstance(): TypingIndicator {
    if (!TypingIndicator.instance) {
      TypingIndicator.instance = new TypingIndicator();
    }
    return TypingIndicator.instance;
  }

  setLocalUser(userId: string): void {
    this.localUserId = userId;
  }

  // Start typing in a channel
  startTyping(channelId: string, userId: string, userName: string): void {
    // Don't track own typing for local display
    if (userId === this.localUserId) {
      return;
    }

    const existingTimeout = this.typingTimeouts.get(`${userId}:${channelId}`);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (!this.typingStates.has(channelId)) {
      this.typingStates.set(channelId, {
        channelId,
        users: new Map()
      });
    }

    const state = this.typingStates.get(channelId)!;

    // Remove existing entry if any
    if (state.users.has(userId)) {
      this.stopTyping(channelId, userId);
    }

    // Add new typing user
    const typingEntry = {
      userId,
      userName,
      startedAt: new Date().toISOString()
    };

    state.users.set(userId, typingEntry);
    this.notifyCallbacks(channelId, userId, userName, true);

    // Auto-stop after timeout
    const timeoutId = setTimeout(() => {
      this.stopTyping(channelId, userId);
    }, this.TYPING_TIMEOUT);

    typingEntry.timeoutId = timeoutId;
    this.typingTimeouts.set(`${userId}:${channelId}`, timeoutId);
  }

  // Stop typing in a channel
  stopTyping(channelId: string, userId: string): void {
    const existingTimeout = this.typingTimeouts.get(`${userId}:${channelId}`);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(`${userId}:${channelId}`);
    }

    const state = this.typingStates.get(channelId);
    if (!state) return;

    const entry = state.users.get(userId);
    if (entry?.timeoutId) {
      clearTimeout(entry.timeoutId);
    }

    if (state.users.delete(userId)) {
      // Delay the notification to give a smoother UX
      setTimeout(() => {
        this.notifyCallbacks(channelId, userId, entry.userName, false);
      }, this.TYPING_DISPLAY_TIME);
    }

    // Clean up empty states
    if (state.users.size === 0) {
      this.typingStates.delete(channelId);
    }
  }

  // Get all users currently typing in a channel
  getTypingUsers(channelId: string): Array<{ userId: string; userName: string; startedAt: string }> {
    const state = this.typingStates.get(channelId);
    if (!state) return [];

    return Array.from(state.users.values()).map(entry => ({
      userId: entry.userId,
      userName: entry.userName,
      startedAt: entry.startedAt
    }));
  }

  // Check if a specific user is typing
  isTyping(channelId: string, userId: string): boolean {
    const state = this.typingStates.get(channelId);
    return state?.users.has(userId) || false;
  }

  // Get typing count for a channel
  getTypingCount(channelId: string): number {
    const state = this.typingStates.get(channelId);
    return state?.users.size || 0;
  }

  // Subscribe to typing updates
  subscribe(callback: TypingCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(channelId: string, userId: string, userName: string, isTyping: boolean): void {
    this.callbacks.forEach(callback => {
      try {
        callback({ channelId, userId, userName, isTyping });
      } catch (error) {
        console.error('Error in typing callback:', error);
      }
    });
  }

  // Clear all typing state for a channel
  clearChannel(channelId: string): void {
    const state = this.typingStates.get(channelId);
    if (!state) return;

    state.users.forEach((entry) => {
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
    });

    this.typingStates.delete(channelId);
  }

  // Clear all state
  clearAll(): void {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.typingStates.clear();
  }

  // Format typing indicator text
  formatTypingText(channelId: string): string {
    const users = this.getTypingUsers(channelId);

    if (users.length === 0) {
      return '';
    }

    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    }

    if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    }

    if (users.length <= 4) {
      const names = users.slice(0, -1).map(u => u.userName).join(', ');
      return `${names}, and ${users[users.length - 1].userName} are typing...`;
    }

    return `${users[0].userName} and ${users.length - 1} others are typing...`;
  }
}

export default TypingIndicator;
