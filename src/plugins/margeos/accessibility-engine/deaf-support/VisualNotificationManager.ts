// Accessibility Engine — Visual Notification Manager
// Manages visual notifications for deaf and hard-of-hearing users

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export type NotificationType = "info" | "success" | "warning" | "error" | "message" | "event";

export interface VisualNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  priority: "low" | "normal" | "high";
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  label: string;
  handler: string; // Function name or identifier
  style: "primary" | "secondary" | "destructive";
}

export interface NotificationConfig {
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  maxVisible: number;
  autoHide: boolean;
  hideDelay: number;
  stackDirection: "up" | "down";
  animation: "fade" | "slide" | "scale";
}

export class VisualNotificationManager {
  private config: NotificationConfig = {
    position: "top-right",
    maxVisible: 5,
    autoHide: true,
    hideDelay: 5000,
    stackDirection: "down",
    animation: "slide"
  };

  private notifications: Map<string, VisualNotification> = new Map();
  private listeners: Set<(notifications: VisualNotification[]) => void> = new Set();
  private container: HTMLElement | null = null;
  private profile: AccessibilityProfile | null = null;

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;

    // Create notification container
    if (typeof document !== "undefined") {
      this.createContainer();
    }
  }

  // Create container element
  private createContainer(): void {
    if (typeof document === "undefined") return;
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "visual-notifications";
    this.container.setAttribute("role", "region");
    this.container.setAttribute("aria-label", "Notifications");
    this.container.style.cssText = `
      position: fixed;
      ${this.getPositionCSS()}
      z-index: 999999;
      display: flex;
      flex-direction: ${this.config.stackDirection === "up" ? "column-reverse" : "column"};
      gap: 8px;
      padding: 16px;
      max-width: 400px;
      pointer-events: none;
    `;

    document.body.appendChild(this.container);
  }

  // Get position CSS
  private getPositionCSS(): string {
    const positions: Record<string, string> = {
      "top-left": "top: 0; left: 0;",
      "top-center": "top: 0; left: 50%; transform: translateX(-50%);",
      "top-right": "top: 0; right: 0;",
      "bottom-left": "bottom: 0; left: 0;",
      "bottom-center": "bottom: 0; left: 50%; transform: translateX(-50%);",
      "bottom-right": "bottom: 0; right: 0;"
    };
    return positions[this.config.position];
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  // Show notification
  show(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: "low" | "normal" | "high";
      icon?: string;
      persistent?: boolean;
      actions?: NotificationAction[];
      metadata?: Record<string, any>;
    }
  ): string {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification: VisualNotification = {
      id,
      type,
      title,
      message,
      icon: options?.icon,
      priority: options?.priority || "normal",
      timestamp: new Date(),
      read: false,
      dismissed: false,
      actions: options?.actions,
      metadata: options?.metadata
    };

    this.notifications.set(id, notification);
    this.renderNotification(notification);

    if (!options?.persistent && this.config.autoHide) {
      setTimeout(() => {
        this.dismiss(id);
      }, this.config.hideDelay);
    }

    this.notifyListeners();
    return id;
  }

  // Render single notification
  private renderNotification(notification: VisualNotification): void {
    if (!this.container) return;

    const element = document.createElement("div");
    element.id = `notif-${notification.id}`;
    element.setAttribute("role", "alert");
    element.setAttribute("aria-live", notification.priority === "high" ? "assertive" : "polite");
    element.className = `visual-notification visual-notification-${notification.type}`;
    element.style.cssText = `
      background: ${this.getTypeColors(notification.type).bg};
      border-left: 4px solid ${this.getTypeColors(notification.type).border};
      color: ${this.getTypeColors(notification.type).text};
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      gap: 12px;
      align-items: flex-start;
      pointer-events: auto;
      animation: ${this.config.animation}In 0.3s ease;
    `;

    const iconHtml = notification.icon || this.getDefaultIcon(notification.type);

    let actionsHtml = "";
    if (notification.actions && notification.actions.length > 0) {
      actionsHtml = `
        <div class="notif-actions" style="display: flex; gap: 8px; margin-top: 8px;">
          ${notification.actions.map(action => `
            <button
              class="notif-action-${action.style}"
              onclick="visualNotificationManager.handleAction('${notification.id}', '${action.id}')"
              style="
                padding: 4px 12px;
                border: 1px solid ${this.getTypeColors(notification.type).border};
                border-radius: 4px;
                background: transparent;
                color: ${this.getTypeColors(notification.type).text};
                cursor: pointer;
                font-size: 12px;
              "
            >${action.label}</button>
          `).join("")}
        </div>
      `;
    }

    element.innerHTML = `
      <div class="notif-icon" style="font-size: 20px;">${iconHtml}</div>
      <div class="notif-content" style="flex: 1;">
        <div class="notif-title" style="font-weight: bold; font-size: 14px;">${this.escapeHtml(notification.title)}</div>
        <div class="notif-message" style="font-size: 13px; margin-top: 4px;">${this.escapeHtml(notification.message)}</div>
        ${actionsHtml}
      </div>
      <button class="notif-close" onclick="visualNotificationManager.dismiss('${notification.id}')" style="
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: ${this.getTypeColors(notification.type).text};
        opacity: 0.7;
        padding: 0;
        line-height: 1;
      ">×</button>
    `;

    this.container.appendChild(element);

    // Limit visible notifications
    this.trimNotifications();
  }

  // Get colors for notification type
  private getTypeColors(type: NotificationType): { bg: string; border: string; text: string } {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      info: { bg: "#E3F2FD", border: "#2196F3", text: "#1565C0" },
      success: { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32" },
      warning: { bg: "#FFF3E0", border: "#FF9800", text: "#E65100" },
      error: { bg: "#FFEBEE", border: "#F44336", text: "#C62828" },
      message: { bg: "#F3E5F5", border: "#9C27B0", text: "#6A1B9A" },
      event: { bg: "#E0F7FA", border: "#00BCD4", text: "#006064" }
    };
    return colors[type];
  }

  // Get default icon
  private getDefaultIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      message: "💬",
      event: "📅"
    };
    return icons[type];
  }

  // Trim visible notifications
  private trimNotifications(): void {
    if (!this.container) return;

    const elements = this.container.children;
    while (elements.length > this.config.maxVisible) {
      const firstElement = elements[0];
      if (firstElement) {
        const id = firstElement.id.replace("notif-", "");
        this.dismiss(id);
      }
    }
  }

  // Dismiss notification
  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.dismissed = true;
    this.notifications.delete(id);

    const element = document.getElementById(`notif-${id}`);
    if (element) {
      element.style.animation = `${this.config.animation}Out 0.3s ease forwards`;
      setTimeout(() => {
        element.remove();
      }, 300);
    }

    this.notifyListeners();
  }

  // Mark as read
  markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    for (const notification of this.notifications.values()) {
      notification.read = true;
    }
    this.notifyListeners();
  }

  // Handle action
  handleAction(notificationId: string, actionId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification || !notification.actions) return;

    const action = notification.actions.find(a => a.id === actionId);
    if (action) {
      // Dispatch custom event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notification-action", {
          detail: {
            notificationId,
            actionId,
            action
          }
        }));
      }

      // Auto-dismiss after action
      this.dismiss(notificationId);
    }
  }

  // Get all notifications
  getAll(): VisualNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => !n.dismissed)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get unread count
  getUnreadCount(): number {
    return Array.from(this.notifications.values())
      .filter(n => !n.dismissed && !n.read)
      .length;
  }

  // Get by type
  getByType(type: NotificationType): VisualNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => !n.dismissed && n.type === type);
  }

  // Clear all
  clearAll(): void {
    for (const id of this.notifications.keys()) {
      this.dismiss(id);
    }
  }

  // Update config
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.container) {
      this.container.style.cssText = `
        position: fixed;
        ${this.getPositionCSS()}
        z-index: 999999;
        display: flex;
        flex-direction: ${this.config.stackDirection === "up" ? "column-reverse" : "column"};
        gap: 8px;
        padding: 16px;
        max-width: 400px;
        pointer-events: none;
      `;
    }
  }

  // Escape HTML
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Notify listeners
  private notifyListeners(): void {
    const notifications = this.getAll();
    for (const listener of this.listeners) {
      listener(notifications);
    }
  }

  // Subscribe
  subscribe(listener: (notifications: VisualNotification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Cleanup
  destroy(): void {
    this.clearAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.listeners.clear();
  }
}

// Export singleton
export const visualNotificationManager = new VisualNotificationManager();

// Make methods globally accessible
if (typeof window !== "undefined") {
  (window as any).visualNotificationManager = visualNotificationManager;
}
