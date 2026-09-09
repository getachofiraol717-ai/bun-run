// ============================================================
// personalityDNA.ts
// Personality DNA System - The Core AI Architecture
// ============================================================

/**
 * PERSONALITY DNA MODEL
 * 
 * Every personality is defined by 10 core DNA traits.
 * These traits determine how the AI thinks, feels, and teaches.
 */

export interface PersonalityDNA {
  curiosity: number;              // 0-100: Drive to explore and discover
  empathy: number;                // 0-100: Emotional understanding of learners
  discipline: number;             // 0-100: Strictness and rigor
  creativity: number;             // 0-100: Innovation and novel approaches
  analytical_depth: number;       // 0-100: Deep thinking and precision
  humor: number;                  // 0-100: Lightheartedness and jokes
  optimism: number;               // 0-100: Positive outlook and encouragement
  formality: number;              // 0-100: Professional vs casual tone
  emotional_warmth: number;       // 0-100: Friendliness and personal connection
  challenge_intensity: number;    // 0-100: Difficulty and push for excellence
}

/**
 * PERSONALITY DNA ANALYZER
 * Generates insights based on DNA configuration
 */
export class PersonalityDNAAnalyzer {
  static analyzeDNA(dna: PersonalityDNA): {
    archetype: string;
    strengths: string[];
    weaknesses: string[];
    bestFor: string[];
    teachingStyle: string;
    emotionalProfile: string;
  } {
    const analyze = (value: number) => {
      if (value >= 75) return 'high';
      if (value >= 50) return 'moderate';
      return 'low';
    };

    const traits = {
      curiosity: analyze(dna.curiosity),
      empathy: analyze(dna.empathy),
      discipline: analyze(dna.discipline),
      creativity: analyze(dna.creativity),
      analytical: analyze(dna.analytical_depth),
      humor: analyze(dna.humor),
      optimism: analyze(dna.optimism),
      formality: analyze(dna.formality),
      warmth: analyze(dna.emotional_warmth),
      challenge: analyze(dna.challenge_intensity),
    };

    let archetype = 'Custom Hybrid';
    let teachingStyle = '';
    let emotionalProfile = '';
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const bestFor: string[] = [];

    // Archetype Detection
    if (traits.discipline === 'high' && traits.challenge === 'high' && traits.empathy === 'low') {
      archetype = 'Strict Academy Mentor';
      teachingStyle = 'Rigorous, direct corrections, high standards';
      emotionalProfile = 'Professional and matter-of-fact';
      strengths.push('Rigorous teaching', 'High standards', 'Structured learning');
      weaknesses.push('Can be discouraging', 'Less personalized', 'Limited empathy');
      bestFor.push('Competitive learners', 'Exam preparation', 'Advanced topics');
    } else if (traits.curiosity === 'high' && traits.creativity === 'high' && traits.warmth === 'high') {
      archetype = 'Playful Explorer';
      teachingStyle = 'Discovery-based, fun challenges, curiosity-driven';
      emotionalProfile = 'Enthusiastic and encouraging';
      strengths.push('Engaging and fun', 'Encourages exploration', 'High energy');
      weaknesses.push('May lack depth', 'Can be unfocused', 'Less structured');
      bestFor.push('Beginners', 'Creative learners', 'Motivation building');
    } else if (traits.analytical === 'high' && traits.curiosity === 'high' && traits.formality === 'high') {
      archetype = 'Research Scientist';
      teachingStyle = 'Evidence-based, experimental, hypothesis-driven';
      emotionalProfile = 'Logical and inquisitive';
      strengths.push('Deep analysis', 'Precise explanations', 'Evidence-based');
      weaknesses.push('Can be dry', 'Less emotional', 'Complex for beginners');
      bestFor.push('Advanced learners', 'Research topics', 'STEM subjects');
    } else if (traits.empathy === 'high' && traits.optimism === 'high' && traits.warmth === 'high') {
      archetype = 'Motivation Specialist';
      teachingStyle = 'Emotionally intelligent, encouraging, growth-focused';
      emotionalProfile = 'Warm and supportive';
      strengths.push('High engagement', 'Burnout recovery', 'Emotional support');
      weaknesses.push('May lack rigor', 'Less challenging', 'Softer approach');
      bestFor.push('Struggling learners', 'Motivation needs', 'Emotional support');
    } else if (traits.discipline === 'high' && traits.challenge === 'high' && traits.warmth === 'high') {
      archetype = 'Tactical Military Coach';
      teachingStyle = 'Mission-driven, structured, goal-focused with support';
      emotionalProfile = 'Determined and supportive';
      strengths.push('Goal achievement', 'Clear structure', 'Motivating');
      weaknesses.push('Can be intense', 'Less flexibility', 'Demanding');
      bestFor.push('Goal-oriented learners', 'Performance improvement', 'Competitive goals');
    }

    // Add trait-based strengths/weaknesses
    if (dna.curiosity >= 75) strengths.push('Encourages exploration and discovery');
    if (dna.creativity >= 75) strengths.push('Creative problem-solving approaches');
    if (dna.empathy >= 75) strengths.push('Understands learner emotions');
    if (dna.emotional_warmth >= 75) strengths.push('Creates safe, warm environment');

    if (dna.discipline < 40) weaknesses.push('May be too lenient');
    if (dna.empathy < 40) weaknesses.push('May not understand emotional needs');
    if (dna.creativity < 40) weaknesses.push('Can be conventional');
    if (dna.analytical_depth < 40) weaknesses.push('May lack depth of analysis');

    return {
      archetype,
      strengths,
      weaknesses,
      bestFor,
      teachingStyle,
      emotionalProfile,
    };
  }

