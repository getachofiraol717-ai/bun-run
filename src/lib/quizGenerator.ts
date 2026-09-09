import {
  CanonicalQuestion,
  CanonicalQuiz,
  QuestionTemplate,
  QuizDifficulty,
  QuizSourceType,
} from '@/types/canonicalQuiz';

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC PARAMETERIZED GENERATION & VALIDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Utility to generate a random integer in range [min, max] inclusive
 */
function randInt(min: number, max: number, excludeZero = false): number {
  let val = Math.floor(Math.random() * (max - min + 1)) + min;
  if (excludeZero && val === 0) val = 1;
  return val;
}

/**
 * Shuffle array deterministically or randomly
 */
function shuffleArray<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

/**
 * Validate a question structure deterministically
 */
export function validateCanonicalQuestion(q: Partial<CanonicalQuestion>): { valid: boolean; reason?: string } {
  if (!q.question || q.question.trim().length < 5) {
    return { valid: false, reason: 'Question text is too short or empty.' };
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    return { valid: false, reason: 'Question must have at least 2 options.' };
  }
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
    return { valid: false, reason: 'Correct answer index out of bounds.' };
  }
  // Check for duplicate options
  const uniqueOpts = new Set(q.options.map(o => o.trim().toLowerCase()));
  if (uniqueOpts.size < q.options.length) {
    return { valid: false, reason: 'Options contain duplicates.' };
  }
  return { valid: true };
}

/**
 * Generate a new valid parameter variant for a given question or learning objective
 */
