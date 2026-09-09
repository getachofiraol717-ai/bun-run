// AI Tutor Engine — AIConversationService
//
// Reuses the EXISTING ai-tutor / ai-tutor-safe edge functions rather than
// adding any new backend. The server validates `mode` against a fixed enum
// and builds its own system prompt — it does not accept an arbitrary system
// prompt from the client. So instead of inventing new server modes for every
// age-band/learning-style/explanation-mode combination, this service uses
// mode: "pdf" (which already injects `pdfContent` into the system prompt and
// is framed for teaching from document content) and folds every other
// instruction — age band, learning style, explanation mode, the actual
// teaching task — into the *content* of the message itself.
import { supabase } from "@/integrations/supabase/client";
import { aiStream } from "@/pages/creator/aiClient";

const AI_TUTOR_FUNCTIONS = ["ai-tutor-safe", "ai-tutor"] as const;

function functionUrl(fn: typeof AI_TUTOR_FUNCTIONS[number]): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function postToAiTutor(payload: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const headers = await getAuthHeaders();
  let lastError: unknown = null;
  for (const fn of AI_TUTOR_FUNCTIONS) {
    try {
      const response = await fetch(functionUrl(fn), { method: "POST", headers, signal, body: JSON.stringify(payload) });
      if (response.status === 404) { lastError = response; continue; }
      return response;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("AI tutor engine: request failed");
}

async function readErrorMessage(resp: Response): Promise<string> {
  try {
    const data = await resp.clone().json();
    if (typeof data?.error === "string") return data.error;
  } catch { /* not JSON */ }
  try { return await resp.clone().text(); } catch { return `AI tutor request failed (${resp.status})`; }
}

export interface ConversationRequest {
  /** The fully-assembled teaching instruction (built by TutorPromptService) — sent as the user turn. */
  userInstruction: string;
  /** Relevant page/chapter text from Smart PDF Engine — becomes the [PDF DOCUMENT TO ANALYSE] context server-side. */
  pdfContent?: string;
  subject?: string;
  /** Compact StudentProfile summary — becomes [STUDENT CONTEXT] server-side (Feature 10 personalization, no new backend needed). */
  memoryHint?: string;
  language?: string;
  provider?: "gemini" | "chatgpt" | "claude";
  onChunk?: (accumulatedText: string) => void;
  signal?: AbortSignal;
}

export interface ConversationResult {
  text: string;
  error: string | null;
}

/**
 * Send one teaching instruction to the AI and stream/accumulate the response.
 * This is the ONLY function in the whole ai-tutor-engine module that performs
 * a network call — every other piece of teaching logic is pure orchestration
 * around this.
 */
export async function generateTeachingText(req: ConversationRequest): Promise<ConversationResult> {
  try {
    const resp = await postToAiTutor(
      {
        messages: [{ role: "user", content: req.userInstruction }],
        mode: "pdf",
        provider: req.provider ?? "gemini",
        language: req.language ?? "en",
        subject: req.subject,
        pdfContent: req.pdfContent,
        memoryHint: req.memoryHint,
      },
      req.signal
    );

    if (!resp.ok || !resp.body) {
      // Fallback to direct aiStream multi-model engine
      let fallbackAcc = "";
      const text = await aiStream({
        messages: [{ role: "user", content: req.userInstruction }],
        mode: req.pdfContent ? "expert" : "instant",
        provider: req.provider || "gemini",
        autoSwitch: true,
        onToken: (chunk) => {
          fallbackAcc += chunk;
          req.onChunk?.(fallbackAcc);
        },
        signal: req.signal,
      });
      if (text) return { text, error: null };
      return { text: "", error: await readErrorMessage(resp) };
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let acc = "";
    let done = false;

    while (!done) {
      const { done: readerDone, value } = await reader.read();
      if (readerDone) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") { done = true; break; }
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            acc += delta;
            req.onChunk?.(acc);
          }
        } catch {
          // Malformed SSE line — skip it, never re-inject (matches AITutor.tsx's established handling).
        }
      }
    }

    if (!acc) return { text: "", error: "Empty response from AI tutor." };
    return { text: acc, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI tutor engine: request failed";
    return { text: "", error: message };
  }
}