  /**
   * Generate DNA visualization data
   */
  static generateVisualization(dna: PersonalityDNA) {
    return {
      radar: [
        { label: 'Curiosity', value: dna.curiosity },
        { label: 'Empathy', value: dna.empathy },
        { label: 'Discipline', value: dna.discipline },
        { label: 'Creativity', value: dna.creativity },
        { label: 'Analytical', value: dna.analytical_depth },
        { label: 'Humor', value: dna.humor },
        { label: 'Optimism', value: dna.optimism },
        { label: 'Formality', value: dna.formality },
        { label: 'Warmth', value: dna.emotional_warmth },
        { label: 'Challenge', value: dna.challenge_intensity },
      ],
      spectrum: {
        friendlinessScale: (dna.emotional_warmth + dna.empathy) / 2,
        rigorousScale: (dna.discipline + dna.analytical_depth + dna.challenge_intensity) / 3,
        creativityScale: (dna.creativity + dna.curiosity) / 2,
        professionalScale: dna.formality,
        positivityScale: dna.optimism,
      },
    };
  }

  /**
   * Calculate DNA similarity between two personalities
   */
  static calculateSimilarity(dna1: PersonalityDNA, dna2: PersonalityDNA): number {
    const diff = Math.abs(dna1.curiosity - dna2.curiosity) +
                 Math.abs(dna1.empathy - dna2.empathy) +
                 Math.abs(dna1.discipline - dna2.discipline) +
                 Math.abs(dna1.creativity - dna2.creativity) +
                 Math.abs(dna1.analytical_depth - dna2.analytical_depth) +
                 Math.abs(dna1.humor - dna2.humor) +
                 Math.abs(dna1.optimism - dna2.optimism) +
                 Math.abs(dna1.formality - dna2.formality) +
                 Math.abs(dna1.emotional_warmth - dna2.emotional_warmth) +
                 Math.abs(dna1.challenge_intensity - dna2.challenge_intensity);
    
    // Maximum possible difference is 1000 (10 traits × 100)
    return 100 - (diff / 1000) * 100;
  }

  /**
   * Merge two personality DNAs
   */
  static mergeDNA(dna1: PersonalityDNA, dna2: PersonalityDNA, weight1 = 0.5): PersonalityDNA {
    const weight2 = 1 - weight1;
    return {
      curiosity: Math.round(dna1.curiosity * weight1 + dna2.curiosity * weight2),
      empathy: Math.round(dna1.empathy * weight1 + dna2.empathy * weight2),
      discipline: Math.round(dna1.discipline * weight1 + dna2.discipline * weight2),
      creativity: Math.round(dna1.creativity * weight1 + dna2.creativity * weight2),
      analytical_depth: Math.round(dna1.analytical_depth * weight1 + dna2.analytical_depth * weight2),
      humor: Math.round(dna1.humor * weight1 + dna2.humor * weight2),
      optimism: Math.round(dna1.optimism * weight1 + dna2.optimism * weight2),
      formality: Math.round(dna1.formality * weight1 + dna2.formality * weight2),
      emotional_warmth: Math.round(dna1.emotional_warmth * weight1 + dna2.emotional_warmth * weight2),
      challenge_intensity: Math.round(dna1.challenge_intensity * weight1 + dna2.challenge_intensity * weight2),
    };
  }

  /**
   * Evolve DNA based on feedback
   */
  static evolveDNA(dna: PersonalityDNA, feedback: {
    effectiveTraits?: string[];
    ineffectiveTraits?: string[];
    learnerSatisfaction?: number;
  }): PersonalityDNA {
    const evolved = { ...dna };
    
    // Boost effective traits
    if (feedback.effectiveTraits) {
      feedback.effectiveTraits.forEach(trait => {
        if (trait in evolved) {
          (evolved as any)[trait] = Math.min(100, (evolved as any)[trait] + 5);
        }
      });
    }

    // Reduce ineffective traits
    if (feedback.ineffectiveTraits) {
      feedback.ineffectiveTraits.forEach(trait => {
        if (trait in evolved) {
          (evolved as any)[trait] = Math.max(0, (evolved as any)[trait] - 5);
        }
      });
    }

    // Learner satisfaction influences optimism and warmth
    if (feedback.learnerSatisfaction) {
      if (feedback.learnerSatisfaction > 75) {
        evolved.emotional_warmth = Math.min(100, evolved.emotional_warmth + 3);
        evolved.optimism = Math.min(100, evolved.optimism + 3);
      } else if (feedback.learnerSatisfaction < 50) {
        evolved.empathy = Math.min(100, evolved.empathy + 5);
      }
    }

    return evolved;
  }
}

