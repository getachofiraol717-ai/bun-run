import {
  ConceptMasteryRecord,
  ErrorClassificationType,
  QuestionAttempt,
  RetryActionType,
  RetryDecision,
  CanonicalQuestion,
} from '@/types/canonicalQuiz';
import { generateQuestionVariant } from './quizGenerator';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE MASTERY & RETRY ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function getMasteryStorageKey(userId?: string | null): string {
  return userId ? `ku_concept_mastery_${userId}` : 'ku_concept_mastery_guest';
}

/**
 * Classify the error type when a student picks an incorrect option
 */
export function classifyError(
  selectedOpt: string,
  correctOpt: string,
  question: CanonicalQuestion
): ErrorClassificationType {
  const selLower = selectedOpt.toLowerCase();
  const corrLower = correctOpt.toLowerCase();

  // If both are numbers or formulas
  if (!isNaN(Number(selLower)) && !isNaN(Number(corrLower))) {
    const selNum = Number(selLower);
    const corrNum = Number(corrLower);
    if (selNum === -corrNum) return 'FORMULA_REVERSAL';
    if (Math.abs(selNum - corrNum) <= 2) return 'CALCULATION_ERROR';
  }

  if (question.question.toLowerCase().includes('not') || question.question.toLowerCase().includes('except')) {
    return 'MISREAD_QUESTION';
  }

  return 'CONCEPT_MISUNDERSTANDING';
}

/**
 * Determine the next pedagogical action when a student submits an answer
 */
export function determineRetryAction(
  currentAttempt: QuestionAttempt,
  question: CanonicalQuestion,
  consecutiveFailures: number
): RetryDecision {
  if (currentAttempt.isCorrect) {
    return {
      action: 'ADVANCE',
      message: '🎉 Correct! You demonstrated solid understanding of this learning objective.',
    };
  }

  // ── First Failure: Generate a new valid parameter variant
  if (consecutiveFailures === 1) {
    const nextVariant = generateQuestionVariant(question, question.difficulty);
    return {
      action: 'RETRY_VARIANT',
      message: '💡 Not quite right. Let’s try a new variant with different parameters to test understanding!',
      hintText: question.hint || `Focus on the underlying formula or rule: ${question.learningObjective}`,
      nextVariant,
    };
  }

  // ── Second Failure: Provide an explanation & worked example
  if (consecutiveFailures === 2) {
    const nextVariant = generateQuestionVariant(question, 'Easy'); // Lower difficulty slightly for retry
    return {
      action: 'EXPLAIN_CONCEPT',
      message: '🧠 Let’s break down the concept step-by-step before trying another variant.',
      remediationExplanation: question.explanation,
      workedExample: `Example Solution:\nQuestion: ${question.question}\nCorrect Approach: ${question.explanation}`,
      nextVariant,
    };
  }

  // ── Third / Repeated Failure: Trigger Remediation (Pause escalation, avoid infinite loops)
  const practiceVariant = generateQuestionVariant(question, 'Easy');
  return {
    action: 'TRIGGER_REMEDIATION',
    message: '⚠️ You’ve encountered multiple challenges with this concept. Let’s pause and review with AI Tutor.',
    remediationExplanation: `Concept Focus: ${question.learningObjective}\n\nKey Takeaway:\n${question.explanation}`,
    workedExample: `Step-by-Step Breakdown:\n1. Identify given variables.\n2. Apply core rule.\n3. Verify units & step calculation.`,
    nextVariant: practiceVariant,
  };
}

/**
 * Retrieve stored concept mastery records
 */
export function getStoredConceptMasteries(userId?: string | null): Record<string, ConceptMasteryRecord> {
  try {
    const key = getMasteryStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Update concept mastery score when a student attempts a variant
 */
export function updateConceptMastery(
  subject: string,
  topic: string,
  learningObjective: string,
  isCorrect: boolean,
  userId?: string | null
): ConceptMasteryRecord {
  const records = getStoredConceptMasteries(userId);
  const key = `${subject}_${topic}_${learningObjective}`.replace(/\s+/g, '_');
  const existing = records[key] || {
    conceptId: key,
    subject,
    topic,
    learningObjective,
    masteryScore: 0,
    consecutiveCorrect: 0,
    totalAttempts: 0,
    successfulVariantsCount: 0,
    status: 'NEEDS_PRACTICE',
    lastAttemptAt: new Date().toISOString(),
  };

  const totalAttempts = existing.totalAttempts + 1;
  let consecutiveCorrect = isCorrect ? existing.consecutiveCorrect + 1 : 0;
  let successfulVariantsCount = isCorrect ? existing.successfulVariantsCount + 1 : existing.successfulVariantsCount;

  // Calculate new mastery percentage (0 to 100)
  // Mastery requires consecutive correct answers across multiple parameter variants
  let masteryScore = Math.min(
    100,
    Math.round((successfulVariantsCount / Math.max(1, totalAttempts)) * 70 + consecutiveCorrect * 10)
  );

  let status: ConceptMasteryRecord['status'] = 'NEEDS_PRACTICE';
  if (masteryScore >= 80 && consecutiveCorrect >= 3) {
    status = 'MASTERED';
  } else if (masteryScore >= 40 || consecutiveCorrect >= 1) {
    status = 'DEVELOPING';
  }

  const updated: ConceptMasteryRecord = {
    ...existing,
    masteryScore,
    consecutiveCorrect,
    totalAttempts,
    successfulVariantsCount,
    status,
    lastAttemptAt: new Date().toISOString(),
  };

  records[key] = updated;
  try {
    const storageKey = getMasteryStorageKey(userId);
    localStorage.setItem(storageKey, JSON.stringify(records));

    // Also sync to Supabase if authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      const activeUserId = userId || user?.id;
      if (activeUserId) {
        supabase.from('concept_mastery').upsert({
          user_id: activeUserId,
          concept_id: key,
          subject,
          topic,
          learning_objective: learningObjective,
          mastery_score: masteryScore,
          consecutive_correct: consecutiveCorrect,
          total_attempts: totalAttempts,
          status,
          last_attempt_at: updated.lastAttemptAt,
        }, { onConflict: 'user_id,concept_id' }).then(({ error }) => {
          if (error) console.warn('[MasteryEngine] Supabase concept_mastery upsert error:', error);
        });
      }
    }).catch(err => {
      console.warn('[MasteryEngine] Auth check error:', err);
    });
  } catch (e) {
    console.warn('Failed to save concept mastery:', e);
  }

  return updated;
}
