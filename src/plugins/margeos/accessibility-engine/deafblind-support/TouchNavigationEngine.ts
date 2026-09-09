// @ts-nocheck
// Accessibility Engine — Touch Navigation Engine
// Provides touch-based navigation for deafblind users

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface TouchNavigationConfig {
  enabled: boolean;
  touchSensitivity: number; // 0-1
  holdDuration: number; // ms
  swipeThreshold: number; // pixels
  multiTouchEnabled: boolean;
  hapticFeedback: boolean;
}

export interface TouchTarget {
  id: string;
  element: HTMLElement;
  label: string;
  type: "link" | "button" | "input" | "heading" | "region";
  bounds: DOMRect;
  accessible: boolean;
}

export interface TouchGesture {
  type: "tap" | "double_tap" | "long_press" | "swipe_left" | "swipe_right" | "swipe_up" | "swipe_down" | "drag" | "pinch";
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number };
  duration: number;
  velocity?: number;
  scale?: number;
}

export type TouchNavigationState = "idle" | "touching" | "gesture_detected" | "navigating";

export class TouchNavigationEngine {
  private config: TouchNavigationConfig | null = null;
  private profile: AccessibilityProfile | null = null;
  private state: TouchNavigationState = "idle";
  private targets: TouchTarget[] = [];
  private currentTarget: TouchTarget | null = null;
  private listeners: Set<(state: TouchNavigationState) => void> = new Set();
  private gestureListeners: Set<(gesture: TouchGesture) => void> = new Set();
  private targetListeners: Set<(target: TouchTarget | null) => void> = new Set();
  private activeTouches: Map<number, Touch> = new Map();
  private gestureStartTime: number = 0;
  private gestureStartPoint: { x: number; y: number } | null = null;
  private longPressTimeout: NodeJS.Timeout | null = null;
  private isLongPress: boolean = false;

  private boundTouchStart: ((event: TouchEvent) => void) | null = null;
  private boundTouchMove: ((event: TouchEvent) => void) | null = null;
  private boundTouchEnd: ((event: TouchEvent) => void) | null = null;
  private boundTouchCancel: ((event: TouchEvent) => void) | null = null;

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;

    const isExplicitlyEnabled = Boolean(config.profile?.deafblind?.touchNavigationEnabled);

    this.config = {
      enabled: isExplicitlyEnabled,
      touchSensitivity: config.profile?.deafblind?.touchSensitivity || 0.7,
      holdDuration: config.profile?.deafblind?.holdDuration || 500,
      swipeThreshold: config.profile?.deafblind?.swipeThreshold || 50,
      multiTouchEnabled: config.profile?.deafblind?.multiTouchEnabled || false,
      hapticFeedback: true
    };

