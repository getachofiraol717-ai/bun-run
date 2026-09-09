// Accessibility Engine — Visual Alert Engine
// Provides visual alternatives to audio alerts for deaf users

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface VisualAlertConfig {
  enabled: boolean;
  flashEnabled: boolean;
  flashInterval: number;
  pulseEnabled: boolean;
  color: string;
  backgroundColor: string;
  borderColor: string;
  position: "top" | "bottom" | "center" | "corner";
  duration: number;
  autoDismiss: boolean;
}

export type AlertType = "notification" | "warning" | "error" | "success" | "info" | "achievement";

export interface VisualAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  dismissed: boolean;
}

export class VisualAlertEngine {
  private config: VisualAlertConfig | null = null;
  private activeAlerts: Map<string, VisualAlert> = new Map();
  private listeners: Set<(alerts: VisualAlert[]) => void> = new Set();
  private flashElement: HTMLElement | null = null;
  private flashIntervalId: number | null = null;
  private isFlashing: boolean = false;

  // Alert colors by type
  private alertColors: Record<AlertType, { bg: string; border: string; text: string }> = {
    notification: { bg: "#E3F2FD", border: "#2196F3", text: "#1565C0" },
    warning: { bg: "#FFF3E0", border: "#FF9800", text: "#E65100" },
    error: { bg: "#FFEBEE", border: "#F44336", text: "#C62828" },
    success: { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32" },
    info: { bg: "#E0F7FA", border: "#00BCD4", text: "#006064" },
    achievement: { bg: "#FFF8E1", border: "#FFC107", text: "#FF6F00" }
  };

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    if (config.profile) {
      this.config = {
        enabled: true,
        flashEnabled: config.profile.audio.flashAlerts,
        flashInterval: config.profile.audio.flashInterval || 200,
        pulseEnabled: true,
        color: "#2196F3",
        backgroundColor: "#E3F2FD",
        borderColor: "#2196F3",
        position: "top",
        duration: 5000,
        autoDismiss: true
      };
    }
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined";
  }

