export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  provider?: string;
}

const STORAGE_KEY = "margeos_ai_sessions_v1";
const ACTIVE_SESSION_ID_KEY = "margeos_ai_active_session_id_v1";

export const getStoredSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s): s is Record<string, any> => Boolean(s && typeof s === "object" && s.id))
      .map((s) => {
        const id = String(s.id);
        const title = typeof s.title === "string" && s.title.trim() ? s.title.trim() : "Conversation";
        const createdAt = typeof s.createdAt === "number" ? s.createdAt : Date.now();
        const updatedAt = typeof s.updatedAt === "number" ? s.updatedAt : Date.now();

        const rawMessages = Array.isArray(s.messages) ? s.messages : [];
        const cleanMessages: ChatMessage[] = rawMessages
          .filter((m: any) => m && typeof m === "object" && typeof m.content === "string")
          .map((m: any) => ({
            id: String(m.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            role: m.role === "user" ? ("user" as const) : m.role === "system" ? ("system" as const) : ("assistant" as const),
            content: String(m.content),
            timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
            provider: typeof m.provider === "string" ? m.provider : undefined,
          }));

        return {
          id,
          title,
          createdAt,
          updatedAt,
          messages: cleanMessages.length > 0 ? cleanMessages : [
            {
              id: "welcome",
              role: "assistant" as const,
              content: "👋 Hello! I am your Knowledge Universe AI Tutor. What would you like to study or explore today?",
              timestamp: Date.now(),
            },
          ],
        };
      });
  } catch (err) {
    console.error("Error reading stored chat sessions:", err);
    return [];
  }
};

export const saveStoredSessions = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Error saving chat sessions to local storage:", err);
  }
};

export const getStoredActiveSessionId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch {
    return null;
  }
};

export const setStoredActiveSessionId = (id: string): void => {
  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } catch (err) {
    console.error("Error storing active session id:", err);
  }
};

export const createNewSession = (initialTitle?: string): ChatSession => {
  const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const session: ChatSession = {
    id,
    title: initialTitle || "New Lesson",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: "👋 Hello! I am your Knowledge Universe AI Tutor. What would you like to study or explore today? You can ask me to explain concepts, derive formulas, walk through practice problems, or prepare revision quizzes!",
        timestamp: Date.now(),
      },
    ],
  };
  return session;
};

export const generateSessionTitle = (text: string): string => {
  const clean = text.replace(/[*#`_~]/g, "").trim();
  if (!clean) return "New Conversation";
  const firstLine = clean.split("\n")[0].trim();
  return firstLine.length > 38 ? firstLine.substring(0, 38) + "…" : firstLine;
};
