// Accessibility Engine — Accessibility Utilities
// General utility functions for accessibility

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Check if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

/**
 * Check if user prefers dark color scheme
 */
export function prefersDarkColorScheme(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = "a11y"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Check if element is visible in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Focus element with fallback
 */
export function focusElement(element: HTMLElement | null, options?: {
  preventScroll?: boolean;
}): void {
  if (!element) return;

  element.focus({
    preventScroll: options?.preventScroll ?? true
  });
}

/**
 * Trap focus within element
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(", ");

  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Announce to screen reader
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  if (typeof document === "undefined") return;

  // Find or create announcer element
  let announcer = document.getElementById("a11y-announcer") as HTMLElement;

  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "a11y-announcer";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  // Update priority
  announcer.setAttribute("aria-live", priority);

  // Clear and announce
  announcer.textContent = "";

  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Check if point is within bounds
 */
export function isPointInBounds(
  x: number,
  y: number,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Get dominant direction of movement
 */
export function getSwipeDirection(
  deltaX: number,
  deltaY: number,
  threshold: number = 30
): "left" | "right" | "up" | "down" | null {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (Math.max(absX, absY) < threshold) {
    return null;
  }

  if (absX > absY) {
    return deltaX > 0 ? "right" : "left";
  } else {
    return deltaY > 0 ? "down" : "up";
  }
}

/**
 * Sanitize HTML for accessibility
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Get text contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get luminance of color
 */
export function getLuminance(color: string): number {
  const rgb = hexToRgb(color);

  if (!rgb) return 0;

  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Check if WCAG contrast requirements are met
 */
export function meetsContrastRequirements(
  color1: string,
  color2: string,
  level: "AA" | "AAA" = "AA",
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);

  if (isLargeText) {
    return level === "AA" ? ratio >= 3 : ratio >= 4.5;
  }

  return level === "AA" ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Simple hash function for strings
 */
export function hashString(str: string): number {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash);
}

/**
 * Check if user is keyboard navigating
 */
export function isKeyboardUser(): boolean {
  if (typeof document === "undefined") return false;

  let isKeyboard = false;

  const handleKeyDown = () => {
    isKeyboard = true;
  };

  const handleMouseDown = () => {
    isKeyboard = false;
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("mousedown", handleMouseDown);

  return isKeyboard;
}
