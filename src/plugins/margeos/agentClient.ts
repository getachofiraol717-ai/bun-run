// Client helpers for the margeos-agent edge function.
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/integrations/margeosBridge";
import type { AgentName, MemoryEntry } from "./types";
import { redactSecrets } from "./zip-intelligence/utils/redactSecrets";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/margeos-agent`;

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Stream a chat-style response from a given agent. Calls onToken for each delta. */
export async function streamAgent(opts: {
  agent: AgentName | string;
  prompt: string;
  workspace_id?: string | null;
  task_id?: string | null;
  onToken?: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const headers = await authHeaders();
  const sanitizedPrompt = redactSecrets(opts.prompt);
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "agent",
      stream: true,
      agent: opts.agent,
      prompt: sanitizedPrompt,
      workspace_id: opts.workspace_id ?? null,
      task_id: opts.task_id ?? null,
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`agent ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const m = line.match(/^data: (.+)$/);
      if (!m || m[1] === "[DONE]") continue;
      try {
        const evt = JSON.parse(m[1]);
        const delta = evt?.choices?.[0]?.delta?.content ?? "";
        if (delta) { full += delta; opts.onToken?.(delta); }
      } catch { /* skip */ }
    }
  }
  analytics.track({
    category: "agent",
    event: "agent.call",
    subject: String(opts.agent),
    value: full.length,
    workspace_id: opts.workspace_id ?? null,
    metadata: { stream: true, task_id: opts.task_id ?? null },
  });
  return full;
}

/** Non-streaming call. Returns the full assistant text. */
export async function callAgent(opts: {
  agent: AgentName | string;
  prompt: string;
  workspace_id?: string | null;
  task_id?: string | null;
}): Promise<string> {
  const headers = await authHeaders();
  const sanitizedPrompt = redactSecrets(opts.prompt);
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "agent", stream: false, ...opts, prompt: sanitizedPrompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `agent ${res.status}`);
  const text = data.text ?? "";
  analytics.track({
    category: "agent",
    event: "agent.call",
    subject: String(opts.agent),
    value: text.length,
    workspace_id: opts.workspace_id ?? null,
    metadata: { stream: false, task_id: opts.task_id ?? null },
  });
  return text;
}

/** Semantic memory recall. */
export async function searchMemory(opts: {
  query: string;
  workspace_id?: string | null;
  k?: number;
}): Promise<(MemoryEntry & { similarity: number })[]> {
  const headers = await authHeaders();
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "memory.search",
      query: opts.query,
      workspace_id: opts.workspace_id ?? null,
      k: opts.k ?? 8,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `search ${res.status}`);
  return data.matches ?? [];
}

/** Backfill embedding for a stored memory entry. */
export async function embedMemory(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "memory.embed", id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `embed ${res.status}`);
  }
}

/** Semantic recall over the Knowledge Vault. */
export async function searchVault(opts: {
  query: string;
  category?: string | null;
  k?: number;
}): Promise<any[]> {
  const headers = await authHeaders();
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "vault.search",
      query: opts.query,
      category: opts.category ?? null,
      k: opts.k ?? 8,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `vault.search ${res.status}`);
  return data.matches ?? [];
}

/** Backfill embedding for a vault entry. */
export async function embedVault(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "vault.embed", id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `vault.embed ${res.status}`);
  }
}

export type TutorKind = "lesson" | "quiz" | "exam" | "flashcards" | "roadmap";

/** Generate a tutor artifact (lesson/quiz/exam/flashcards/roadmap). */
export async function generateTutor(opts: {
  kind: TutorKind;
  topic: string;
  level?: string;
  count?: number;
  language?: string;
  save?: boolean;
}): Promise<{ kind: TutorKind; topic: string; saved_id: string | null; result: any }> {
  const headers = await authHeaders();
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "tutor.generate", ...opts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `tutor.generate ${res.status}`);
  analytics.track({
    category: "tutor",
    event: "tutor.generate",
    subject: opts.kind,
    metadata: { topic: opts.topic, saved_id: data?.saved_id ?? null },
  });
  return data;
}
