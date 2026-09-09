// @ts-nocheck
// Study Companion — Learning History Engine
// Tracks comprehensive learning history and integrates with Memory Vault

import type { StudySession } from "../models/StudySession";
import type { HistoryEntry, ConceptRecord, ConceptGap } from "../models/LearningHistory";

export interface HistoryFilter {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  subject?: string;
  topic?: string;
}

export interface SessionSummary {
  totalSessions: number;
  totalStudyTime: number;
  averageSessionLength: number;
  sessionsBySubject: Record<string, number>;
  sessionsByDay: Record<string, number>;
}

export class LearningHistoryEngine {
  private userId: string = "";
  private sessions: Map<string, StudySession> = new Map();
  private currentSession: StudySession | null = null;
  private entries: HistoryEntry[] = [];
  private concepts: Map<string, ConceptRecord> = new Map();
  private listeners: Set<(sessions: StudySession[]) => void> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadHistory();
  }

  // Load from storage
  private async loadHistory(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      // Load sessions
      const storedSessions = localStorage.getItem(`sc_sessions_${this.userId}`);
      if (storedSessions) {
        const data = JSON.parse(storedSessions);
        this.sessions = new Map(data.map((s: any) => {
          s.startTime = new Date(s.startTime);
          if (s.endTime) s.endTime = new Date(s.endTime);
          return [s.id, s];
        }));
      }

      // Load entries
      const storedEntries = localStorage.getItem(`sc_entries_${this.userId}`);
      if (storedEntries) {
        this.entries = JSON.parse(storedEntries).map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
      }

      // Load concepts
      const storedConcepts = localStorage.getItem(`sc_concepts_${this.userId}`);
      if (storedConcepts) {
        const data = JSON.parse(storedConcepts);
        this.concepts = new Map(data.map((c: any) => {
          c.firstEncountered = new Date(c.firstEncountered);
          if (c.firstLearned) c.firstLearned = new Date(c.firstLearned);
          if (c.mastered) c.mastered = new Date(c.mastered);
          c.reviewHistory = c.reviewHistory.map((r: any) => ({
            ...r,
            date: new Date(r.date)
          }));
          return [c.id, c];
        }));
      }
    } catch (error) {
      console.error("Failed to load learning history:", error);
    }
  }

  // Save to storage
  private async saveHistory(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      // Save sessions
      const sessionsData = Array.from(this.sessions.values());
      localStorage.setItem(`sc_sessions_${this.userId}`, JSON.stringify(sessionsData));

      // Save entries
      localStorage.setItem(`sc_entries_${this.userId}`, JSON.stringify(this.entries));

      // Save concepts
      const conceptsData = Array.from(this.concepts.values());
      localStorage.setItem(`sc_concepts_${this.userId}`, JSON.stringify(conceptsData));

      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save learning history:", error);
    }
  }

  // Session management
  async startSession(options?: Partial<StudySession>): Promise<StudySession> {
    // End any existing session
    if (this.currentSession) {
      await this.endSession(this.currentSession);
    }

    const session: StudySession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      startTime: new Date(),
      actualDuration: 0,
      topics: options?.topics || [],
      completedGoals: [],
      productivity: 0,
      focusScore: 0,
      completionRate: 0,
      activities: [],
      breaks: [],
      interruptions: [],
      newConcepts: [],
      revisedConcepts: [],
      status: "in_progress",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;

    // Add history entry
    this.addEntry({
      type: "study_session",
      duration: 0,
      subject: session.subject,
      topic: session.topics?.[0]
    });

    await this.saveHistory();
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<StudySession>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    Object.assign(session, updates, { updatedAt: new Date() });
    await this.saveHistory();
  }

  async endSession(session: StudySession): Promise<void> {
    if (!session) return;

    session.endTime = new Date();
    session.actualDuration = Math.floor(
      (session.endTime.getTime() - session.startTime.getTime()) / 60000
    );
    session.status = "completed";
    session.updatedAt = new Date();

    // Update history entry
    this.updateEntry(session.id, {
      duration: session.actualDuration
    });

    if (session.subject) {
      this.addEntry({
        type: "content_viewed",
        duration: session.actualDuration,
        subject: session.subject,
        topic: session.topics?.[0]
      });
    }

    this.currentSession = null;
    await this.saveHistory();
  }

  async getCurrentSession(): Promise<StudySession | null> {
    return this.currentSession;
  }

  async getSession(sessionId: string): Promise<StudySession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessions(filter?: HistoryFilter): Promise<StudySession[]> {
    let sessions = Array.from(this.sessions.values());

    if (filter) {
      if (filter.startDate) {
        sessions = sessions.filter(s => s.startTime >= filter.startDate!);
      }
      if (filter.endDate) {
        sessions = sessions.filter(s => s.startTime <= filter.endDate!);
      }
      if (filter.subject) {
        sessions = sessions.filter(s => s.subject === filter.subject);
      }
    }

    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // History entries
  addEntry(entry: Omit<HistoryEntry, "id" | "userId" | "date">): void {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      date: new Date()
    };

    this.entries.push(newEntry);
  }

  updateEntry(sessionId: string, updates: Partial<HistoryEntry>): void {
    const entry = this.entries.find(e => e.contentId === sessionId);
    if (entry) {
      Object.assign(entry, updates);
    }
  }

  getEntries(filter?: HistoryFilter): HistoryEntry[] {
    let entries = [...this.entries];

    if (filter) {
      if (filter.startDate) {
        entries = entries.filter(e => e.date >= filter.startDate!);
      }
      if (filter.endDate) {
        entries = entries.filter(e => e.date <= filter.endDate!);
      }
      if (filter.type) {
        entries = entries.filter(e => e.type === filter.type);
      }
      if (filter.subject) {
        entries = entries.filter(e => e.subject === filter.subject);
      }
    }

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Concept tracking
  async recordConceptLearned(
    concept: string,
    subject: string,
    topic: string
  ): Promise<ConceptRecord> {
    // Check if concept already exists
    const existing = Array.from(this.concepts.values()).find(
      c => c.concept === concept && c.subject === subject
    );

    if (existing) {
      existing.firstLearned = new Date();
      existing.reviewCount++;
      await this.saveHistory();
      return existing;
    }

    const record: ConceptRecord = {
      id: `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      concept,
      subject,
      topic,
      relatedConcepts: [],
      prerequisites: [],
      firstEncountered: new Date(),
      firstLearned: new Date(),
      reviewHistory: [],
      reviewCount: 1,
      masteryLevel: "familiar",
      masteryScore: 25,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0
    };

    this.concepts.set(record.id, record);

    // Add history entry
    this.addEntry({
      type: "concept_learned",
      subject,
      topic,
      contentTitle: concept
    });

    await this.saveHistory();
    return record;
  }

  async recordConceptReview(
    conceptId: string,
    result: "correct" | "incorrect" | "partial",
    score: number
  ): Promise<void> {
    const concept = this.concepts.get(conceptId);
    if (!concept) return;

    concept.reviewHistory.push({
      date: new Date(),
      result,
      score,
      timeTaken: 0
    });

    concept.reviewCount++;
    concept.masteryScore = this.calculateMasteryScore(concept);
    concept.masteryLevel = this.getMasteryLevel(concept.masteryScore);

    // Update spaced repetition
    if (result === "correct") {
      concept.repetitions++;
      if (concept.repetitions === 1) {
        concept.interval = 1;
      } else if (concept.repetitions === 2) {
        concept.interval = 6;
      } else {
        concept.interval = Math.round(concept.interval * concept.easeFactor);
      }
      concept.easeFactor = Math.max(1.3, concept.easeFactor - 0.14);
    } else {
      concept.repetitions = 0;
      concept.interval = 1;
      concept.easeFactor = Math.max(1.3, concept.easeFactor - 0.2);
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + concept.interval);
    concept.nextReviewDate = nextReview;

    this.addEntry({
      type: "concept_reviewed",
      subject: concept.subject,
      topic: concept.topic,
      contentTitle: concept.concept
    });

    await this.saveHistory();
  }

  getConcepts(filter?: { subject?: string; topic?: string }): ConceptRecord[] {
    let concepts = Array.from(this.concepts.values());

    if (filter?.subject) {
      concepts = concepts.filter(c => c.subject === filter.subject);
    }
    if (filter?.topic) {
      concepts = concepts.filter(c => c.topic === filter.topic);
    }

    return concepts.sort((a, b) => b.masteryScore - a.masteryScore);
  }

  getConceptsForReview(): ConceptRecord[] {
    const now = new Date();
    return Array.from(this.concepts.values())
      .filter(c => {
        if (!c.nextReviewDate) return true;
        return c.nextReviewDate <= now;
      })
      .sort((a, b) => {
        if (!a.nextReviewDate) return -1;
        if (!b.nextReviewDate) return 1;
        return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
      });
  }

  // Private helpers
  private calculateMasteryScore(concept: ConceptRecord): number {
    if (concept.reviewHistory.length === 0) return 0;

    const weights = concept.reviewHistory.map((_, i) =>
      Math.pow(0.8, concept.reviewHistory.length - 1 - i)
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const weightedSum = concept.reviewHistory.reduce((sum, r, i) => {
      return sum + r.score * weights[i];
    }, 0);

    return Math.min(100, Math.round(weightedSum / totalWeight));
  }

  private getMasteryLevel(score: number): ConceptRecord["masteryLevel"] {
    if (score >= 90) return "mastered";
    if (score >= 70) return "proficient";
    if (score >= 30) return "familiar";
    return "not_started";
  }

  // Analytics
  async getSessionSummary(filter?: HistoryFilter): Promise<SessionSummary> {
    const sessions = await this.getSessions(filter);

    const sessionsBySubject: Record<string, number> = {};
    const sessionsByDay: Record<string, number> = {};

    let totalStudyTime = 0;

    for (const session of sessions) {
      totalStudyTime += session.actualDuration;

      if (session.subject) {
        sessionsBySubject[session.subject] = (sessionsBySubject[session.subject] || 0) + 1;
      }

      const dayKey = session.startTime.toISOString().split("T")[0];
      sessionsByDay[dayKey] = (sessionsByDay[dayKey] || 0) + 1;
    }

    return {
      totalSessions: sessions.length,
      totalStudyTime,
      averageSessionLength: sessions.length > 0 ? Math.round(totalStudyTime / sessions.length) : 0,
      sessionsBySubject,
      sessionsByDay
    };
  }

  // Detect knowledge gaps
  async detectKnowledgeGaps(): Promise<ConceptGap[]> {
    const gaps: ConceptGap[] = [];
    const concepts = Array.from(this.concepts.values());

    for (const concept of concepts) {
      // Check for weak concepts
      if (concept.masteryScore < 50) {
        const recentReviews = concept.reviewHistory.slice(-3);
        const declining = recentReviews.length >= 2 &&
          recentReviews[recentReviews.length - 1].score < recentReviews[0].score;

        if (declining) {
          gaps.push({
            gap: concept.concept,
            subject: concept.subject,
            topic: concept.topic,
            severity: concept.masteryScore < 30 ? "critical" : "major",
            blockedConcepts: [],
            prerequisiteConcepts: concept.prerequisites,
            estimatedTimeToFill: 30
          });
        }
      }

      // Check for forgotten concepts
      const daysSinceReview = concept.nextReviewDate
        ? Math.floor((Date.now() - concept.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24))
        : concept.reviewCount === 0 ? 0 : 365;

      if (daysSinceReview > 30 && concept.reviewCount > 0) {
        gaps.push({
          gap: concept.concept,
          subject: concept.subject,
          topic: concept.topic,
          severity: "minor",
          blockedConcepts: [],
          prerequisiteConcepts: [],
          estimatedTimeToFill: 15
        });
      }
    }

    return gaps.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // Subscribe to changes
  subscribe(listener: (sessions: StudySession[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const sessions = Array.from(this.sessions.values());
    for (const listener of this.listeners) {
      listener(sessions);
    }
  }

  // Cleanup
  destroy(): void {
    this.sessions.clear();
    this.entries = [];
    this.concepts.clear();
    this.currentSession = null;
    this.listeners.clear();
  }
}

export const learningHistoryEngine = new LearningHistoryEngine();

