import { useState } from "react";
import { LearningProfileEngine } from "../core/LearningProfileEngine";

export function useLearningProfile() {
  const [profile, setProfile] = useState(() => LearningProfileEngine.getProfile());

  const recordMastery = (concept: string, mastered: boolean) => {
    LearningProfileEngine.recordOutcome(concept, mastered);
    setProfile(LearningProfileEngine.getProfile());
  };

  return { profile, recordMastery };
}