/**
 * PERSONALITY MEMORY BEHAVIOR
 */
export interface MemoryBehavior {
  type: 'personal' | 'balanced' | 'minimal' | 'achievement_focused' | 'goal_focused' | 'emotional_support';
  recallFrequency: number; // 0-1
  motivationCallbacks: boolean;
  studyHistoryReferences: boolean;
  companionContinuity: boolean;
}

export class MemoryBehaviorEngine {
  static getMemoryStrategy(type: MemoryBehavior['type']) {
    const strategies = {
      personal: {
        recallFrequency: 0.9,
        motivationCallbacks: true,
        studyHistoryReferences: true,
        companionContinuity: true,
        description: 'Highly personalized - remembers everything about learner',
      },
      balanced: {
        recallFrequency: 0.6,
        motivationCallbacks: true,
        studyHistoryReferences: true,
        companionContinuity: true,
        description: 'Balanced approach - maintains context without overwhelming',
      },
      minimal: {
        recallFrequency: 0.2,
        motivationCallbacks: false,
        studyHistoryReferences: false,
        companionContinuity: false,
        description: 'Minimal memory - focuses on present moment',
      },
      achievement_focused: {
        recallFrequency: 0.7,
        motivationCallbacks: true,
        studyHistoryReferences: true,
        companionContinuity: true,
        description: 'Remembers achievements and progress milestones',
      },
      goal_focused: {
        recallFrequency: 0.8,
        motivationCallbacks: true,
        studyHistoryReferences: true,
        companionContinuity: true,
        description: 'Remembers goals and tracks progress toward them',
      },
      emotional_support: {
        recallFrequency: 0.85,
        motivationCallbacks: true,
        studyHistoryReferences: true,
        companionContinuity: true,
        description: 'Remembers emotional journey and provides support',
      },
    };

    return strategies[type];
  }
}

/**
 * EMOTIONAL STYLE SYSTEM
 */
export interface EmotionalStyle {
  success_response: string;
  failure_response: string;
  burnout_response: string;
  confusion_response: string;
  inactivity_response: string;
  achievement_response: string;
}

export class EmotionalStyleGenerator {
  static generateResponses(archetype: string, dna: PersonalityDNA): EmotionalStyle {
    const templates = {
      strict: {
        success_response: "Excellent. Keep pushing your limits. What's next?",
        failure_response: "You can do better. Analyze what went wrong and try again.",
        burnout_response: "You're working too hard. Take a break, but don't lose momentum.",
        confusion_response: "Let's break this down systematically. Focus on fundamentals first.",
        inactivity_response: "Your streak is broken. Get back on track immediately.",
        achievement_response: "Impressive results. You've earned the right to tackle harder material.",
      },
      philosopher: {
        success_response: "Wonderful insight! How does this connect to what you already know?",
        failure_response: "Interesting! Let's explore why this didn't work. What can we learn?",
        burnout_response: "Rest is part of growth. When you're ready, we'll explore deeper.",
        confusion_response: "Perfect moment to ask deeper questions. What do you wonder about?",
        inactivity_response: "Curious to know what's on your mind. Ready to explore together?",
        achievement_response: "You've unlocked new understanding. Remarkable progress, truly.",
      },
      coach: {
        success_response: "Outstanding execution! You're winning at this. Next mission incoming.",
        failure_response: "Tough setback, but champions learn from losses. What's our strategy now?",
        burnout_response: "Time for tactical withdrawal. Recharge, then we advance again.",
        confusion_response: "This is where winners are made. Let's strategize your approach.",
        inactivity_response: "The field misses you, soldier. Time to rejoin the mission.",
        achievement_response: "Mission accomplished! You're advancing through the ranks fast.",
      },
      explorer: {
        success_response: "Adventure! That's amazing! What else can we discover together?",
        failure_response: "Oops! Every great explorer hits dead ends. Let's find the right path!",
        burnout_response: "Even explorers need camp fires! Rest up, then we'll find new worlds.",
        confusion_response: "This is the fun part! We get to figure it out together. Mystery!",
        inactivity_response: "So many worlds to explore! Ready for your next adventure?",
        achievement_response: "You've discovered hidden knowledge! You're becoming a true explorer.",
      },
    };

    return templates[archetype as keyof typeof templates] || templates.philosopher;
  }
}

export default {
  PersonalityDNAAnalyzer,
  MemoryBehaviorEngine,
  EmotionalStyleGenerator,
};
