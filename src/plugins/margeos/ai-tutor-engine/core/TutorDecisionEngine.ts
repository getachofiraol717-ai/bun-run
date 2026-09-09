// AI Tutor Engine — TutorDecisionEngine (Feature 11 + composing Feature 13)
//
// Feature 11 asks for predicted questions with answers "generated before
// the student asks". Eagerly generating full AI answers for every predicted
// question would multiply AI cost ~4x per concept for content the student
// may never look at — directly at odds with this spec's own "lazy-load
// explanations" performance requirement. The design here instead prepares
// the *questions* instantly (cheap, no AI call) as one-tap chips; the answer
// is generated on demand, the moment the student actually taps one, reusing
// the exact same page context already cached — so it still feels instant
// without ever wasting a call on a question nobody asked.
import { escalationAction, escalationFor, type EscalationAction } from "./DifficultyAdapter";
import type { TeachingSession } from "../models/TeachingSession";

/** Canned-but-concept-aware question templates covering Feature 11's "Why? How? What if? Can you explain again?" pattern. */
export function predictFollowUpQuestions(conceptLabel: string): string[] {
  return [
    `Why does ${conceptLabel} matter?`,
    `How is ${conceptLabel} used in real life?`,
    `What if the numbers/conditions change?`,
    `Can you explain ${conceptLabel} again, a different way?`,
  ];
}

export interface NextActionDecision {
  /** What the tutor should do for this concept right now, given the session's confusion history. */
  escalation: EscalationAction;
  followUpQuestions: string[];
}

export function decideNextAction(session: TeachingSession, conceptLabel: string): NextActionDecision {
  return {
    escalation: escalationAction(escalationFor(session, conceptLabel)),
    followUpQuestions: predictFollowUpQuestions(conceptLabel),
  };
}
