// Study Companion — Memory Utilities
// Utility functions for conversation memory and context

export interface ConversationEntry {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemoryContext {
  recentTopics: string[];
  studentLevel: string;
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  preferences: string[];
}

/**
 * Generate unique ID for conversation entries
 */
export function generateEntryId(): string {
  return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract topics from text
 */
export function extractTopics(text: string): string[] {
  // Simple keyword extraction
  const educationKeywords = [
    "math", "science", "history", "physics", "chemistry", "biology",
    "algebra", "calculus", "geometry", "grammar", "writing", "reading",
    "programming", "coding", "database", "algorithm", "theory", "practice"
  ];

  const words = text.toLowerCase().split(/\s+/);
  const foundTopics: string[] = [];

  educationKeywords.forEach(keyword => {
    if (words.some(word => word.includes(keyword))) {
      foundTopics.push(keyword);
    }
  });

  return [...new Set(foundTopics)];
}

/**
 * Generate summary of conversation
 */
export function generateConversationSummary(entries: ConversationEntry[]): string {
  if (entries.length === 0) return "";

  const userMessages = entries.filter(e => e.role === "user");
  const lastFew = userMessages.slice(-3);

  return lastFew.map(m => m.content.substring(0, 100)).join(" | ");
}

/**
 * Check if context is relevant
 */
export function isContextRelevant(
  entry: ConversationEntry,
  currentTopic: string
): boolean {
  const content = entry.content.toLowerCase();
  const topic = currentTopic.toLowerCase();

  return content.includes(topic) || topic.includes(content.substring(0, 50));
}

/**
 * Build context prompt for AI
 */
export function buildContextPrompt(context: MemoryContext): string {
  const parts: string[] = ["You are helping a student."];

  if (context.studentLevel) {
    parts.push(`Student level: ${context.studentLevel}.`);
  }

  if (context.strengths.length > 0) {
    parts.push(`Student strengths: ${context.strengths.join(", ")}.`);
  }

  if (context.weaknesses.length > 0) {
    parts.push(`Areas to improve: ${context.weaknesses.join(", ")}.`);
  }

  if (context.goals.length > 0) {
    parts.push(`Current goals: ${context.goals.join(", ")}.`);
  }

  if (context.recentTopics.length > 0) {
    parts.push(`Recent topics discussed: ${context.recentTopics.join(", ")}.`);
  }

  return parts.join(" ");
}

/**
 * Get recent entries within time window
 */
export function getRecentEntries(
  entries: ConversationEntry[],
  windowMinutes: number = 30
): ConversationEntry[] {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);

  return entries.filter(e => new Date(e.timestamp) >= cutoff);
}

/**
 * Prune old entries
 */
export function pruneOldEntries(
  entries: ConversationEntry[],
  maxAgeDays: number = 30,
  maxEntries: number = 500
): ConversationEntry[] {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  let filtered = entries.filter(e => new Date(e.timestamp) >= cutoff);

  if (filtered.length > maxEntries) {
    filtered = filtered.slice(-maxEntries);
  }

  return filtered;
}

/**
 * Merge similar entries
 */
export function mergeSimilarEntries(
  entries: ConversationEntry[]
): ConversationEntry[] {
  if (entries.length <= 1) return entries;

  const merged: ConversationEntry[] = [];
  const seen = new Set<string>();

  // Sort by timestamp descending
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  sorted.forEach(entry => {
    // Create simple hash for content
    const contentHash = entry.content.substring(0, 50).toLowerCase().trim();

    if (!seen.has(contentHash)) {
      seen.add(contentHash);
      merged.push(entry);
    }
  });

  return merged.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Create system message for context
 */
export function createContextSystemMessage(
  studentProfile: {
    name?: string;
    level?: string;
    subjects?: string[];
    learningStyle?: string;
  }
): ConversationEntry {
  const parts: string[] = ["You are an AI Study Companion."];

  if (studentProfile.name) {
    parts.push(`The student is ${studentProfile.name}.`);
  }

  if (studentProfile.level) {
    parts.push(`Their level is ${studentProfile.level}.`);
  }

  if (studentProfile.subjects && studentProfile.subjects.length > 0) {
    parts.push(`They are studying: ${studentProfile.subjects.join(", ")}.`);
  }

  if (studentProfile.learningStyle) {
    parts.push(`Preferred learning style: ${studentProfile.learningStyle}.`);
  }

  return {
    id: generateEntryId(),
    role: "system",
    content: parts.join(" "),
    timestamp: new Date()
  };
}

/**
 * Format conversation for display
 */
export function formatConversationForDisplay(
  entries: ConversationEntry[],
  maxLength: number = 200
): string {
  return entries
    .slice(-5)
    .map(e => {
      const role = e.role === "user" ? "You" : "AI";
      const content = e.content.length > maxLength
        ? e.content.substring(0, maxLength) + "..."
        : e.content;
      return `[${role}]: ${content}`;
    })
    .join("\n");
}

/**
 * Extract key concepts from conversation
 */
export function extractKeyConcepts(entries: ConversationEntry[]): string[] {
  const conceptKeywords = [
    "understand", "learn", "practice", "theory", "concept", "principle",
    "formula", "equation", "rule", "definition", "example", "problem",
    "solution", "method", "approach", "strategy", "technique", "skill"
  ];

  const concepts: Set<string> = new Set();
  const text = entries.map(e => e.content).join(" ").toLowerCase();

  conceptKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      concepts.add(keyword);
    }
  });

  return Array.from(concepts);
}

/**
 * Calculate context relevance score
 */
export function calculateRelevanceScore(
  entry: ConversationEntry,
  currentSubject: string,
  currentTopic: string
): number {
  const content = entry.content.toLowerCase();
  let score = 0;

  // Subject match
  if (currentSubject && content.includes(currentSubject.toLowerCase())) {
    score += 30;
  }

  // Topic match
  if (currentTopic && content.includes(currentTopic.toLowerCase())) {
    score += 40;
  }

  // Recency bonus
  const hoursAgo = (Date.now() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) score += 20;
  else if (hoursAgo < 24) score += 10;
  else if (hoursAgo < 72) score += 5;

  return Math.min(100, score);
}

/**
 * Select relevant context for prompt
 */
export function selectRelevantContext(
  entries: ConversationEntry[],
  currentSubject: string,
  currentTopic: string,
  maxEntries: number = 5
): ConversationEntry[] {
  const scored = entries.map(entry => ({
    entry,
    score: calculateRelevanceScore(entry, currentSubject, currentTopic)
  }));

  return scored
    .filter(s => s.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries)
    .map(s => s.entry);
}

/**
 * Clear old memory entries
 */
export function clearOldMemories(
  entries: ConversationEntry[],
  keepSystem: boolean = true,
  keepUser: boolean = true,
  keepAssistant: boolean = true
): ConversationEntry[] {
  return entries.filter(e => {
    switch (e.role) {
      case "system":
        return keepSystem;
      case "user":
        return keepUser;
      case "assistant":
        return keepAssistant;
      default:
        return false;
    }
  });
}
