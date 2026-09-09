import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RealtimeMessaging from '@/plugins/margeos/classroom-engine/realtime/RealtimeMessaging';
import { DeliveryService } from '@/plugins/margeos/classroom-engine/realtime/DeliveryService';

describe('RealtimeMessaging & DeliveryService Unit Tests', () => {
  let messaging: RealtimeMessaging;
  let delivery: DeliveryService;

  beforeEach(() => {
    vi.clearAllMocks();
    messaging = RealtimeMessaging.getInstance();
    messaging.destroy();
    delivery = DeliveryService.getInstance();
  });

  afterEach(() => {
    messaging.destroy();
  });

  describe('RealtimeMessaging Lifecycle', () => {
    it('initializes with disconnected state', () => {
      const state = messaging.getConnectionState();
      expect(state.status).toBe('disconnected');
      expect(messaging.isConnected()).toBe(false);
    });

    it('connects and emits connected system event', async () => {
      const systemEvents: any[] = [];
      messaging.on('system', (event) => {
        systemEvents.push(event);
      });

      await messaging.connect();

      expect(messaging.isConnected()).toBe(true);
      expect(messaging.getConnectionState().status).toBe('connected');
      expect(systemEvents.some((e) => e.data?.event === 'connected')).toBe(true);
    });

    it('broadcasts message and delivers to listeners', async () => {
      await messaging.connect();
      const messages: any[] = [];

      messaging.on('message', (event) => {
        messages.push(event);
      });

      messaging.broadcastMessage({ text: 'Hello class' }, 'ch-1', 'class-1');

      expect(messages.length).toBe(1);
      expect(messages[0].data.message.text).toBe('Hello class');
      expect(messages[0].channelId).toBe('ch-1');
      expect(messages[0].classroomId).toBe('class-1');
    });

    it('queues messages when disconnected and flushes upon connection', async () => {
      messaging.disconnect();
      expect(messaging.isConnected()).toBe(false);

      const received: any[] = [];
      messaging.on('message', (event) => {
        received.push(event);
      });

      messaging.broadcastMessage({ text: 'Queued message' }, 'ch-queue', 'class-queue');
      expect(received.length).toBe(0);

      await messaging.connect();
      expect(received.length).toBe(1);
      expect(received[0].data.message.text).toBe('Queued message');
    });

    it('broadcasts presence and typing indicators', async () => {
      await messaging.connect();
      const typingEvents: any[] = [];
      const presenceEvents: any[] = [];

      messaging.on('typing', (e) => typingEvents.push(e));
      messaging.on('presence', (e) => presenceEvents.push(e));

      messaging.broadcastTyping('user-1', 'Alice', 'ch-1', 'class-1', true);
      messaging.broadcastPresence('user-1', 'class-1', 'online');

      expect(typingEvents.length).toBe(1);
      expect(typingEvents[0].data.isTyping).toBe(true);
      expect(presenceEvents.length).toBe(1);
      expect(presenceEvents[0].data.status).toBe('online');
    });
  });

  describe('DeliveryService Lifecycle', () => {
    it('creates and tracks delivery state accurately', () => {
      const state = delivery.createDelivery('msg-101');
      expect(state.messageId).toBe('msg-101');
      expect(state.status).toBe('pending');
      expect(state.retryCount).toBe(0);
    });

    it('marks message as sent, delivered, and read', () => {
      delivery.createDelivery('msg-202');
      delivery.markSent('msg-202');
      expect(delivery.getDeliveryState('msg-202')?.status).toBe('sent');

      delivery.markDelivered('msg-202');
      expect(delivery.getDeliveryState('msg-202')?.status).toBe('delivered');
      expect(delivery.getDeliveryState('msg-202')?.deliveredAt).toBeDefined();

      delivery.markRead('msg-202');
      expect(delivery.getDeliveryState('msg-202')?.status).toBe('read');
      expect(delivery.getDeliveryState('msg-202')?.readAt).toBeDefined();
    });

    it('calculates honest delivery statistics', () => {
      const id1 = `msg-${Date.now()}-1`;
      const id2 = `msg-${Date.now()}-2`;
      const id3 = `msg-${Date.now()}-3`;

      delivery.createDelivery(id1);
      delivery.createDelivery(id2);
      delivery.markSent(id2);
      delivery.markDelivered(id2);

      delivery.createDelivery(id3);
      delivery.markFailed(id3, 'Network timeout');

      const stats = delivery.getStats();
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.failed).toBeGreaterThanOrEqual(1);
      expect(stats.delivered).toBeGreaterThanOrEqual(1);
    });
  });
});
