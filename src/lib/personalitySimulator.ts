// ============================================================
// personalitySimulator.ts
// Personality Simulator - Testing and Evaluation Engine
// ============================================================

import { PersonalityDNA, EmotionalStyle } from './personalityDNA';

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  learnerProfile: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    emotionalState: 'confident' | 'confused' | 'struggling' | 'burnt_out' | 'bored';
    motivation: number; // 0-100
    lastPerformance: 'excellent' | 'good' | 'average' | 'poor';
  };
  prompt: string;
  expectedOutcome?: string;
}

export interface PersonalityResponse {
  text: string;
  emotionalTone: string;
  engagementLevel: number;
  educationalValue: number;
  emotionalIntelligence: number;
  appropriateness: number;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  response: PersonalityResponse;
  metrics: {
    overallQuality: number;
    engagement: number;
    learning: number;
    emotionalSupport: number;
    appropriateness: number;
  };
  feedback: string;
}

// ────────────────────────────────────────────────────────────
// PREDEFINED TEST SCENARIOS
// ────────────────────────────────────────────────────────────

export const TEST_SCENARIOS: SimulationScenario[] = [
  {
    id: 'success',
    name: 'Student Success',
    description: 'Learner just achieved a goal or got a difficult question right',
    learnerProfile: {
      level: 'intermediate',
      emotionalState: 'confident',
      motivation: 85,
      lastPerformance: 'excellent',
    },
    prompt: 'I just solved that complex physics problem you gave me! I think I finally understand it!',
    expectedOutcome: 'Encouraging and supportive, builds on momentum',
  },
  {
    id: 'failure',
    name: 'Student Failure',
    description: 'Learner failed a quiz or got a difficult problem wrong',
    learnerProfile: {
      level: 'beginner',
      emotionalState: 'struggling',
      motivation: 40,
      lastPerformance: 'poor',
    },
    prompt: 'I failed the quiz again. I don\'t think I\'ll ever understand this subject.',
    expectedOutcome: 'Empathetic, constructive, builds confidence',
  },
  {
    id: 'confusion',
    name: 'Student Confusion',
    description: 'Learner expresses confusion about a concept',
    learnerProfile: {
      level: 'beginner',
      emotionalState: 'confused',
      motivation: 50,
      lastPerformance: 'average',
    },
    prompt: 'I don\'t understand how photosynthesis works. It seems too complicated.',
    expectedOutcome: 'Patient, breaks down complexity, clarifies fundamentals',
  },
  {
    id: 'burnout',
    name: 'Burnout Detection',
    description: 'Learner shows signs of burnout',
    learnerProfile: {
      level: 'advanced',
      emotionalState: 'burnt_out',
      motivation: 20,
      lastPerformance: 'poor',
    },
    prompt: 'I\'ve been studying for hours but I can\'t focus. I feel exhausted.',
    expectedOutcome: 'Recognizes burnout, encourages rest, maintains hope',
  },
  {
    id: 'boredom',
    name: 'Disengagement',
    description: 'Learner seems bored or disengaged',
    learnerProfile: {
      level: 'expert',
      emotionalState: 'bored',
      motivation: 30,
      lastPerformance: 'excellent',
    },
    prompt: 'This material feels too easy. I\'m not learning anything new.',
    expectedOutcome: 'Challenges with advanced material, increases difficulty',
  },
  {
    id: 'curiosity',
    name: 'Curiosity Driven',
    description: 'Learner asks an interesting related question',
    learnerProfile: {
      level: 'intermediate',
      emotionalState: 'confident',
      motivation: 80,
      lastPerformance: 'good',
    },
    prompt: 'This is cool! How does this connect to quantum mechanics?',
    expectedOutcome: 'Encourages exploration, makes connections',
  },
  {
    id: 'exam_preparation',
    name: 'Exam Preparation',
    description: 'Learner preparing for a major exam',
    learnerProfile: {
      level: 'intermediate',
      emotionalState: 'struggling',
      motivation: 70,
      lastPerformance: 'average',
    },
    prompt: 'I have a big exam in 2 weeks. How should I study?',
    expectedOutcome: 'Structured plan, motivation, confidence building',
  },
  {
    id: 'creative_thinking',
    name: 'Creative Application',
    description: 'Learner applies knowledge in a creative way',
    learnerProfile: {
      level: 'advanced',
      emotionalState: 'confident',
      motivation: 90,
      lastPerformance: 'excellent',
    },
    prompt: 'What if we used this mathematical principle to solve a real-world environmental problem?',
    expectedOutcome: 'Celebrates creativity, builds on ideas, challenges thinking',
  },
];

// ────────────────────────────────────────────────────────────
// PERSONALITY SIMULATOR ENGINE
// ────────────────────────────────────────────────────────────

