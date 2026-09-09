import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_AI_TUTOR_API_KEY = '';

export function getAITutorApiKey(): string {
  try {
    const custom = typeof window !== 'undefined' ? localStorage.getItem('ku_ai_tutor_api_key') : null;
    if (custom && custom.trim()) {
      const trimmed = custom.trim();
      // Filter out legacy dummy key
      if (trimmed === 'sk-PjaffkDo5dE7zx2B6IvT1JgsziIPBDj0BvqZEZfv4qwCZsoj') {
        localStorage.removeItem('ku_ai_tutor_api_key');
        return '';
      }
      return trimmed;
    }
  } catch {}
  return (import.meta.env.VITE_OPENAI_API_KEY as string) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function setAITutorApiKey(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      if (key && key.trim()) {
        localStorage.setItem('ku_ai_tutor_api_key', key.trim());
      } else {
        localStorage.removeItem('ku_ai_tutor_api_key');
      }
    }
  } catch {}
}

const ENDPOINTS = ['margeos-agent', 'ai-tutor-lesson'];
const MODEL_CASCADE: ('gemini' | 'chatgpt' | 'claude')[] = ['gemini', 'chatgpt', 'claude'];

function getSystemPromptForMode(mode?: string): string {
  switch (mode) {
    case 'coding':
      return 'You are Knowledge Universe AI Coding Tutor. Help the student write clean, well-commented code, explain data structures and algorithms, and debug step-by-step with clear markdown formatting.';
    case 'expert':
      return 'You are Knowledge Universe Expert Academic Tutor. Provide deep, accurate, structured academic explanations with clear definitions, real-world examples, and conceptual proofs.';
    case 'research':
      return 'You are Knowledge Universe Academic Research Assistant. Provide rigorous, citation-ready overviews, methodology breakdowns, and scientific depth.';
    case 'motivation':
      return 'You are Knowledge Universe Motivational Learning Coach. Encourage the student, inspire confidence, provide actionable micro-goals, and celebrate study milestones.';
    case 'study_planner':
      return 'You are Knowledge Universe Study Planner. Help construct realistic, effective study schedules, review timetables, and exam readiness roadmaps.';
    case 'quiz_gen':
      return 'You are Knowledge Universe Quiz Generator. Produce engaging, curriculum-aligned questions with multiple choice options and thorough explanations.';
    default:
      return 'You are Knowledge Universe AI Tutor, a warm, knowledgeable, encouraging, and clear academic tutor dedicated to helping students learn effectively.';
  }
}

/** Stream a completion from the KU AI tutor backend with systematic model auto-switching and direct OpenAI fallback. */
export async function aiStream(opts: {
  messages?: { role: 'user' | 'assistant' | 'system'; content: string }[];
  mode?: 'coding' | 'instant' | 'expert' | 'research' | 'motivation' | 'study_planner' | 'quiz_gen';
  provider?: 'gemini' | 'chatgpt' | 'claude';
  autoSwitch?: boolean;
  onToken?: (delta: string) => void;
  onModelSwitched?: (newModel: string) => void;
  signal?: AbortSignal;
} | string, legacyCallback?: (delta: string) => void) {
  // Normalize parameters if string was passed as first argument
  let normalizedOpts: {
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    mode?: 'coding' | 'instant' | 'expert' | 'research' | 'motivation' | 'study_planner' | 'quiz_gen';
    provider?: 'gemini' | 'chatgpt' | 'claude';
    autoSwitch?: boolean;
    onToken?: (delta: string) => void;
    onModelSwitched?: (newModel: string) => void;
    signal?: AbortSignal;
  };

  if (typeof opts === 'string') {
    normalizedOpts = {
      messages: [{ role: 'user', content: opts }],
      onToken: legacyCallback,
    };
  } else {
    normalizedOpts = {
      ...opts,
      messages: Array.isArray(opts?.messages) ? opts.messages : [],
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const auth = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const apiKey = getAITutorApiKey();

  const initialProvider = normalizedOpts.provider || 'gemini';
  const autoSwitch = normalizedOpts.autoSwitch !== false;
  const providersToTry = autoSwitch
    ? [initialProvider, ...MODEL_CASCADE.filter(p => p !== initialProvider)]
    : [initialProvider];

  let lastErr: any = null;

  // 1. Try Local Full-Stack Server (/api/ai/stream) first
  try {
    const res = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...auth,
      },
      body: JSON.stringify({
        messages: normalizedOpts.messages,
        mode: normalizedOpts.mode ?? 'general',
        provider: initialProvider,
        apiKey: apiKey,
      }),
      signal: normalizedOpts.signal,
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', full = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          const s = line.trim();
          if (!s.startsWith('data:')) continue;
          const payload = s.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            const t = j.choices?.[0]?.delta?.content || j.text || '';
            if (t) {
              full += t;
              normalizedOpts.onToken?.(t);
            }
          } catch {
            /* ignore */
          }
        }
      }
      if (full) return full;
    } else if (!res.ok) {
      try {
        const errJson = await res.json();
        lastErr = new Error(errJson?.message || errJson?.error || `Server returned ${res.status}`);
      } catch {
        lastErr = new Error(`Server returned ${res.status}`);
      }
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    lastErr = e;
  }

  // 2. Try Supabase Edge Functions
  if (url) {
    for (const prov of providersToTry) {
      if (prov !== initialProvider) {
        normalizedOpts.onModelSwitched?.(prov);
      }
      for (const fn of ENDPOINTS) {
        try {
          const r = await fetch(`${url}/functions/v1/${fn}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              ...auth,
            },
            body: JSON.stringify({
              messages: normalizedOpts.messages,
              mode: normalizedOpts.mode ?? 'coding',
              provider: prov,
              apiKey: apiKey,
            }),
            signal: normalizedOpts.signal,
          });

          if (!r.ok || !r.body) {
            lastErr = new Error(`HTTP ${r.status}`);
            continue;
          }

          const reader = r.body.getReader();
          const dec = new TextDecoder();
          let buf = '', full = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              const s = line.trim();
              if (!s.startsWith('data:')) continue;
              const payload = s.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const j = JSON.parse(payload);
                const t = j.choices?.[0]?.delta?.content || j.text || '';
                if (t) { full += t; normalizedOpts.onToken?.(t); }
              } catch { /* ignore */ }
            }
          }
          if (full) return full;
        } catch (e: any) {
          if (e?.name === 'AbortError') throw e;
          lastErr = e;
        }
      }
    }
  }

  // 2. Direct OpenAI API Streaming Fallback
  if (apiKey) {
    try {
      const systemMessage = {
        role: 'system',
        content: getSystemPromptForMode(normalizedOpts.mode),
      };

      const formattedMessages = [
        systemMessage,
        ...normalizedOpts.messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
          content: m.content,
        })),
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: formattedMessages,
          stream: true,
          temperature: 0.7,
        }),
        signal: normalizedOpts.signal,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errMsg = errorJson?.error?.message || `OpenAI returned status ${res.status}`;
        throw new Error(errMsg);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '', full = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            const s = line.trim();
            if (!s.startsWith('data:')) continue;
            const payload = s.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const j = JSON.parse(payload);
              const t = j.choices?.[0]?.delta?.content || '';
              if (t) {
                full += t;
                normalizedOpts.onToken?.(t);
              }
            } catch { /* ignore */ }
          }
        }
        if (full) return full;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      lastErr = e;
    }
  }

  // If all live endpoints failed, throw honest error
  const errMsg = lastErr?.message || 'AI service is currently unavailable. Please check your network or API keys.';
  throw new Error(`AI service is currently unavailable: ${errMsg}`);
}



