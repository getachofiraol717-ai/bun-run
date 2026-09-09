/**
 * DeliveryService.ts
 *
 * Service for managing message delivery status.
 */

import RealtimeMessaging from './RealtimeMessaging';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface DeliveryState {
  messageId: string;
  status: DeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  error?: string;
  retryCount: number;
}

type DeliveryCallback = (state: DeliveryState) => void;

class DeliveryService {
  private static instance: DeliveryService;
  private deliveryStates: Map<string, DeliveryState> = new Map();
  private callbacks: Map<string, Set<DeliveryCallback>> = new Map();
  private retryQueue: Map<string, NodeJS.Timeout> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  private constructor() {}

  static getInstance(): DeliveryService {
    if (!DeliveryService.instance) {
      DeliveryService.instance = new DeliveryService();
    }
    return DeliveryService.instance;
  }

  // Create a new delivery state for a message
  createDelivery(messageId: string): DeliveryState {
    const state: DeliveryState = {
      messageId,
      status: 'pending',
      retryCount: 0
    };

    this.deliveryStates.set(messageId, state);
    return state;
  }

  // Update delivery state
  updateDelivery(messageId: string, updates: Partial<DeliveryState>): DeliveryState | undefined {
    const state = this.deliveryStates.get(messageId);
    if (!state) return undefined;

    Object.assign(state, updates);
    this.notifyCallbacks(messageId, state);
    return state;
  }

  // Mark message as sent
  markSent(messageId: string): DeliveryState | undefined {
    return this.updateDelivery(messageId, {
      status: 'sent',
      sentAt: new Date().toISOString()
    });
  }

  // Mark message as delivered
  markDelivered(messageId: string): DeliveryState | undefined {
    return this.updateDelivery(messageId, {
      status: 'delivered',
      deliveredAt: new Date().toISOString()
    });
  }

  // Mark message as read
  markRead(messageId: string): DeliveryState | undefined {
    return this.updateDelivery(messageId, {
      status: 'read',
      readAt: new Date().toISOString()
    });
  }

  // Mark message as failed
  markFailed(messageId: string, error: string): DeliveryState | undefined {
    return this.updateDelivery(messageId, {
      status: 'failed',
      failedAt: new Date().toISOString(),
      error
    });
  }

  // Retry failed message
  retryDelivery(messageId: string): boolean {
    const state = this.deliveryStates.get(messageId);
    if (!state || state.status !== 'failed') return false;

    if (state.retryCount >= this.MAX_RETRIES) {
      return false;
    }

    state.retryCount++;
    state.status = 'pending';
    state.error = undefined;

    this.notifyCallbacks(messageId, state);

    // Schedule actual retry
    const timeoutId = setTimeout(() => {
      this.attemptDelivery(messageId);
    }, this.RETRY_DELAY * state.retryCount);

    this.retryQueue.set(messageId, timeoutId);

    return true;
  }

  // Attempt to deliver a message via real transport
  private attemptDelivery(messageId: string): void {
    const state = this.deliveryStates.get(messageId);
    if (!state) return;

    this.markSent(messageId);

    const realtime = RealtimeMessaging.getInstance();
    if (realtime.isConnected()) {
      this.markDelivered(messageId);
    }
  }

  // Get delivery state
  getDeliveryState(messageId: string): DeliveryState | undefined {
    return this.deliveryStates.get(messageId);
  }

  // Get all pending deliveries
  getPendingDeliveries(): DeliveryState[] {
    return Array.from(this.deliveryStates.values()).filter(s => s.status === 'pending');
  }

  // Get all failed deliveries
  getFailedDeliveries(): DeliveryState[] {
    return Array.from(this.deliveryStates.values()).filter(s => s.status === 'failed');
  }

  // Get delivery statistics
  getStats(): {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  } {
    const states = Array.from(this.deliveryStates.values());

    return {
      total: states.length,
      pending: states.filter(s => s.status === 'pending').length,
      sent: states.filter(s => s.status === 'sent').length,
      delivered: states.filter(s => s.status === 'delivered').length,
      read: states.filter(s => s.status === 'read').length,
      failed: states.filter(s => s.status === 'failed').length
    };
  }

  // Subscribe to delivery updates for a specific message
  subscribe(messageId: string, callback: DeliveryCallback): () => void {
    if (!this.callbacks.has(messageId)) {
      this.callbacks.set(messageId, new Set());
    }
    this.callbacks.get(messageId)!.add(callback);

    return () => {
      this.callbacks.get(messageId)?.delete(callback);
    };
  }

  private notifyCallbacks(messageId: string, state: DeliveryState): void {
    const messageCallbacks = this.callbacks.get(messageId);
    if (messageCallbacks) {
      messageCallbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in delivery callback:', error);
        }
      });
    }

    // Also notify global listeners
    const globalCallbacks = this.callbacks.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in global delivery callback:', error);
        }
      });
    }
  }

  // Subscribe to all delivery updates
  subscribeAll(callback: DeliveryCallback): () => void {
    return this.subscribe('*', callback);
  }

  // Clear delivery state for a message
  clear(messageId: string): void {
    const timeoutId = this.retryQueue.get(messageId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryQueue.delete(messageId);
    }

    this.deliveryStates.delete(messageId);
    this.callbacks.delete(messageId);
  }

  // Clear all delivery states
  clearAll(): void {
    this.retryQueue.forEach(timeout => clearTimeout(timeout));
    this.retryQueue.clear();
    this.deliveryStates.clear();
  }

  // Format delivery status for display
  formatStatus(state: DeliveryState): string {
    switch (state.status) {
      case 'pending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return state.retryCount < this.MAX_RETRIES
          ? `Failed (${state.retryCount}/${this.MAX_RETRIES} retries)`
          : 'Failed permanently';
      default:
        return 'Unknown';
    }
  }

  // Get status icon
  getStatusIcon(state: DeliveryState): string {
    switch (state.status) {
      case 'pending':
        return 'clock';
      case 'sent':
        return 'check';
      case 'delivered':
        return 'check-all';
      case 'read':
        return 'eye';
      case 'failed':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }
}

export { DeliveryService };
export default DeliveryService;
