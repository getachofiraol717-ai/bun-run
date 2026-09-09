// ============================================================
// Offline & Local-First AI Service
// - Queues messages when offline, replays on reconnect
// - Caches AI summaries for offline reading
// - Low-bandwidth mode (compressed, shorter responses)
// ============================================================
import { supabase } from '@/integrations/supabase/client';

const PENDING_KEY    = 'ku_pending_messages';
const SUMMARY_KEY    = 'ku_cached_summaries';
const OFFLINE_PREFS  = 'ku_offline_prefs';
const MAX_PENDING    = 30;
const MAX_SUMMARIES  = 50;

export interface PendingMessage {
  id: string;
  text: string;
  mode: string;
  subject: string;
  chatId: string;
  timestamp: number;
  retries: number;
}

export interface CachedSummary {
  id: string;
  title: string;
  subject: string;
  content: string;         // Full AI-generated summary
  source: string;          // 'pdf' | 'lesson' | 'quiz'
  savedAt: number;
  sizeBytes: number;
}

export interface OfflinePrefs {
  lowBandwidth: boolean;   // Shorter responses, no images
  autoCache: boolean;      // Auto-cache summaries
  maxOfflineSize: number;  // MB limit for offline cache
}

// ── Load / save helpers ──────────────────────────────────────
function loadJSON<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage full */ }
}

// ── Pending message queue ────────────────────────────────────
export function enqueuePendingMessage(msg: Omit<PendingMessage, 'retries'>): void {
  const queue = loadJSON<PendingMessage[]>(PENDING_KEY, []);
  queue.push({ ...msg, retries: 0 });
  saveJSON(PENDING_KEY, queue.slice(-MAX_PENDING));
}

export function getPendingMessages(): PendingMessage[] {
  return loadJSON<PendingMessage[]>(PENDING_KEY, []);
}

export function clearPendingMessage(id: string): void {
  const queue = loadJSON<PendingMessage[]>(PENDING_KEY, []).filter(m => m.id !== id);
  saveJSON(PENDING_KEY, queue);
}

// ── Sync pending messages when back online ────────────────────
export async function syncPendingMessages(
  onMessage: (msg: PendingMessage) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const queue = getPendingMessages();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0; let failed = 0;
  for (const msg of queue) {
    try {
      await onMessage(msg);
      clearPendingMessage(msg.id);
      synced++;
    } catch {
      // Increment retry count
      const q = loadJSON<PendingMessage[]>(PENDING_KEY, []);
      const idx = q.findIndex(m => m.id === msg.id);
      if (idx !== -1) { q[idx].retries += 1; if (q[idx].retries >= 3) q.splice(idx, 1); saveJSON(PENDING_KEY, q); }
      failed++;
    }
  }
  return { synced, failed };
}

// ── Summary cache ─────────────────────────────────────────────
export function cacheSummary(summary: Omit<CachedSummary, 'id' | 'savedAt' | 'sizeBytes'>): string {
  const id = `sum_${Date.now()}`;
  const entry: CachedSummary = {
    ...summary, id, savedAt: Date.now(),
    sizeBytes: new Blob([summary.content]).size,
  };
  const cache = loadJSON<CachedSummary[]>(SUMMARY_KEY, []);
  cache.unshift(entry);
  // Keep total size under 10MB
  let total = cache.reduce((s, c) => s + c.sizeBytes, 0);
  while (total > 10 * 1024 * 1024 && cache.length > 0) { total -= cache.pop()!.sizeBytes; }
  saveJSON(SUMMARY_KEY, cache.slice(0, MAX_SUMMARIES));
  return id;
}

export function getCachedSummaries(): CachedSummary[] {
  return loadJSON<CachedSummary[]>(SUMMARY_KEY, []);
}

export function deleteCachedSummary(id: string): void {
  const cache = loadJSON<CachedSummary[]>(SUMMARY_KEY, []).filter(s => s.id !== id);
  saveJSON(SUMMARY_KEY, cache);
}

export function getCacheStats(): { count: number; totalMB: string } {
  const cache = loadJSON<CachedSummary[]>(SUMMARY_KEY, []);
  const bytes = cache.reduce((s, c) => s + c.sizeBytes, 0);
  return { count: cache.length, totalMB: (bytes / 1024 / 1024).toFixed(2) };
}

// ── Offline preferences ───────────────────────────────────────
export function getOfflinePrefs(): OfflinePrefs {
  return loadJSON<OfflinePrefs>(OFFLINE_PREFS, { lowBandwidth: false, autoCache: true, maxOfflineSize: 50 });
}

export function saveOfflinePrefs(prefs: Partial<OfflinePrefs>): void {
  const current = getOfflinePrefs();
  saveJSON(OFFLINE_PREFS, { ...current, ...prefs });
}

// ── Download summary as text file ─────────────────────────────
export function downloadSummary(summary: CachedSummary): void {
  const blob = new Blob([
    `# ${summary.title}\n`,
    `Subject: ${summary.subject}\n`,
    `Source: ${summary.source}\n`,
    `Saved: ${new Date(summary.savedAt).toLocaleString()}\n\n`,
    summary.content,
  ], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Low-bandwidth mode instruction suffix ────────────────────
export function getLowBandwidthSuffix(): string {
  return '\n\n[LOW-BANDWIDTH MODE: Keep response under 150 words. No markdown headers. Plain text only. Prioritise the single most important point.]';
}

// ─────────────────────────────────────────────────────────────
// PDF OFFLINE CACHE (uses Cache Storage API + IndexedDB index)
// ─────────────────────────────────────────────────────────────
const PDF_CACHE_NAME = 'ku-pdf-cache-v1';
const PDF_INDEX_KEY  = 'ku_cached_pdfs';

export interface CachedPDF {
  id: string;          // stable id (url hash or book id)
  title: string;
  url: string;
  sizeBytes: number;
  savedAt: number;
}

function pdfIndex(): CachedPDF[] {
  return loadJSON<CachedPDF[]>(PDF_INDEX_KEY, []);
}
function savePdfIndex(list: CachedPDF[]) { saveJSON(PDF_INDEX_KEY, list); }

export async function cachePDF(id: string, title: string, url: string): Promise<CachedPDF | null> {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(PDF_CACHE_NAME);
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cloned = res.clone();
    await cache.put(url, cloned);
    const blob = await res.blob();
    const entry: CachedPDF = { id, title, url, sizeBytes: blob.size, savedAt: Date.now() };
    const list = pdfIndex().filter(p => p.id !== id);
    list.unshift(entry);
    savePdfIndex(list);
    return entry;
  } catch (e) {
    console.warn('[cachePDF] failed', e);
    return null;
  }
}

export async function getCachedPDFBlobUrl(url: string): Promise<string | null> {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(PDF_CACHE_NAME);
    const match = await cache.match(url);
    if (!match) return null;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch { return null; }
}

export function listCachedPDFs(): CachedPDF[] { return pdfIndex(); }

export async function deleteCachedPDF(id: string): Promise<void> {
  const list = pdfIndex();
  const entry = list.find(p => p.id === id);
  if (entry && 'caches' in window) {
    try { const cache = await caches.open(PDF_CACHE_NAME); await cache.delete(entry.url); } catch {}
  }
  savePdfIndex(list.filter(p => p.id !== id));
}

export async function isPDFCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try { const cache = await caches.open(PDF_CACHE_NAME); return !!(await cache.match(url)); }
  catch { return false; }
}
