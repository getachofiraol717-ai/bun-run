/**
 * RealtimeMessaging.ts
 *
 * WebSocket-style service for real-time messaging.
 */

import { supabase } from '@/integrations/supabase/client';

export interface RealtimeConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
}

export interface MessageEvent {
  type: 'message' | 'typing' | 'presence' | 'reaction' | 'notification' | 'system';
  channelId?: string;
  classroomId?: string;
  data: any;
  timestamp: string;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  lastConnected?: string;
  reconnectAttempts: number;
  error?: string;
}

type EventCallback = (event: MessageEvent) => void;

class RealtimeMessaging {
  private static instance: RealtimeMessaging;
  private config: Required<RealtimeConfig>;
  private connectionState: ConnectionState;
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();
  private messageQueue: MessageEvent[] = [];
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private subscribedChannels: Set<string> = new Set();
  private subscribedClassrooms: Set<string> = new Set();
  private supabaseChannel: any = null;

  private constructor(config: RealtimeConfig = {}) {
    this.config = {
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 100
    };

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0
    };
  }

  static getInstance(config?: RealtimeConfig): RealtimeMessaging {
    if (!RealtimeMessaging.instance) {
      RealtimeMessaging.instance = new RealtimeMessaging(config);
    }
    return RealtimeMessaging.instance;
  }

  async connect(): Promise<void> {
    if (this.connectionState.status === 'connected') {
      return;
    }

    this.updateConnectionState({ status: 'connecting' });

    try {
      if (typeof window !== 'undefined' && supabase) {
        if (this.supabaseChannel) {
          try { supabase.removeChannel(this.supabaseChannel); } catch {}
          this.supabaseChannel = null;
        }

        const channel = supabase.channel('classroom_realtime_events', {
          config: { broadcast: { self: false } }
        });

        channel.on('broadcast', { event: 'margeos_msg' }, (payload: any) => {
          if (payload?.payload) {
            this.emit(payload.payload);
          }
        });

        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            resolve();
          }, 1000);

          channel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timer);
              resolve();
            }
          });
        });

        this.supabaseChannel = channel;
      }

      this.updateConnectionState({
        status: 'connected',
        lastConnected: new Date().toISOString(),
        reconnectAttempts: 0
      });

      this.startHeartbeat();
      this.flushMessageQueue();

      this.emit({
        type: 'system',
        data: { event: 'connected' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.supabaseChannel && supabase) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
    }

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0
    };

    this.emit({
      type: 'system',
      data: { event: 'disconnected' },
      timestamp: new Date().toISOString()
    });
  }

  private handleConnectionError(error: Error): void {
    this.connectionState.reconnectAttempts++;

    if (this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.updateConnectionState({
        status: 'reconnecting',
        error: error.message
      });

      this.scheduleReconnect();
    } else {
      this.updateConnectionState({
        status: 'error',
        error: 'Maximum reconnection attempts reached'
      });
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimeout();

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.handleConnectionError(error as Error);
      }
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState.status === 'connected') {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private sendHeartbeat(): void {
    this.emit({
      type: 'system',
      data: { event: 'heartbeat' },
      timestamp: new Date().toISOString()
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.emit({
      type: 'system',
      data: { event: 'connectionStateChanged', state: this.connectionState },
      timestamp: new Date().toISOString()
    });
  }

  // Channel/Classroom Subscriptions
  subscribeToChannel(channelId: string): void {
    this.subscribedChannels.add(channelId);
    this.emit({
      type: 'system',
      data: { event: 'subscribed', type: 'channel', id: channelId },
      timestamp: new Date().toISOString()
    });
  }

  unsubscribeFromChannel(channelId: string): void {
    this.subscribedChannels.delete(channelId);
    this.emit({
      type: 'system',
      data: { event: 'unsubscribed', type: 'channel', id: channelId },
      timestamp: new Date().toISOString()
    });
  }

  subscribeToClassroom(classroomId: string): void {
    this.subscribedClassrooms.add(classroomId);
    this.emit({
      type: 'system',
      data: { event: 'subscribed', type: 'classroom', id: classroomId },
      timestamp: new Date().toISOString()
    });
  }

  unsubscribeFromClassroom(classroomId: string): void {
    this.subscribedClassrooms.delete(classroomId);
    this.emit({
      type: 'system',
      data: { event: 'unsubscribed', type: 'classroom', id: classroomId },
      timestamp: new Date().toISOString()
    });
  }

  // Event Emission
  private emit(event: MessageEvent): void {
    const handlers = this.eventHandlers.get('*') || new Set();
    const typeHandlers = this.eventHandlers.get(event.type) || new Set();

    [...handlers, ...typeHandlers].forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }

  on(event: string, handler: EventCallback): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: EventCallback): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  // Message Queue
  private queueMessage(event: MessageEvent): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift();
    }
    this.messageQueue.push(event);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const event = this.messageQueue.shift();
      if (event) {
        this.emit(event);
      }
    }
  }

  // Broadcast Methods
  private dispatchBroadcast(event: MessageEvent): void {
    // Deliver to local listeners
    this.emit(event);

    // Broadcast over channel to remote subscribers
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'margeos_msg',
          payload: event
        }).catch(() => {});
      } catch {}
    }
  }

  broadcastMessage(message: any, channelId: string, classroomId: string): void {
    const event: MessageEvent = {
      type: 'message',
      channelId,
      classroomId,
      data: { action: 'new', message },
      timestamp: new Date().toISOString()
    };

    if (this.connectionState.status === 'connected') {
      this.dispatchBroadcast(event);
    } else {
      this.queueMessage(event);
    }
  }

  broadcastTyping(userId: string, userName: string, channelId: string, classroomId: string, isTyping: boolean): void {
    const event: MessageEvent = {
      type: 'typing',
      channelId,
      classroomId,
      data: { userId, userName, isTyping },
      timestamp: new Date().toISOString()
    };

    if (this.connectionState.status === 'connected') {
      this.dispatchBroadcast(event);
    } else {
      this.queueMessage(event);
    }
  }

  broadcastPresence(userId: string, classroomId: string, status: string): void {
    const event: MessageEvent = {
      type: 'presence',
      classroomId,
      data: { userId, status },
      timestamp: new Date().toISOString()
    };

    if (this.connectionState.status === 'connected') {
      this.dispatchBroadcast(event);
    } else {
      this.queueMessage(event);
    }
  }

  broadcastReaction(messageId: string, userId: string, emoji: string, action: 'add' | 'remove', channelId: string): void {
    const event: MessageEvent = {
      type: 'reaction',
      channelId,
      data: { messageId, userId, emoji, action },
      timestamp: new Date().toISOString()
    };

    if (this.connectionState.status === 'connected') {
      this.dispatchBroadcast(event);
    } else {
      this.queueMessage(event);
    }
  }

  broadcastNotification(notification: any, userId: string): void {
    const event: MessageEvent = {
      type: 'notification',
      data: { notification, userId },
      timestamp: new Date().toISOString()
    };

    if (this.connectionState.status === 'connected') {
      this.dispatchBroadcast(event);
    } else {
      this.queueMessage(event);
    }
  }

  // Connection State
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
    this.subscribedChannels.clear();
    this.subscribedClassrooms.clear();
    this.messageQueue = [];
  }
}

export default RealtimeMessaging;
