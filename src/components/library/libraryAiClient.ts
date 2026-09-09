import { supabase } from '@/integrations/supabase/client';

const ENDPOINT = 'library-ai';

interface BaseOpts {
  signal?: AbortSignal;
}

/** Stream a text response (companion chat, summary, compare). Returns full text. */
export async function libraryAiStream(
  payload: Record<string, unknown>,
  onToken?: (delta: string) => void,
  opts: BaseOpts = {}
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const auth = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';

  const r = await fetch(`${url}/functions/v1/${ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);

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
      const data = s.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        const t = j.choices?.[0]?.delta?.content || '';
        if (t) { full += t; onToken?.(t); }
      } catch { /* skip malformed SSE line */ }
    }
  }
  return full;
}

/** Call a JSON action (formula, flashcards, quiz, notes_organize). Returns parsed JSON. */
export async function libraryAiJSON<T = any>(
  payload: Record<string, unknown>,
  opts: BaseOpts = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const auth = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';

  const r = await fetch(`${url}/functions/v1/${ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Languages the Library Companion can teach/translate in. */
export const LIBRARY_LANGUAGES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'am', label: 'አማርኛ' },
  { id: 'om', label: 'Afaan Oromoo' },
  { id: 'ti', label: 'ትግርኛ' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'sw', label: 'Kiswahili' },
];

export const COMPANION_MODES: { id: string; label: string; emoji: string }[] = [
  { id: 'beginner', label: 'Beginner', emoji: '🌱' },
  { id: 'student',  label: 'Student',  emoji: '🎓' },
  { id: 'expert',   label: 'Expert',   emoji: '🧠' },
  { id: 'child',    label: 'Child',    emoji: '🧸' },
  { id: 'exam',     label: 'Exam',     emoji: '📝' },
];
