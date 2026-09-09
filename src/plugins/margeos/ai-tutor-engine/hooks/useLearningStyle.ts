// @ts-nocheck
// AI Tutor Engine — useLearningStyle (Features 6 + 7)
import { useCallback } from "react";
import { useSyncExternalStore } from "react";
import { getProfile, setProfile, subscribeProfile } from "../store/aiTutorStore";
import { setPreferences } from "../core/TeachingSessionManager";
import { descriptorFor } from "../core/LearningStyleDetector";
import { syncMemoryToVault } from "../services/ContextMemoryService";
import { AGE_BAND_DESCRIPTORS } from "../utils/difficultyUtils";
import type { AgeBand, ExplanationMode, StudentProfile } from "../models/StudentProfile";
import type { LearningStyle, LearningStyleDescriptor } from "../models/LearningStyle";
import type { AgeBandDescriptor } from "../utils/difficultyUtils";

export interface UseLearningStyleResult {
  profile: StudentProfile;
  styleDescriptor: LearningStyleDescriptor;
  ageBandDescriptor: AgeBandDescriptor;
  setLearningStyle: (style: LearningStyle) => void;
  setAgeBand: (band: AgeBand) => void;
  setPreferredMode: (mode: ExplanationMode) => void;
}

export function useLearningStyle(): UseLearningStyleResult {
  const profile = useSyncExternalStore(subscribeProfile, getProfile);

  const setLearningStyle = useCallback((style: LearningStyle) => {
    setProfile(setPreferences(getProfile(), { learningStyle: style }));
    void syncMemoryToVault("preferred_style", `Learning style: ${style}`);
  }, []);
  const setAgeBand = useCallback((band: AgeBand) => setProfile(setPreferences(getProfile(), { ageBand: band })), []);
  const setPreferredMode = useCallback((mode: ExplanationMode) => {
    setProfile(setPreferences(getProfile(), { preferredMode: mode }));
    void syncMemoryToVault("preferred_style", `Prefers ${mode} explanations`);
  }, []);

  return {
    profile,
    styleDescriptor: descriptorFor(profile.learningStyle),
    ageBandDescriptor: AGE_BAND_DESCRIPTORS[profile.ageBand],
    setLearningStyle,
    setAgeBand,
    setPreferredMode,
  };
}
