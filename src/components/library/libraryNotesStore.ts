import { supabase } from '@/integrations/supabase/client';

export type NoteKind =
  | 'note'
  | 'highlight'
  | 'voice'
  | 'drawing'
  | 'ai'
  | 'quick'
  | 'formula'
  | 'code'
  | 'question'
  | 'summary'
  | 'todo'
  | 'flashcard';

export interface LibraryNoteItem {
  id: string;
  user_id?: string;
  content_item_id?: string | null;
  page: number;
  kind: NoteKind;
  title?: string;
  text: string;
  color?: string;
  tags?: string[];
  is_pinned?: boolean;
  chapter_id?: string;
  chapter_title?: string;
  topic_id?: string;
  topic_name?: string;
  source_text?: string;
  code_lang?: string;
  completed?: boolean;
  ai_conversation_id?: string;
  ai_message_id?: string;
  shared?: boolean;
  created_at: string;
  updated_at?: string;
}

const STORAGE_KEY = 'margeos_library_notes_v1';

function getLocalNotes(): LibraryNoteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalNotes(notes: LibraryNoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export async function fetchLibraryNotes(
  userId: string | undefined,
  contentItemId: string | null | undefined
): Promise<LibraryNoteItem[]> {
  const effectiveUserId = userId || 'guest';
  let remoteNotes: LibraryNoteItem[] = [];
  try {
    if (userId) {
      const { data, error } = await (supabase as any)
        .from('library_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('content_item_id', contentItemId ?? '')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        remoteNotes = data;
      }
    }
  } catch (e) {
    // Supabase query failed or table missing
  }

  // Merge with local storage notes
  const local = getLocalNotes().filter(
    n => (n.user_id === effectiveUserId || n.user_id === 'guest' || !n.user_id) &&
         (n.content_item_id === (contentItemId ?? null) || !contentItemId || !n.content_item_id)
  );

  const map = new Map<string, LibraryNoteItem>();
  [...remoteNotes, ...local].forEach(n => map.set(n.id, n));
  return Array.from(map.values()).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function insertLibraryNote(payload: {
  user_id?: string;
  content_item_id?: string | null;
  page: number;
  kind?: NoteKind;
  title?: string;
  text: string;
  color?: string;
  tags?: string[];
  is_pinned?: boolean;
  chapter_title?: string;
  topic_name?: string;
  source_text?: string;
  code_lang?: string;
  completed?: boolean;
  ai_conversation_id?: string;
  ai_message_id?: string;
  shared?: boolean;
}): Promise<LibraryNoteItem> {
  const userId = payload.user_id || 'guest';
  const newNote: LibraryNoteItem = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user_id: userId,
    content_item_id: payload.content_item_id ?? null,
    page: payload.page || 1,
    kind: payload.kind || 'note',
    title: payload.title || '',
    text: payload.text,
    color: payload.color || '#fbbf24',
    tags: payload.tags || [],
    is_pinned: payload.is_pinned ?? false,
    chapter_title: payload.chapter_title || '',
    topic_name: payload.topic_name || '',
    source_text: payload.source_text || '',
    code_lang: payload.code_lang || 'javascript',
    completed: payload.completed ?? false,
    ai_conversation_id: payload.ai_conversation_id,
    ai_message_id: payload.ai_message_id,
    shared: payload.shared ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save locally first (ensures immediate zero-error persistence)
  const localList = getLocalNotes();
  localList.unshift(newNote);
  saveLocalNotes(localList);

  // 2. Attempt Supabase sync if logged in
  if (payload.user_id && payload.user_id !== 'guest') {
    try {
      const { data, error } = await (supabase as any)
        .from('library_notes')
        .insert({
          user_id: payload.user_id,
          content_item_id: payload.content_item_id ?? null,
          page: payload.page,
          kind: payload.kind || 'note',
          text: payload.text,
          color: payload.color || '#fbbf24',
          shared: payload.shared ?? false,
        })
        .select()
        .single();
      if (!error && data) {
        return { ...newNote, ...data };
      }
    } catch (e) {
      console.warn('Supabase sync notice for library_notes (persisted locally):', e);
    }
  }

  return newNote;
}

export async function updateLibraryNote(
  id: string,
  patch: Partial<LibraryNoteItem>,
  userId?: string
): Promise<LibraryNoteItem | null> {
  const localList = getLocalNotes();
  let updatedNote: LibraryNoteItem | null = null;
  const updatedList = localList.map(n => {
    if (n.id === id) {
      updatedNote = { ...n, ...patch, updated_at: new Date().toISOString() };
      return updatedNote;
    }
    return n;
  });
  if (updatedNote) {
    saveLocalNotes(updatedList);
  }

  if (userId && userId !== 'guest' && updatedNote) {
    try {
      await (supabase as any)
        .from('library_notes')
        .update({
          text: (updatedNote as LibraryNoteItem).text,
          color: (updatedNote as LibraryNoteItem).color,
          page: (updatedNote as LibraryNoteItem).page,
        })
        .eq('id', id);
    } catch (e) {
      // Ignore
    }
  }

  return updatedNote;
}

export async function deleteLibraryNote(id: string, userId?: string): Promise<void> {
  const localList = getLocalNotes().filter(n => n.id !== id);
  saveLocalNotes(localList);

  if (userId && userId !== 'guest') {
    try {
      await (supabase as any).from('library_notes').delete().eq('id', id);
    } catch (e) {
      // Ignore remote delete failure
    }
  }
}

export async function toggleShareLibraryNote(note: LibraryNoteItem, userId?: string): Promise<boolean> {
  const newShared = !note.shared;
  const localList = getLocalNotes().map(n => n.id === note.id ? { ...n, shared: newShared } : n);
  saveLocalNotes(localList);

  if (userId && userId !== 'guest') {
    try {
      await (supabase as any).from('library_notes').update({ shared: newShared }).eq('id', note.id);
    } catch (e) {
      // Ignore
    }
  }
  return newShared;
}

