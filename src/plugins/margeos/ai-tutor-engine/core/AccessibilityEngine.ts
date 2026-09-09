import { AccessibilityService, AccessibilitySettings } from "../services/AccessibilityService";

export class AccessibilityEngine {
  private static service = new AccessibilityService();

  static getSettings(): AccessibilitySettings {
    return this.service.getSettings();
  }

  static configure(patch: Partial<AccessibilitySettings>) {
    return this.service.updateSettings(patch);
  }
}
