// @ts-nocheck
// Accessibility Engine — useVoiceNavigation Hook
// React hook for voice navigation functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { voiceNavigationEngine } from "../blind-support/VoiceNavigationEngine";
import { voiceCommandEngine } from "../blind-support/VoiceCommandEngine";
import { speechService } from "../services/SpeechService";
import { voiceRecognitionService } from "../services/VoiceRecognitionService";
import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface VoiceNavigationState {
  isListening: boolean;
  isSpeaking: boolean;
  currentCommand: string | null;
  navigationTarget: string | null;
  lastAnnouncement: string | null;
}

export interface UseVoiceNavigationOptions {
  profile?: AccessibilityProfile | null;
  autoStart?: boolean;
  language?: string;
  commands?: VoiceCommand[];
}

export interface VoiceCommand {
  phrase: string;
  action: string;
  description?: string;
}

export interface UseVoiceNavigationReturn {
  // State
  state: VoiceNavigationState;
  isAvailable: boolean;
  isListening: boolean;

  // Actions
  start: () => Promise<void>;
  stop: () => void;
  speak: (text: string) => Promise<void>;
  announce: (text: string) => void;
  executeCommand: (command: string) => void;
  registerCommand: (command: VoiceCommand) => void;
  unregisterCommand: (phrase: string) => void;

  // Navigation
  navigateTo: (target: string) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  navigateHome: () => void;
}

export function useVoiceNavigation(options: UseVoiceNavigationOptions = {}): UseVoiceNavigationReturn {
  const { profile, autoStart = false, language = "en-US" } = options;

  const [state, setState] = useState<VoiceNavigationState>({
    isListening: false,
    isSpeaking: false,
    currentCommand: null,
    navigationTarget: null,
    lastAnnouncement: null
  });

  const engineRef = useRef(false);
  const profileRef = useRef(profile);

  // Update profile ref
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Initialize engines
  useEffect(() => {
    if (profileRef.current) {
      voiceNavigationEngine.initialize({
        profile: profileRef.current,
        settings: {}
      });
      voiceCommandEngine.initialize({
        profile: profileRef.current,
        settings: {}
      });
      speechService.initialize(profileRef.current);
      voiceRecognitionService.initialize(profileRef.current);
    }

    return () => {
      voiceRecognitionService.destroy();
    };
  }, []);

  // Subscribe to recognition
  useEffect(() => {
    const unsubscribe = voiceRecognitionService.subscribe((result) => {
      if (result.isFinal && result.transcript) {
        const command = voiceCommandEngine.matchCommand(result.transcript);
        if (command) {
          setState(prev => ({ ...prev, currentCommand: command.action }));
          executeCommand(command.action);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribeState = voiceRecognitionService.subscribeToState((recognitionState) => {
      setState(prev => ({
        ...prev,
        isListening: recognitionState === "listening" || recognitionState === "processing"
      }));
    });

    const unsubscribeSpeak = speechService.subscribeToSpeech((speaking) => {
      setState(prev => ({ ...prev, isSpeaking: speaking }));
    });

    return () => {
      unsubscribeState();
      unsubscribeSpeak();
    };
  }, []);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && profileRef.current?.motor?.voiceControlEnabled) {
      start();
    }
  }, [autoStart]);

  // Start voice recognition
  const start = useCallback(async () => {
    try {
      await voiceRecognitionService.start();
      setState(prev => ({ ...prev, isListening: true }));
      announce("Voice navigation started");
    } catch (error) {
      console.error("Failed to start voice navigation:", error);
      announce("Failed to start voice navigation");
    }
  }, []);

  // Stop voice recognition
  const stop = useCallback(() => {
    voiceRecognitionService.stop();
    setState(prev => ({
      ...prev,
      isListening: false,
      currentCommand: null
    }));
  }, []);

  // Speak text
  const speak = useCallback(async (text: string) => {
    setState(prev => ({ ...prev, isSpeaking: true }));
    try {
      await speechService.speak({ text, lang: language });
    } finally {
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [language]);

  // Announce (immediate)
  const announce = useCallback((text: string) => {
    speechService.speakImmediate({ text, lang: language });
    setState(prev => ({ ...prev, lastAnnouncement: text }));
  }, [language]);

  // Execute command
  const executeCommand = useCallback((command: string) => {
    const parts = command.split(" ");
    const action = parts[0];
    const target = parts.slice(1).join(" ");

    switch (action) {
      case "navigate":
        if (target) {
          navigateTo(target);
        }
        break;
      case "next":
        navigateNext();
        break;
      case "previous":
        navigatePrevious();
        break;
      case "home":
        navigateHome();
        break;
      case "read":
        announce(`Reading ${target || "content"}`);
        break;
      case "click":
        voiceNavigationEngine.activateCurrentTarget();
        announce("Clicked");
        break;
      default:
        announce(`Unknown command: ${command}`);
    }
  }, []);

  // Register command
  const registerCommand = useCallback((command: VoiceCommand) => {
    voiceCommandEngine.registerCommand({
      phrase: command.phrase,
      action: command.action,
      description: command.description
    });
  }, []);

  // Unregister command
  const unregisterCommand = useCallback((phrase: string) => {
    voiceCommandEngine.unregisterCommand(phrase);
  }, []);

  // Navigation functions
  const navigateTo = useCallback((target: string) => {
    setState(prev => ({ ...prev, navigationTarget: target }));
    announce(`Navigating to ${target}`);
    // In a real implementation, this would use the navigation engine
  }, [announce]);

  const navigateNext = useCallback(() => {
    voiceNavigationEngine.navigateNext();
    const target = voiceNavigationEngine.getCurrentTarget();
    if (target) {
      announce(`Next: ${target.label}`);
      setState(prev => ({ ...prev, navigationTarget: target.id }));
    }
  }, [announce]);

  const navigatePrevious = useCallback(() => {
    voiceNavigationEngine.navigatePrevious();
    const target = voiceNavigationEngine.getCurrentTarget();
    if (target) {
      announce(`Previous: ${target.label}`);
      setState(prev => ({ ...prev, navigationTarget: target.id }));
    }
  }, [announce]);

  const navigateHome = useCallback(() => {
    navigateTo("home");
    announce("Navigated to home");
  }, [navigateTo, announce]);

  return {
    state,
    isAvailable: voiceRecognitionService.isAvailable(),
    isListening: state.isListening,
    start,
    stop,
    speak,
    announce,
    executeCommand,
    registerCommand,
    unregisterCommand,
    navigateTo,
    navigateNext,
    navigatePrevious,
    navigateHome
  };
}