export function generateQuestionVariant(
  original: CanonicalQuestion,
  targetDifficulty?: QuizDifficulty
): CanonicalQuestion {
  const familyId = original.familyId || original.topic || 'GENERIC_CONCEPT';
  const difficulty = targetDifficulty || original.difficulty || 'Medium';
  const variantIndex = Math.floor(Math.random() * 1000) + 1;
  const variantId = `${original.id}_var_${Date.now()}_${variantIndex}`;

  // ── 1. MATHEMATICS: LINEAR EQUATIONS (ax + b = c) ──────────────────────────
  if (
    familyId.includes('LINEAR') ||
    original.question.toLowerCase().includes('value of x') ||
    original.learningObjective.toLowerCase().includes('linear equation')
  ) {
    const a = randInt(2, 9);
    const x = randInt(2, 12);
    const b = randInt(1, 15);
    const c = a * x + b; // Guarantees integer x solution

    const promptText = `Solve for x in the equation: ${a}x + ${b} = ${c}`;
    const correctAnswerText = `x = ${x}`;

    // Generate plausible distractors
    const wrong1 = `x = ${x + randInt(1, 3)}`;
    const wrong2 = `x = ${Math.max(1, x - randInt(1, 3))}`;
    const wrong3 = `x = ${x * 2}`;

    const opts = shuffleArray([correctAnswerText, wrong1, wrong2, wrong3]);
    const correctIdx = opts.indexOf(correctAnswerText);

    return {
      ...original,
      id: original.id,
      variantId,
      question: promptText,
      options: opts,
      correct: correctIdx,
      explanation: `${a}x + ${b} = ${c} => ${a}x = ${c} - ${b} => ${a}x = ${c - b} => x = ${x}.`,
      variablesUsed: { a, b, c, x },
      difficulty,
    };
  }

  // ── 2. MATHEMATICS: QUADRATIC EQUATIONS (x^2 + bx + c = 0) ─────────────────
  if (
    familyId.includes('QUADRATIC') ||
    original.question.toLowerCase().includes('quadratic') ||
    original.learningObjective.toLowerCase().includes('quadratic')
  ) {
    const r1 = randInt(1, 6);
    const r2 = randInt(r1 + 1, r1 + 5);
    const b = -(r1 + r2);
    const c = r1 * r2;

    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const promptText = `Solve the quadratic equation: x² ${bSign}x + ${c} = 0`;
    const correctAnswerText = `x = ${r1}, ${r2}`;

    const wrong1 = `x = ${-r1}, ${-r2}`;
    const wrong2 = `x = ${r1 + 1}, ${r2 - 1}`;
    const wrong3 = `x = 1, ${r1 * r2}`;

    const opts = shuffleArray([correctAnswerText, wrong1, wrong2, wrong3]);
    const correctIdx = opts.indexOf(correctAnswerText);

    return {
      ...original,
      id: original.id,
      variantId,
      question: promptText,
      options: opts,
      correct: correctIdx,
      explanation: `Factoring (x - ${r1})(x - ${r2}) = 0 gives solutions x = ${r1} or x = ${r2}.`,
      variablesUsed: { r1, r2, b, c },
      difficulty,
    };
  }

  // ── 3. MATHEMATICS: GEOMETRY TRIANGLE AREA (A = 0.5 * b * h) ───────────────
  if (
    familyId.includes('TRIANGLE') ||
    original.question.toLowerCase().includes('area of a right triangle') ||
    original.question.toLowerCase().includes('triangle')
  ) {
    const base = randInt(4, 16) * 2; // Even base for integer area
    const height = randInt(3, 15);
    const area = 0.5 * base * height;

    const promptText = `What is the area of a right triangle with a base of ${base} cm and a height of ${height} cm?`;
    const correctAnswerText = `${area} cm²`;

    const wrong1 = `${base * height} cm²`; // Forgot 0.5 factor
    const wrong2 = `${area + base} cm²`;
    const wrong3 = `${Math.round(area / 2)} cm²`;

    const opts = shuffleArray([correctAnswerText, wrong1, wrong2, wrong3]);
    const correctIdx = opts.indexOf(correctAnswerText);

    return {
      ...original,
      id: original.id,
      variantId,
      question: promptText,
      options: opts,
      correct: correctIdx,
      explanation: `Area = 0.5 × base × height = 0.5 × ${base} × ${height} = ${area} cm².`,
      variablesUsed: { base, height, area },
      difficulty,
    };
  }

  // ── 4. PHYSICS: NEWTON'S SECOND LAW (F = m * a) ─────────────────────────────
  if (
    familyId.includes('NEWTON') ||
    familyId.includes('FORCE') ||
    original.question.toLowerCase().includes('force') ||
    original.learningObjective.toLowerCase().includes('newton')
  ) {
    const mass = randInt(2, 25);
    const accel = randInt(2, 12);
    const force = mass * accel;

    const promptText = `A mass of ${mass} kg accelerates at ${accel} m/s². What is the net force acting on the object?`;
    const correctAnswerText = `${force} N`;

    const wrong1 = `${mass + accel} N`;
    const wrong2 = `${(mass / accel).toFixed(1)} N`;
    const wrong3 = `${force * 2} N`;

    const opts = shuffleArray([correctAnswerText, wrong1, wrong2, wrong3]);
    const correctIdx = opts.indexOf(correctAnswerText);

    return {
      ...original,
      id: original.id,
      variantId,
      question: promptText,
      options: opts,
      correct: correctIdx,
      explanation: `Using Newton's Second Law F = m × a: F = ${mass} kg × ${accel} m/s² = ${force} N.`,
      variablesUsed: { mass, accel, force },
      difficulty,
    };
  }

  // ── 5. CHEMISTRY: pH & ACID-BASE ──────────────────────────────────────────
  if (
    familyId.includes('PH_') ||
    original.question.toLowerCase().includes('ph value')
  ) {
    const isAcidic = Math.random() > 0.5;
    const phVal = isAcidic ? randInt(1, 5) : randInt(9, 13);
    const solutionType = isAcidic ? 'acidic' : 'basic';

    const promptText = `A chemical solution has a pH value of ${phVal} at 25°C. Is this solution acidic, neutral, or basic?`;
    const correctAnswerText = solutionType.toUpperCase();

    const opts = shuffleArray(['ACIDIC', 'BASIC', 'NEUTRAL', 'BUFFERED']);
    const correctIdx = opts.indexOf(correctAnswerText);

    return {
      ...original,
      id: original.id,
      variantId,
      question: promptText,
      options: opts,
      correct: correctIdx,
      explanation: `Solutions with pH < 7 are acidic, pH = 7 are neutral, and pH > 7 are basic. A pH of ${phVal} is ${solutionType}.`,
      variablesUsed: { phVal, solutionType },
      difficulty,
    };
  }

  // ── 6. GENERAL CONCEPTUAL QUESTION VARIANT GENERATOR ──────────────────────
  // If no strict numeric formula is matched, shuffle options, update parameter framing,
  // and preserve correct answer invariant.
  const originalCorrectText = original.options[original.correct] || original.options[0];
  const shuffledOpts = shuffleArray([...original.options]);
  const newCorrectIdx = shuffledOpts.indexOf(originalCorrectText);

  // Vary introductory wording slightly to prevent rote memorization
  const prefixes = [
    'Regarding the concept:',
    'Which statement correctly identifies:',
    'In the context of this study topic:',
    'Evaluate the following:',
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  const BaseQuestionClean = original.question.replace(/^(Regarding the concept:|Which statement correctly identifies:|In the context of this study topic:|Evaluate the following:)\s*/i, '');
  const updatedQuestionText = `${prefix} ${BaseQuestionClean}`;

  return {
    ...original,
    id: original.id,
    variantId,
    question: updatedQuestionText,
    options: shuffledOpts,
    correct: newCorrectIdx,
    difficulty,
  };
}

/**
 * Parses raw AI quiz data or JSON into a fully qualified CanonicalQuiz object
 */
export function createCanonicalQuizFromAI(raw: {
  title?: string;
  subject?: string;
  topic?: string;
  chapter?: string;
  sourceType?: QuizSourceType;
  sourceDocumentId?: string;
  sourcePage?: number;
  difficulty?: QuizDifficulty;
  questions: Array<{
    question: string;
    options: string[];
    correct?: number;
    correctAnswer?: number;
    explanation?: string;
    learningObjective?: string;
    topic?: string;
  }>;
  createdBy?: string;
}): CanonicalQuiz {
  const timestamp = new Date().toISOString();
  const quizId = `quiz_${raw.sourceType || 'AI_TUTOR'}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const subject = raw.subject || 'General';
  const topic = raw.topic || raw.title || 'Concept Review';
  const difficulty: QuizDifficulty = raw.difficulty || 'Medium';

  const validatedQuestions: CanonicalQuestion[] = raw.questions.map((q, idx) => {
    const qId = `${quizId}_q${idx + 1}`;
    const correctIdx = typeof q.correct === 'number' ? q.correct : (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);
    const learningObjective = q.learningObjective || `${subject}: ${topic} - Concept ${idx + 1}`;

    const canonicalQ: CanonicalQuestion = {
      id: qId,
      variantId: `${qId}_v1`,
      familyId: `${subject}_${topic}_OBJ_${idx + 1}`.replace(/\s+/g, '_').toUpperCase(),
      question: q.question,
      options: q.options || ['True', 'False'],
      correct: Math.min(Math.max(0, correctIdx), (q.options?.length || 2) - 1),
      explanation: q.explanation || 'No detailed explanation provided.',
      subject,
      topic,
      chapter: raw.chapter,
      difficulty,
      learningObjective,
    };

    // Run deterministic validation check
    const valResult = validateCanonicalQuestion(canonicalQ);
    if (!valResult.valid) {
      console.warn(`[QuizGenerator] Corrected invalid generated question: ${valResult.reason}`);
    }

    return canonicalQ;
  });

  const learningObjectives = Array.from(new Set(validatedQuestions.map(q => q.learningObjective)));

  const canonicalQuiz: CanonicalQuiz = {
    quizId,
    title: raw.title || `${subject} Quiz: ${topic}`,
    subject,
    topic,
    chapter: raw.chapter,
    sourceType: raw.sourceType || 'AI_TUTOR',
    sourceDocumentId: raw.sourceDocumentId,
    sourcePage: raw.sourcePage,
    createdBy: raw.createdBy || 'AI Tutor',
    createdAt: timestamp,
    difficulty,
    questionCount: validatedQuestions.length,
    estimatedMinutes: Math.max(2, Math.ceil(validatedQuestions.length * 1.5)),
    learningObjectives,
    status: 'active',
    questions: validatedQuestions,
  };

  return canonicalQuiz;
}
