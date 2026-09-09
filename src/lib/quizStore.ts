import { supabase } from '@/integrations/supabase/client';
import { CanonicalQuiz, QuizAttemptRecord } from '@/types/canonicalQuiz';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  subject: string;
  grade: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const AVAILABLE_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Geography', 'History', 'Economics', 'English', 'Afan Oromo'
];

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  // Mathematics
  { id: 'q_math_9_1', question: 'What is the value of x if 2x + 5 = 15?', options: ['x = 3', 'x = 5', 'x = 7', 'x = 10'], correct: 1, explanation: '2x = 15 - 5 => 2x = 10 => x = 5.', subject: 'Mathematics', grade: 9, difficulty: 'Easy' },
  { id: 'q_math_9_2', question: 'What is the area of a right triangle with base 6cm and height 8cm?', options: ['14 cm²', '24 cm²', '48 cm²', '28 cm²'], correct: 1, explanation: 'Area = (1/2) * base * height = 0.5 * 6 * 8 = 24 cm².', subject: 'Mathematics', grade: 9, difficulty: 'Easy' },
  { id: 'q_math_10_1', question: 'Solve the quadratic equation x² - 5x + 6 = 0.', options: ['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = 0, 5'], correct: 1, explanation: '(x-2)(x-3) = 0, so x = 2 or x = 3.', subject: 'Mathematics', grade: 10, difficulty: 'Medium' },
  { id: 'q_math_11_1', question: 'What is the derivative of f(x) = 3x² + 2x - 5?', options: ['6x + 2', '3x + 2', '6x - 5', '6x² + 2'], correct: 0, explanation: 'Using the power rule: d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-5) = 0.', subject: 'Mathematics', grade: 11, difficulty: 'Medium' },
  { id: 'q_math_12_1', question: 'What is the integral ∫ 2x dx?', options: ['x² + C', '2x² + C', 'x + C', '2 + C'], correct: 0, explanation: '∫ 2x dx = 2(x²/2) + C = x² + C.', subject: 'Mathematics', grade: 12, difficulty: 'Hard' },

  // Physics
  { id: 'q_phys_9_1', question: "What is Newton's Second Law of Motion?", options: ['F = mv', 'F = ma', 'F = mg', 'F = mc²'], correct: 1, explanation: "Newton's Second Law states F = ma (Force = mass × acceleration).", subject: 'Physics', grade: 9, difficulty: 'Easy' },
  { id: 'q_phys_10_1', question: 'What is the SI unit of electric current?', options: ['Volt', 'Watt', 'Ampere', 'Ohm'], correct: 2, explanation: 'The Ampere (A) is the SI unit of electric current.', subject: 'Physics', grade: 10, difficulty: 'Easy' },
  { id: 'q_phys_11_1', question: 'What is the speed of light in a vacuum?', options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '1.5 × 10⁸ m/s'], correct: 1, explanation: 'Light travels at approximately 3 × 10⁸ meters per second in vacuum.', subject: 'Physics', grade: 11, difficulty: 'Medium' },
  { id: 'q_phys_12_1', question: 'According to Einstein’s mass-energy equivalence, E = ?', options: ['mc', 'mc²', '1/2 mv²', 'mgh'], correct: 1, explanation: 'E = mc², where E is energy, m is mass, and c is the speed of light.', subject: 'Physics', grade: 12, difficulty: 'Hard' },

  // Chemistry
  { id: 'q_chem_9_1', question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0, explanation: 'Water consists of 2 Hydrogen atoms and 1 Oxygen atom.', subject: 'Chemistry', grade: 9, difficulty: 'Easy' },
  { id: 'q_chem_10_1', question: 'What is the pH value of a neutral solution at 25°C?', options: ['0', '7', '14', '1'], correct: 1, explanation: 'A neutral solution like pure water has a pH of 7.', subject: 'Chemistry', grade: 10, difficulty: 'Easy' },
  { id: 'q_chem_11_1', question: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correct: 1, explanation: 'Carbon has 6 protons, giving it an atomic number of 6.', subject: 'Chemistry', grade: 11, difficulty: 'Easy' },
  { id: 'q_chem_12_1', question: 'Which gas is produced when an acid reacts with an active metal?', options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'], correct: 1, explanation: 'Acid + Metal → Salt + Hydrogen gas (H₂).', subject: 'Chemistry', grade: 12, difficulty: 'Medium' },

  // Biology
  { id: 'q_bio_9_1', question: 'What is known as the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correct: 2, explanation: 'Mitochondria generate energy (ATP) for cellular processes.', subject: 'Biology', grade: 9, difficulty: 'Easy' },
  { id: 'q_bio_10_1', question: 'What process do green plants use to manufacture food using sunlight?', options: ['Respiration', 'Photosynthesis', 'Transpiration', 'Osmosis'], correct: 1, explanation: 'Photosynthesis converts light, CO2, and water into glucose and oxygen.', subject: 'Biology', grade: 10, difficulty: 'Easy' },
  { id: 'q_bio_11_1', question: 'Which blood cells are primarily responsible for fighting infections?', options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'], correct: 1, explanation: 'White blood cells (leukocytes) form the primary defense of the immune system.', subject: 'Biology', grade: 11, difficulty: 'Medium' },
  { id: 'q_bio_12_1', question: 'What is the structure of DNA described as?', options: ['Single helix', 'Double helix', 'Triple fold', 'Linear chain'], correct: 1, explanation: 'Watson and Crick discovered DNA has a double helix structure.', subject: 'Biology', grade: 12, difficulty: 'Medium' },

  // Geography
  { id: 'q_geo_9_1', question: 'What is the longest river in Africa?', options: ['Congo', 'Nile', 'Niger', 'Zambezi'], correct: 1, explanation: 'The Nile is the longest river in Africa and the world.', subject: 'Geography', grade: 9, difficulty: 'Easy' },
  { id: 'q_geo_10_1', question: 'What layer of the Earth lies directly beneath the crust?', options: ['Inner core', 'Outer core', 'Mantle', 'Lithosphere'], correct: 2, explanation: 'The mantle lies directly below the Earth crust.', subject: 'Geography', grade: 10, difficulty: 'Medium' },

  // History
  { id: 'q_hist_9_1', question: 'In which year did the Battle of Adwa take place?', options: ['1888', '1896', '1935', '1941'], correct: 1, explanation: 'The Battle of Adwa took place on March 1, 1896.', subject: 'History', grade: 9, difficulty: 'Easy' },
  { id: 'q_hist_10_1', question: 'Which ancient civilization built the Pyramids of Giza?', options: ['Mesopotamians', 'Ancient Egyptians', 'Romans', 'Greeks'], correct: 1, explanation: 'The Pyramids of Giza were built by Ancient Egyptians.', subject: 'History', grade: 10, difficulty: 'Easy' },

  // Economics
  { id: 'q_econ_9_1', question: 'What does GDP stand for?', options: ['General Data Processing', 'Gross Domestic Product', 'Global Development Plan', 'Government Deposit Program'], correct: 1, explanation: 'GDP stands for Gross Domestic Product.', subject: 'Economics', grade: 9, difficulty: 'Easy' },

  // English
  { id: 'q_eng_9_1', question: 'Which word is a synonym for "benevolent"?', options: ['Cruel', 'Kind', 'Hostile', 'Selfish'], correct: 1, explanation: 'Benevolent means well-meaning and kindly.', subject: 'English', grade: 9, difficulty: 'Easy' },

  // Afan Oromo
  { id: 'q_ao_9_1', question: 'Afaan Oromoo keessatti "Gadaa" jechuun maali?', options: ['Sirna bulchiinsaa fi hawaasummaa', 'Mootummaa gurguddaa', 'Lola aadaa', 'Barnoota durii'], correct: 0, explanation: 'Sirni Gadaa sirna demokraatawaa aadaa Oromoo ti.', subject: 'Afan Oromo', grade: 9, difficulty: 'Easy' }
];

// Cache for quiz questions
let cachedQuestions: QuizQuestion[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL QUIZ STORAGE (KNOWLEDGE22VV Specification)
// ─────────────────────────────────────────────────────────────────────────────
const CANONICAL_QUIZZES_KEY = 'ku_canonical_quizzes';

function getQuizAttemptsKey(userId?: string | null): string {
  return userId ? `ku_quiz_attempts_${userId}` : 'ku_quiz_attempts_guest';
}

export function getCanonicalQuizzes(): CanonicalQuiz[] {
  try {
    const raw = localStorage.getItem(CANONICAL_QUIZZES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCanonicalQuizById(quizId: string): CanonicalQuiz | null {
  const all = getCanonicalQuizzes();
  return all.find(q => q.quizId === quizId) || null;
}

export function saveCanonicalQuiz(quiz: CanonicalQuiz): CanonicalQuiz {
  const existing = getCanonicalQuizzes();
  const idx = existing.findIndex(q => q.quizId === quiz.quizId);
  let updated: CanonicalQuiz[];

  if (idx >= 0) {
    existing[idx] = quiz;
    updated = existing;
  } else {
    updated = [quiz, ...existing];
  }

  try {
    localStorage.setItem(CANONICAL_QUIZZES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save Canonical Quiz locally:', e);
  }

  // Also sync individual questions into legacy quiz bank for backward compatibility
  for (const q of quiz.questions) {
    saveAITutorQuizQuestion({
      id: q.id,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      subject: q.subject || quiz.subject,
      grade: 9,
      difficulty: q.difficulty === 'Advanced' ? 'Hard' : q.difficulty,
    });
  }

  return quiz;
}

export function recordQuizAttempt(attempt: QuizAttemptRecord, userId?: string | null): void {
  try {
    const key = getQuizAttemptsKey(userId);
    const raw = localStorage.getItem(key);
    const existing: QuizAttemptRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [attempt, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));

    // Also persist to Supabase if authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      const activeUserId = userId || user?.id;
      if (activeUserId) {
        supabase.from('quiz_attempts').insert({
          user_id: activeUserId,
          quiz_id: attempt.quizId,
          subject: attempt.subject,
          grade: 9,
          score: attempt.score,
          total_questions: attempt.totalQuestions,
          percentage: attempt.percentage,
          time_spent_seconds: attempt.timeSpentSeconds || 0,
          passed: attempt.percentage >= 70,
          details: {
            questionAttempts: attempt.questionAttempts,
            completedAt: attempt.completedAt,
          },
        } as any).then(({ error }) => {
          if (error) console.warn('[QuizStore] Supabase quiz_attempts insert error:', error);
        });
      }
    }).catch(err => {
      console.warn('[QuizStore] Auth check error:', err);
    });
  } catch (e) {
    console.warn('Failed to record quiz attempt:', e);
  }
}

export function getQuizAttempts(quizId?: string, userId?: string | null): QuizAttemptRecord[] {
  try {
    const key = getQuizAttemptsKey(userId);
    const raw = localStorage.getItem(key);
    const existing: QuizAttemptRecord[] = raw ? JSON.parse(raw) : [];
    if (quizId) {
      return existing.filter(a => a.quizId === quizId);
    }
    return existing;
  } catch {
    return [];
  }
}

export const getAITutorSavedQuizzes = (): QuizQuestion[] => {
  try {
    const raw = localStorage.getItem('ku_ai_tutor_quizzes');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAITutorQuizQuestion = (q: Omit<QuizQuestion, 'id'> & { id?: string }): QuizQuestion => {
  const existing = getAITutorSavedQuizzes();
  const id = q.id || `ai_tutor_q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const newQuestion: QuizQuestion = {
    id,
    question: q.question,
    options: q.options || [],
    correct: typeof q.correct === 'number' ? q.correct : 0,
    explanation: q.explanation || '',
    subject: q.subject || 'AI Tutor',
    grade: q.grade || 9,
    difficulty: q.difficulty || 'Medium',
  };

  // Avoid duplicates with same question text
  const isDuplicate = existing.some((item) => item.question === newQuestion.question);
  if (!isDuplicate) {
    const updated = [newQuestion, ...existing];
    try {
      localStorage.setItem('ku_ai_tutor_quizzes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save AI Tutor Quiz to localStorage:', e);
    }
  }

  // Update in memory cache as well
  if (!cachedQuestions.some((item) => item.id === newQuestion.id)) {
    cachedQuestions = [newQuestion, ...cachedQuestions];
  }

  return newQuestion;
};

export const setCachedQuestions = (questions: QuizQuestion[]) => {
  const aiSaved = getAITutorSavedQuizzes();
  const merged = [...questions];

  for (const item of aiSaved) {
    if (!merged.some((m) => m.id === item.id || m.question === item.question)) {
      merged.unshift(item);
    }
  }

  for (const item of DEFAULT_QUIZ_QUESTIONS) {
    if (!merged.some((m) => m.id === item.id || m.question === item.question)) {
      merged.push(item);
    }
  }

  cachedQuestions = merged;
};

export const getStoredQuestions = (): QuizQuestion[] => {
  if (cachedQuestions.length === 0) {
    setCachedQuestions(DEFAULT_QUIZ_QUESTIONS);
  }
  return cachedQuestions;
};

export const getQuestionsBySubjectAndGrade = (subject: string, grade: number): QuizQuestion[] => {
  const all = getStoredQuestions();
  let matches = all.filter(q => q.subject === subject && (grade === 0 || q.grade === grade));
  if (matches.length === 0 && subject) {
    matches = all.filter(q => q.subject === subject);
  }
  if (matches.length === 0) {
    matches = all;
  }
  return matches;
};

export const getSubjects = (): string[] => {
  const all = getStoredQuestions();
  const subjects = [...new Set(all.map(q => q.subject))];
  for (const sub of AVAILABLE_SUBJECTS) {
    if (!subjects.includes(sub)) subjects.push(sub);
  }
  return subjects;
};

export const getGradesForSubject = (subject: string): number[] => {
  const all = getStoredQuestions();
  const grades = [...new Set(all.filter(q => q.subject === subject).map(q => q.grade))].sort((a, b) => a - b);
  return grades.length > 0 ? grades : [9, 10, 11, 12];
};

// Load questions from Supabase with graceful local fallback
export const loadQuestionsFromSupabase = async (): Promise<QuizQuestion[]> => {
  try {
    const { data, error } = await (supabase as any).from('quiz_questions').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Using local quiz question bank:', error.message || error);
      setCachedQuestions(DEFAULT_QUIZ_QUESTIONS);
      return getStoredQuestions();
    }
    if (data && data.length > 0) {
      const mapped: QuizQuestion[] = data.map((q: any) => ({
        id: q.id,
        question: q.question,
        options: (q.options as string[]) || [],
        correct: q.correct_index ?? q.correct ?? 0,
        explanation: q.explanation || '',
        subject: q.subject || 'General',
        grade: q.grade || 9,
        difficulty: (q.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      }));
      setCachedQuestions(mapped);
      return getStoredQuestions();
    }
  } catch (err) {
    console.warn('Error fetching quiz_questions from database, falling back to local questions:', err);
  }
  setCachedQuestions(DEFAULT_QUIZ_QUESTIONS);
  return getStoredQuestions();
};


