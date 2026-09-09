// Study Companion — Conversation Memory Service
// Stores and retrieves educational conversation history

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  context?: {
    subject?: string;
    topic?: string;
    concept?: string;
    contentId?: string;
  };
  metadata?: {
    helpful?: boolean;
    rating?: number;
    followedUp?: boolean;
  };
}

export interface ConversationSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messages: ConversationMessage[];
  summary?: string;
  topics: string[];
  relatedConcepts: string[];
}

export interface ConversationContext {
  recentTopics: string[];
  pendingQuestions: string[];
  misunderstoodConcepts: string[];
  currentSubject?: string;
}

export class ConversationMemoryService {
  private static instance: ConversationMemoryService;
  private sessions: Map<string, ConversationSession> = new Map();
  private currentSession: ConversationSession | null = null;
  private userId: string = "";
  private listeners: Set<(session: ConversationSession | null) => void> = new Set();

  private constructor() {}

  static getInstance(): ConversationMemoryService {
    if (!ConversationMemoryService.instance) {
      ConversationMemoryService.instance = new ConversationMemoryService();
    }
    return ConversationMemoryService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_conversations_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = new Map(data.map((s: any) => {
          s.startTime = new Date(s.startTime);
          if (s.endTime) s.endTime = new Date(s.endTime);
          s.messages = s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          return [s.id, s];
        }));
      }
    } catch (error) {
      console.error("Failed to load conversation sessions:", error);
    }
  }

  private async saveSessions(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const data = Array.from(this.sessions.values()).slice(-100); // Keep last 100
      localStorage.setItem(`sc_conversations_${this.userId}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save conversation sessions:", error);
    }
  }

  // Start new conversation session
  startSession(context?: ConversationContext): ConversationSession {
    if (this.currentSession) {
      this.endSession();
    }

    const session: ConversationSession = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      startTime: new Date(),
      messages: [],
      topics: context?.recentTopics || [],
      relatedConcepts: []
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;
    this.notifyListeners();

    return session;
  }

  // Add message to current session
  addMessage(
    role: "user" | "assistant" | "system",
    content: string,
    context?: ConversationMessage["context"],
    metadata?: ConversationMessage["metadata"]
  ): ConversationMessage {
    if (!this.currentSession) {
      this.startSession();
    }

    const message: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      context,
      metadata
    };

    this.currentSession!.messages.push(message);

    // Update session topics
    if (context?.topic && !this.currentSession!.topics.includes(context.topic)) {
      this.currentSession!.topics.push(context.topic);
    }
    if (context?.concept && !this.currentSession!.relatedConcepts.includes(context.concept)) {
      this.currentSession!.relatedConcepts.push(context.concept);
    }

    return message;
  }

  // End current session
  endSession(summary?: string): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.summary = summary || this.generateSummary();
    this.currentSession = null;

    this.saveSessions();
    this.notifyListeners();
  }

  // Generate session summary
  private generateSummary(): string {
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      return "No messages in this session.";
    }

    const topics = [...new Set(this.currentSession.topics)];
    const concepts = [...new Set(this.currentSession.relatedConcepts)];

    let summary = "";
    if (topics.length > 0) {
      summary += `Topics discussed: ${topics.join(", ")}.`;
    }
    if (concepts.length > 0) {
      summary += ` Concepts covered: ${concepts.join(", ")}.`;
    }

    return summary || "General learning session.";
  }

  // Get conversation history
  getConversationHistory(options?: {
    limit?: number;
    topic?: string;
    dateRange?: { start: Date; end: Date };
  }): ConversationSession[] {
    let sessions = Array.from(this.sessions.values());

    if (options?.dateRange) {
      sessions = sessions.filter(s =>
        s.startTime >= options.dateRange!.start &&
        s.startTime <= options.dateRange!.end
      );
    }

    if (options?.topic) {
      sessions = sessions.filter(s => s.topics.includes(options.topic!));
    }

    sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (options?.limit) {
      sessions = sessions.slice(0, options.limit);
    }

    return sessions;
  }

  // Get current session
  getCurrentSession(): ConversationSession | null {
    return this.currentSession;
  }

  // Get messages for specific concept
  getConceptConversation(concept: string): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    for (const session of this.sessions.values()) {
      for (const message of session.messages) {
        if (message.context?.concept === concept) {
          messages.push(message);
        }
      }
    }

    return messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get conversation context
  getConversationContext(): ConversationContext {
    const recentTopics = new Set<string>();
    const pendingQuestions = new Set<string>();
    const misunderstoodConcepts = new Set<string>();

    for (const session of Array.from(this.sessions.values()).slice(0, 5)) {
      for (const topic of session.topics) {
        recentTopics.add(topic);
      }
      for (const concept of session.relatedConcepts) {
        recentTopics.add(concept);
      }
    }

    return {
      recentTopics: Array.from(recentTopics).slice(0, 10),
      pendingQuestions: Array.from(pendingQuestions),
      misunderstoodConcepts: Array.from(misunderstoodConcepts)
    };
  }

  // Mark message as helpful
  markMessageHelpful(messageId: string, helpful: boolean): void {
    if (!this.currentSession) return;

    const message = this.currentSession.messages.find(m => m.id === messageId);
    if (message) {
      message.metadata = { ...message.metadata, helpful };
    }
  }

  // Rate message
  rateMessage(messageId: string, rating: number): void {
    if (!this.currentSession) return;

    const message = this.currentSession.messages.find(m => m.id === messageId);
    if (message) {
      message.metadata = { ...message.metadata, rating };
    }
  }

  // Search conversations
  searchConversations(query: string): ConversationSession[] {
    const lowerQuery = query.toLowerCase();
    const results: ConversationSession[] = [];

    for (const session of this.sessions.values()) {
      const matches = session.messages.some(m =>
        m.content.toLowerCase().includes(lowerQuery)
      );

      if (matches) {
        results.push(session);
      }
    }

    return results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // Subscribe to session changes
  subscribe(listener: (session: ConversationSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentSession);
    }
  }

  // Cleanup
  destroy(): void {
    this.sessions.clear();
    this.currentSession = null;
    this.listeners.clear();
  }
}

export const conversationMemoryService = ConversationMemoryService.getInstance();