export class PersonalitySimulator {
  /**
   * Simulate a personality response to a scenario
   */
  static async simulateResponse(
    personality: {
      name: string;
      archetype: string;
      dna: PersonalityDNA;
      emotional_style: EmotionalStyle;
      teaching_philosophy: string;
    },
    scenario: SimulationScenario
  ): Promise<PersonalityResponse> {
    // Generate response based on personality traits and scenario
    const response = this.generateResponse(personality, scenario);
    
    return {
      text: response,
      emotionalTone: this.analyzeEmotionalTone(personality, response),
      engagementLevel: this.calculateEngagementLevel(personality, scenario, response),
      educationalValue: this.calculateEducationalValue(personality, scenario, response),
      emotionalIntelligence: this.calculateEmotionalIntelligence(personality, scenario, response),
      appropriateness: this.calculateAppropriateness(personality, scenario, response),
    };
  }

  /**
   * Generate a response based on personality traits
   */
  private static generateResponse(
    personality: any,
    scenario: SimulationScenario
  ): string {
    const { learnerProfile, prompt } = scenario;
    const { dna, archetype, emotional_style } = personality;

    // Route based on emotional state
    if (learnerProfile.emotionalState === 'confident') {
      return this.generateSuccessResponse(personality, learnerProfile);
    } else if (learnerProfile.emotionalState === 'struggling') {
      return this.generateFailureResponse(personality, learnerProfile);
    } else if (learnerProfile.emotionalState === 'confused') {
      return this.generateConfusionResponse(personality, learnerProfile);
    } else if (learnerProfile.emotionalState === 'burnt_out') {
      return this.generateBurnoutResponse(personality, learnerProfile);
    } else if (learnerProfile.emotionalState === 'bored') {
      return this.generateBoredomResponse(personality, learnerProfile);
    }

    return '[Personality generates contextual response...]';
  }

  private static generateSuccessResponse(personality: any, profile: any): string {
    const { dna } = personality;
    const templates = {
      high_warmth: [
        "That's wonderful! I'm so proud of your progress!",
        "Fantastic work! Keep that momentum going!",
        "You've really grown - I can see your understanding deepening!",
      ],
      high_challenge: [
        "Excellent! Now let's tackle something even harder.",
        "Good. You've mastered this level. Ready for the next challenge?",
        "Solid performance. What's next in your learning journey?",
      ],
      high_curiosity: [
        "Interesting! How did you approach this? What made it click?",
        "I love your thinking! Can you explain your reasoning?",
        "This is great! What else are you curious about?",
      ],
    };

    if (dna.emotional_warmth >= 75) {
      return templates.high_warmth[Math.floor(Math.random() * templates.high_warmth.length)];
    } else if (dna.challenge_intensity >= 75) {
      return templates.high_challenge[Math.floor(Math.random() * templates.high_challenge.length)];
    } else if (dna.curiosity >= 75) {
      return templates.high_curiosity[Math.floor(Math.random() * templates.high_curiosity.length)];
    }

    return "Great job! You're making excellent progress.";
  }

  private static generateFailureResponse(personality: any, profile: any): string {
    const { dna, archetype } = personality;
    const templates = {
      empathetic: [
        "I know this is frustrating. Let's break it down together.",
        "You're not alone in finding this challenging. Let's approach it differently.",
        "This is a growth opportunity. What can we learn from this?",
      ],
      analytical: [
        "Let's analyze what went wrong. What was the specific challenge?",
        "Every mistake teaches us something. What do you notice?",
        "I see the issue. Here's the correct approach...",
      ],
      encouraging: [
        "This doesn't define you. You're capable of more!",
        "Struggling means learning. Let's keep going!",
        "Each attempt makes you stronger. Try again!",
      ],
    };

    if (dna.empathy >= 70) {
      return templates.empathetic[Math.floor(Math.random() * templates.empathetic.length)];
    } else if (dna.analytical_depth >= 75) {
      return templates.analytical[Math.floor(Math.random() * templates.analytical.length)];
    } else if (dna.optimism >= 75) {
      return templates.encouraging[Math.floor(Math.random() * templates.encouraging.length)];
    }

    return "Let's try a different approach to this problem.";
  }

  private static generateConfusionResponse(personality: any, profile: any): string {
    const { dna } = personality;
    const templates = {
      patient: [
        "That's completely normal. Let's start with the basics.",
        "Good question! Many people find this confusing too.",
        "Let me explain this step by step.",
      ],
      detailed: [
        "Let me break this into smaller, manageable parts.",
        "Here's the fundamental principle: ...",
        "Start here - this is the foundation everything else builds on.",
      ],
    };

    if (dna.emotional_warmth >= 70) {
      return templates.patient[Math.floor(Math.random() * templates.patient.length)];
    } else if (dna.analytical_depth >= 75) {
      return templates.detailed[Math.floor(Math.random() * templates.detailed.length)];
    }

    return "Let me clarify this for you.";
  }

