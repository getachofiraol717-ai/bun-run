export interface AccessibilitySettings {
  audioMode: boolean;
  voiceCommands: boolean;
  liveCaptions: boolean;
  highContrast: boolean;
  brailleMode: boolean;
}

export class AccessibilityService {
  private settings: AccessibilitySettings = {
    audioMode: false,
    voiceCommands: false,
    liveCaptions: true,
    highContrast: false,
    brailleMode: false,
  };

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  updateSettings(patch: Partial<AccessibilitySettings>): AccessibilitySettings {
    this.settings = { ...this.settings, ...patch };
    return this.getSettings();
  }
}