  // Enable visual alerts
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      flashEnabled: profile.audio.flashAlerts,
      flashInterval: profile.audio.flashInterval || 200,
      pulseEnabled: true,
      color: "#2196F3",
      backgroundColor: "#E3F2FD",
      borderColor: "#2196F3",
      position: "top",
      duration: 5000,
      autoDismiss: true
    };
  }

  // Disable visual alerts
  disable(): void {
    this.stopFlashing();
    this.config = null;
  }

  // Show alert
  show(
    type: AlertType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      icon?: string;
      persistent?: boolean;
    }
  ): string {
    if (!this.config?.enabled) return "";

    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert: VisualAlert = {
      id,
      type,
      title,
      message,
      icon: options?.icon,
      timestamp: new Date(),
      dismissed: false
    };

    this.activeAlerts.set(id, alert);
    this.notifyListeners();

    // Flash screen if enabled
    if (this.config.flashEnabled) {
      this.flashScreen();
    }

    // Auto-dismiss
    const duration = options?.duration || this.config.duration;
    if (duration > 0 && !options?.persistent) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  // Quick alert methods
  notify(title: string, message: string): string {
    return this.show("notification", title, message);
  }

  warn(title: string, message: string): string {
    return this.show("warning", title, message);
  }

  error(title: string, message: string): string {
    return this.show("error", title, message);
  }

  success(title: string, message: string): string {
    return this.show("success", title, message);
  }

  achievement(title: string, message: string): string {
    return this.show("achievement", title, message);
  }

  // Dismiss alert
  dismiss(id: string): void {
    const alert = this.activeAlerts.get(id);
    if (alert) {
      alert.dismissed = true;
      this.activeAlerts.delete(id);
      this.notifyListeners();
    }
  }

  // Dismiss all alerts
  dismissAll(): void {
    this.activeAlerts.clear();
    this.notifyListeners();
  }

  // Get all active alerts
  getActiveAlerts(): VisualAlert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.dismissed);
  }

  // Flash screen
  private flashScreen(): void {
    if (typeof document === "undefined") return;

    // Create flash element if not exists
    if (!this.flashElement) {
      this.flashElement = document.createElement("div");
      this.flashElement.id = "visual-alert-flash";
      this.flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.1s ease;
      `;
      document.body.appendChild(this.flashElement);
    }

    // Flash effect
    this.flashElement.style.backgroundColor = this.config?.color || "#2196F3";
    this.flashElement.style.opacity = "0.3";

    setTimeout(() => {
      if (this.flashElement) {
        this.flashElement.style.opacity = "0";
      }
    }, this.config?.flashInterval || 100);

    // Stop after one flash
    this.stopFlashing();
  }

  // Start flashing
  startFlashing(): void {
    if (this.isFlashing) return;
    this.isFlashing = true;

    const flash = () => {
      if (!this.isFlashing || !this.flashElement) return;

      this.flashElement.style.backgroundColor = this.config?.color || "#2196F3";
      this.flashElement.style.opacity = "0.3";

      setTimeout(() => {
        if (this.flashElement && this.isFlashing) {
          this.flashElement.style.opacity = "0";
        }
      }, this.config?.flashInterval || 100);

      this.flashIntervalId = window.setTimeout(flash, (this.config?.flashInterval || 100) * 4);
    };

    flash();
  }

  // Stop flashing
  stopFlashing(): void {
    this.isFlashing = false;
    if (this.flashIntervalId) {
      clearTimeout(this.flashIntervalId);
      this.flashIntervalId = null;
    }
  }

  // Pulse effect on element
  pulseElement(element: HTMLElement, type: AlertType = "notification"): void {
    const colors = this.alertColors[type];

    element.style.transition = "box-shadow 0.3s ease";
    element.style.boxShadow = `0 0 20px ${colors.border}`;

    setTimeout(() => {
      element.style.boxShadow = "";
    }, 500);
  }

  // Render alert HTML
  renderAlertHTML(alert: VisualAlert): string {
    const colors = this.alertColors[alert.type];
    const icon = this.getAlertIcon(alert.type);

    return `
      <div class="visual-alert visual-alert-${alert.type}" data-alert-id="${alert.id}" style="
        background-color: ${colors.bg};
        border: 2px solid ${colors.border};
        color: ${colors.text};
        padding: 16px 20px;
        border-radius: 8px;
        margin: 8px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
      ">
        <span class="visual-alert-icon" style="font-size: 24px;">${icon}</span>
        <div class="visual-alert-content" style="flex: 1;">
          <div class="visual-alert-title" style="font-weight: bold; margin-bottom: 4px;">
            ${this.escapeHtml(alert.title)}
          </div>
          <div class="visual-alert-message" style="font-size: 14px;">
            ${this.escapeHtml(alert.message)}
          </div>
        </div>
        <button class="visual-alert-dismiss" onclick="visualAlertEngine.dismiss('${alert.id}')" style="
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: ${colors.text};
          padding: 4px;
          line-height: 1;
        ">×</button>
      </div>
    `;
  }

  // Get alert icon
  private getAlertIcon(type: AlertType): string {
    const icons: Record<AlertType, string> = {
      notification: "🔔",
      warning: "⚠️",
      error: "❌",
      success: "✅",
      info: "ℹ️",
      achievement: "🏆"
    };
    return icons[type] || icons.notification;
  }

  // Escape HTML
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Notify listeners
  private notifyListeners(): void {
    const alerts = this.getActiveAlerts();
    for (const listener of this.listeners) {
      listener(alerts);
    }
  }

  // Subscribe to alert changes
  subscribe(listener: (alerts: VisualAlert[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update settings
  updateSettings(settings: any): void {
    // Settings would be applied here
  }

  // Cleanup
  destroy(): void {
    this.dismissAll();
    this.stopFlashing();
    this.listeners.clear();

    if (this.flashElement && this.flashElement.parentNode) {
      this.flashElement.parentNode.removeChild(this.flashElement);
    }
  }
}

// Export singleton
export const visualAlertEngine = new VisualAlertEngine();

// Make dismiss method globally accessible for onclick handlers
if (typeof window !== "undefined") {
  (window as any).visualAlertEngine = visualAlertEngine;
}