    if (isExplicitlyEnabled) {
      this.setupEventListeners();
    }
  }

  // Check availability
  isAvailable(): boolean {
    return typeof window !== "undefined" && "ontouchstart" in window;
  }

  // Enable touch navigation
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      touchSensitivity: profile.deafblind?.touchSensitivity || 0.7,
      holdDuration: profile.deafblind?.holdDuration || 500,
      swipeThreshold: profile.deafblind?.swipeThreshold || 50,
      multiTouchEnabled: profile.deafblind?.multiTouchEnabled || false,
      hapticFeedback: true
    };
    this.setupEventListeners();
  }

  // Disable touch navigation
  disable(): void {
    this.removeEventListeners();
    this.config = null;
    this.setState("idle");
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (typeof document === "undefined") return;
    this.removeEventListeners();

    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundTouchCancel = this.handleTouchCancel.bind(this);

    document.addEventListener("touchstart", this.boundTouchStart, { passive: true });
    document.addEventListener("touchmove", this.boundTouchMove, { passive: true });
    document.addEventListener("touchend", this.boundTouchEnd, { passive: true });
    document.addEventListener("touchcancel", this.boundTouchCancel, { passive: true });
  }

  // Remove event listeners
  private removeEventListeners(): void {
    if (typeof document === "undefined") return;

    if (this.boundTouchStart) {
      document.removeEventListener("touchstart", this.boundTouchStart);
      this.boundTouchStart = null;
    }
    if (this.boundTouchMove) {
      document.removeEventListener("touchmove", this.boundTouchMove);
      this.boundTouchMove = null;
    }
    if (this.boundTouchEnd) {
      document.removeEventListener("touchend", this.boundTouchEnd);
      this.boundTouchEnd = null;
    }
    if (this.boundTouchCancel) {
      document.removeEventListener("touchcancel", this.boundTouchCancel);
      this.boundTouchCancel = null;
    }
  }

  // Handle touch start
  private handleTouchStart(event: TouchEvent): void {
    if (!this.config?.enabled) return;

    this.setState("touching");

    for (const touch of Array.from(event.changedTouches)) {
      this.activeTouches.set(touch.identifier, touch);
    }

    if (this.activeTouches.size === 1) {
      const touch = Array.from(this.activeTouches.values())[0];
      this.gestureStartTime = Date.now();
      this.gestureStartPoint = { x: touch.clientX, y: touch.clientY };
      this.isLongPress = false;

      // Setup long press detection
      this.longPressTimeout = setTimeout(() => {
        this.isLongPress = true;
        const gesture = this.createGesture("long_press");
        this.notifyGestureListeners(gesture);
        this.setState("gesture_detected");
      }, this.config.holdDuration);
    } else if (this.activeTouches.size === 2) {
      // Two finger touch - prepare for pinch
      this.cancelLongPress();
    }
  }

  // Handle touch move
  private handleTouchMove(event: TouchEvent): void {
    if (!this.config?.enabled || this.activeTouches.size === 0) return;

    // Cancel long press on movement
    if (this.activeTouches.size === 1 && !this.isLongPress) {
      this.cancelLongPress();

      const touch = Array.from(this.activeTouches.values())[0];
      const deltaX = touch.clientX - (this.gestureStartPoint?.x || 0);
      const deltaY = touch.clientY - (this.gestureStartPoint?.y || 0);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.config.swipeThreshold) {
        // Determine swipe direction
        let direction: TouchGesture["type"];
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? "swipe_right" : "swipe_left";
        } else {
          direction = deltaY > 0 ? "swipe_down" : "swipe_up";
        }

        const gesture = this.createGesture(direction);
        this.notifyGestureListeners(gesture);
        this.setState("gesture_detected");
        this.activeTouches.clear();
      }
    } else if (this.activeTouches.size === 2 && this.config.multiTouchEnabled) {
      // Handle pinch gesture
      this.handlePinchGesture(event);
    }
  }

  // Handle pinch gesture
  private handlePinchGesture(event: TouchEvent): void {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length !== 2) return;

    const touch1 = touches[0];
    const touch2 = touches[1];

    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const gesture = this.createGesture("pinch");
    gesture.scale = currentDistance / 100; // Normalized scale
    this.notifyGestureListeners(gesture);
  }

  // Handle touch end
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.config?.enabled) return;

    for (const touch of Array.from(event.changedTouches)) {
      this.activeTouches.delete(touch.identifier);
    }

    this.cancelLongPress();

    if (this.activeTouches.size === 0) {
      if (!this.isLongPress) {
        // Check for tap or double tap
        const gesture = this.createGesture("tap");
        this.notifyGestureListeners(gesture);
        this.setState("gesture_detected");
      }

      this.gestureStartPoint = null;
      this.setState("idle");
    }
  }

  // Handle touch cancel
  private handleTouchCancel(event: TouchEvent): void {
    this.activeTouches.clear();
    this.cancelLongPress();
    this.gestureStartPoint = null;
    this.setState("idle");
  }

  // Cancel long press timeout
  private cancelLongPress(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  // Create gesture object
  private createGesture(type: TouchGesture["type"]): TouchGesture {
    const touch = Array.from(this.activeTouches.values())[0] || { clientX: 0, clientY: 0 };

    return {
      type,
      startPoint: this.gestureStartPoint || { x: touch.clientX, y: touch.clientY },
      endPoint: { x: touch.clientX, y: touch.clientY },
      duration: Date.now() - this.gestureStartTime,
      velocity: 0 // Could calculate based on duration and distance
    };
  }

  // Scan page for targets
  scanPage(): void {
    if (typeof document === "undefined") return;

    this.targets = [];

    // Scan links
    document.querySelectorAll("a[href]").forEach(el => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || "";
      if (text) {
        this.targets.push(this.createTarget(htmlEl, "link", text));
      }
    });

    // Scan buttons
    document.querySelectorAll("button").forEach(el => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || htmlEl.getAttribute("aria-label") || "";
      if (text) {
        this.targets.push(this.createTarget(htmlEl, "button", text));
      }
    });

    // Scan inputs
    document.querySelectorAll("input, select, textarea").forEach(el => {
      const htmlEl = el as HTMLElement;
      const label = this.getInputLabel(htmlEl);
      if (label) {
        this.targets.push(this.createTarget(htmlEl, "input", label));
      }
    });

    // Scan headings
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || "";
      if (text) {
        this.targets.push(this.createTarget(htmlEl, "heading", text));
      }
    });

    // Scan landmarks
    document.querySelectorAll("nav, main, header, footer, aside, [role='navigation'], [role='main']").forEach(el => {
      const htmlEl = el as HTMLElement;
      const label = htmlEl.getAttribute("aria-label") || htmlEl.tagName.toLowerCase();
      this.targets.push(this.createTarget(htmlEl, "region", label));
    });
  }

  // Create target from element
  private createTarget(element: HTMLElement, type: TouchTarget["type"], label: string): TouchTarget {
    return {
      id: element.id || `touch-${this.targets.length}`,
      element,
      label,
      type,
      bounds: element.getBoundingClientRect(),
      accessible: this.isAccessible(element)
    };
  }

  // Get input label
  private getInputLabel(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent?.trim() || "";
    }

    // Check parent label
    const parent = element.closest("label");
    if (parent) return parent.textContent?.trim() || "";

    // Check placeholder
    const placeholder = element.getAttribute("placeholder");
    if (placeholder) return placeholder;

    // Fall back to name
    return element.getAttribute("name") || element.tagName.toLowerCase();
  }

  // Check if element is accessible
  private isAccessible(element: HTMLElement): boolean {
    return !element.hasAttribute("disabled") && !element.hasAttribute("hidden");
  }

  // Find target at position
  findTargetAtPosition(x: number, y: number): TouchTarget | null {
    // Sort by size (smallest first for more precise targeting)
    const sortedTargets = [...this.targets].sort((a, b) => {
      const areaA = a.bounds.width * a.bounds.height;
      const areaB = b.bounds.width * b.bounds.height;
      return areaA - areaB;
    });

    for (const target of sortedTargets) {
      if (
        x >= target.bounds.left &&
        x <= target.bounds.right &&
        y >= target.bounds.top &&
        y <= target.bounds.bottom
      ) {
        return target;
      }
    }

    return null;
  }

  // Navigate to next target
  navigateNext(): TouchTarget | null {
    if (this.targets.length === 0) return null;

    const currentIndex = this.currentTarget
      ? this.targets.findIndex(t => t.id === this.currentTarget?.id)
      : -1;

    const nextIndex = (currentIndex + 1) % this.targets.length;
    this.currentTarget = this.targets[nextIndex];
    this.setCurrentTarget(this.currentTarget);

    return this.currentTarget;
  }

  // Navigate to previous target
  navigatePrevious(): TouchTarget | null {
    if (this.targets.length === 0) return null;

    const currentIndex = this.currentTarget
      ? this.targets.findIndex(t => t.id === this.currentTarget?.id)
      : 0;

    const prevIndex = (currentIndex - 1 + this.targets.length) % this.targets.length;
    this.currentTarget = this.targets[prevIndex];
    this.setCurrentTarget(this.currentTarget);

    return this.currentTarget;
  }

  // Navigate to target
  navigateTo(target: TouchTarget): void {
    this.currentTarget = target;
    this.setCurrentTarget(target);
  }

  // Set current target
  private setCurrentTarget(target: TouchTarget): void {
    // Focus element
    if (target.element) {
      target.element.focus();
      target.element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    this.notifyTargetListeners(target);
    this.setState("navigating");
  }

  // Activate current target
  activateCurrentTarget(): void {
    if (this.currentTarget && this.currentTarget.element) {
      this.currentTarget.element.click();
    }
  }

  // Get targets
  getTargets(): TouchTarget[] {
    return [...this.targets];
  }

  // Get current target
  getCurrentTarget(): TouchTarget | null {
    return this.currentTarget;
  }

  // Update targets (e.g., after page change)
  updateTargets(): void {
    this.scanPage();
  }

  // Notify gesture listeners
  private notifyGestureListeners(gesture: TouchGesture): void {
    for (const listener of this.gestureListeners) {
      listener(gesture);
    }
  }

  // Notify target listeners
  private notifyTargetListeners(target: TouchTarget | null): void {
    for (const listener of this.targetTargetListeners) {
      listener(target);
    }
  }

  private get targetTargetListeners(): Set<(target: TouchTarget | null) => void> {
    return this.targetListeners;
  }

  // Subscribe to gesture recognition
  subscribeToGestures(listener: (gesture: TouchGesture) => void): () => void {
    this.gestureListeners.add(listener);
    return () => this.gestureListeners.delete(listener);
  }

  // Subscribe to target changes
  subscribeToTargets(listener: (target: TouchTarget | null) => void): () => void {
    this.targetListeners.add(listener);
    return () => this.targetListeners.delete(listener);
  }

  // Subscribe to state changes
  subscribe(listener: (state: TouchNavigationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get state
  getState(): TouchNavigationState {
    return this.state;
  }

  private setState(state: TouchNavigationState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // Cleanup
  destroy(): void {
    this.removeEventListeners();
    this.cancelLongPress();
    this.targets = [];
    this.currentTarget = null;
    this.activeTouches.clear();
    this.listeners.clear();
    this.gestureListeners.clear();
    this.targetListeners.clear();
  }
}

// Export singleton
export const touchNavigationEngine = new TouchNavigationEngine();