  private static generateBurnoutResponse(personality: any, profile: any): string {
    const { dna } = personality;
    const templates = [
      "You've been working hard. Rest is productive too. Take a break - we'll be here when you return.",
      "Burnout is real. Let's step back and recharge. Your wellbeing comes first.",
      "I notice you're exhausted. Let's focus on self-care before studying more.",
      "You've done amazing work. Sometimes the best thing you can do is rest.",
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static generateBoredomResponse(personality: any, profile: any): string {
    const { dna } = personality;
    const templates = {
      high_challenge: [
        "Ready for advanced material? Let's increase the difficulty.",
        "I have some challenging problems that might interest you.",
        "Let's explore the expert-level applications of this concept.",
      ],
      curious: [
        "What aspects interest you most? Let's dive deeper.",
        "Shall we explore more advanced connections?",
        "What would excite your curiosity about this subject?",
      ],
    };

    if (dna.challenge_intensity >= 75) {
      return templates.high_challenge[Math.floor(Math.random() * templates.high_challenge.length)];
    } else if (dna.curiosity >= 75) {
      return templates.curious[Math.floor(Math.random() * templates.curious.length)];
    }

    return "Let's find something that challenges and excites you.";
  }

  // ────────────────────────────────────────────────────────────
  // RESPONSE EVALUATION METRICS
  // ────────────────────────────────────────────────────────────

  private static analyzeEmotionalTone(personality: any, response: string): string {
    const { dna } = personality;
    if (dna.emotional_warmth >= 75) return 'warm and supportive';
    if (dna.discipline >= 75) return 'direct and rigorous';
    if (dna.humor >= 70) return 'playful and light';
    return 'neutral and professional';
  }

  private static calculateEngagementLevel(personality: any, scenario: SimulationScenario, response: string): number {
    const { dna } = personality;
    let score = 50;

    if (dna.humor >= 70) score += 15;
    if (dna.curiosity >= 75) score += 10;
    if (dna.emotional_warmth >= 75) score += 15;
    if (dna.creativity >= 75) score += 10;

    if (scenario.learnerProfile.emotionalState === 'bored' && dna.challenge_intensity >= 75) score += 15;
    if (scenario.learnerProfile.emotionalState === 'struggling' && dna.empathy >= 75) score += 15;

    return Math.min(100, score);
  }

  private static calculateEducationalValue(personality: any, scenario: SimulationScenario, response: string): number {
    const { dna } = personality;
    let score = 60;

    if (dna.analytical_depth >= 75) score += 20;
    if (dna.creativity >= 70) score += 10;
    if (scenario.learnerProfile.level === 'beginner' && dna.discipline >= 70) score += 5;
    if (scenario.learnerProfile.level === 'advanced' && dna.curiosity >= 80) score += 5;

    return Math.min(100, score);
  }

  private static calculateEmotionalIntelligence(personality: any, scenario: SimulationScenario, response: string): number {
    const { dna } = personality;
    let score = 50;

    if (dna.empathy >= 75) score += 25;
    if (dna.emotional_warmth >= 75) score += 15;
    if (dna.optimism >= 70) score += 10;

    if (scenario.learnerProfile.emotionalState === 'burnt_out' && dna.empathy >= 70) score += 10;

    return Math.min(100, score);
  }

  private static calculateAppropriateness(personality: any, scenario: SimulationScenario, response: string): number {
    const { dna } = personality;
    let score = 70;

    if (dna.formality >= 75 && scenario.learnerProfile.level === 'advanced') score += 10;
    if (dna.humor >= 70 && scenario.learnerProfile.level === 'beginner') score += 5;
    if (dna.discipline >= 80 && scenario.learnerProfile.emotionalState === 'confident') score += 10;

    return Math.min(100, score);
  }

  /**
   * Run a complete simulation session
   */
  static async runFullSimulation(personality: any): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const scenario of TEST_SCENARIOS.slice(0, 5)) {
      const response = await this.simulateResponse(personality, scenario);
      const overallQuality = (
        response.engagementLevel * 0.2 +
        response.educationalValue * 0.3 +
        response.emotionalIntelligence * 0.25 +
        response.appropriateness * 0.25
      );

      results.push({
        scenario,
        response,
        metrics: {
          overallQuality,
          engagement: response.engagementLevel,
          learning: response.educationalValue,
          emotionalSupport: response.emotionalIntelligence,
          appropriateness: response.appropriateness,
        },
        feedback: this.generateFeedback(personality, scenario, response),
      });
    }

    return results;
  }

  private static generateFeedback(personality: any, scenario: SimulationScenario, response: PersonalityResponse): string {
    if (response.engagementLevel >= 80 && response.educationalValue >= 80) {
      return 'Excellent response - engaging and educational!';
    } else if (response.emotionalIntelligence < 50) {
      return 'Consider improving emotional responsiveness.';
    } else if (response.appropriateness < 70) {
      return 'Response may not be appropriate for this learner level.';
    }
    return 'Good response overall.';
  }
}

export default PersonalitySimulator;
