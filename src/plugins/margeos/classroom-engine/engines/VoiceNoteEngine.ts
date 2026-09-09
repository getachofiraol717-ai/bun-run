// @ts-nocheck
/**
 * VoiceNoteEngine.ts
 *
 * Engine for managing voice notes with transcription support.
 */

import { VoiceNote, createVoiceNote, VoiceNoteStatus } from '../models';

const STORAGE_KEY = 'voice_note_engine_data';

export interface VoiceNoteEngineConfig {
  maxDuration?: number; // in seconds
  enableTranscription?: boolean;
  enablePlaybackSpeed?: boolean;
  maxNotes?: number;
}

export interface VoiceNoteFilter {
  classroomId?: string;
  channelId?: string;
  senderId?: string;
  hasTranscript?: boolean;
  startDate?: string;
  endDate?: string;
}

export class VoiceNoteEngine {
  private static instance: VoiceNoteEngine;
  private voiceNotes: Map<string, VoiceNote> = new Map();
  private channelVoiceNotes: Map<string, string[]> = new Map();
  private config: VoiceNoteEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: VoiceNoteEngineConfig = {}) {
    this.config = {
      maxDuration: config.maxDuration || 300, // 5 minutes default
      enableTranscription: config.enableTranscription !== false,
      enablePlaybackSpeed: config.enablePlaybackSpeed !== false,
      maxNotes: config.maxNotes || 1000
    };
  }

  static getInstance(config?: VoiceNoteEngineConfig): VoiceNoteEngine {
    if (!VoiceNoteEngine.instance) {
      VoiceNoteEngine.instance = new VoiceNoteEngine(config);
    }
    return VoiceNoteEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.voiceNotes = new Map(Object.entries(data.voiceNotes || {}));
        this.channelVoiceNotes = new Map(Object.entries(data.channelVoiceNotes || {}));
      }
    } catch (error) {
      console.error('Failed to load voice notes from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        voiceNotes: Object.fromEntries(this.voiceNotes),
        channelVoiceNotes: Object.fromEntries(this.channelVoiceNotes)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save voice notes to storage:', error);
    }
  }

  createVoiceNote(
    classroomId: string,
    channelId: string,
    senderId: string,
    senderName: string,
    duration: number,
    audioDataUrl: string,
    mimeType: string = 'audio/webm'
  ): VoiceNote {
    if (duration > this.config.maxDuration!) {
      throw new Error(`Voice note duration exceeds maximum of ${this.config.maxDuration} seconds`);
    }

    const note = createVoiceNote(classroomId, channelId, senderId, senderName, duration);
    note.audioUrl = audioDataUrl;
    note.mimeType = mimeType;
    note.status = 'ready';
    note.processing.completed = true;
    note.processing.completedAt = new Date().toISOString();

    this.voiceNotes.set(note.id, note);

    // Update channel index
    const channelNotes = this.channelVoiceNotes.get(channelId) || [];
    channelNotes.push(note.id);
    this.channelVoiceNotes.set(channelId, channelNotes);

    this.saveToStorage();
    this.emit('voiceNoteCreated', note);

    return note;
  }

  getVoiceNote(noteId: string): VoiceNote | undefined {
    return this.voiceNotes.get(noteId);
  }

  getChannelVoiceNotes(channelId: string, limit?: number): VoiceNote[] {
    const noteIds = this.channelVoiceNotes.get(channelId) || [];
    let notes = noteIds.map(id => this.voiceNotes.get(id)).filter((n): n is VoiceNote => n !== undefined);

    // Sort by createdAt descending
    notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (limit) {
      notes = notes.slice(0, limit);
    }

    return notes;
  }

  getVoiceNotes(filter: VoiceNoteFilter = {}): VoiceNote[] {
    let notes = Array.from(this.voiceNotes.values());

    if (filter.classroomId) {
      notes = notes.filter(n => n.classroomId === filter.classroomId);
    }
    if (filter.channelId) {
      notes = notes.filter(n => n.channelId === filter.channelId);
    }
    if (filter.senderId) {
      notes = notes.filter(n => n.senderId === filter.senderId);
    }
    if (filter.hasTranscript !== undefined) {
      notes = notes.filter(n =>
        filter.hasTranscript ? n.transcription !== null : n.transcription === null
      );
    }
    if (filter.startDate) {
      notes = notes.filter(n => n.createdAt >= filter.startDate!);
    }
    if (filter.endDate) {
      notes = notes.filter(n => n.createdAt <= filter.endDate!);
    }

    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateVoiceNote(noteId: string, updates: Partial<VoiceNote>): VoiceNote | undefined {
    const note = this.voiceNotes.get(noteId);
    if (!note) return undefined;

    Object.assign(note, updates);
    this.saveToStorage();

    this.emit('voiceNoteUpdated', note);
    return note;
  }

  deleteVoiceNote(noteId: string): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    // Remove from channel index
    const channelNotes = this.channelVoiceNotes.get(note.channelId);
    if (channelNotes) {
      const index = channelNotes.indexOf(noteId);
      if (index > -1) {
        channelNotes.splice(index, 1);
      }
    }

    this.voiceNotes.delete(noteId);
    this.saveToStorage();

    this.emit('voiceNoteDeleted', { noteId, channelId: note.channelId });
    return true;
  }

  addTranscription(noteId: string, transcript: string, language: string = 'en'): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    note.transcription = {
      text: transcript,
      language,
      confidence: 0.95,
      words: this.parseTranscriptWords(transcript),
      completedAt: new Date().toISOString()
    };
    note.hasTranscript = true;

    this.saveToStorage();
    this.emit('transcriptionAdded', { noteId, transcript });
    return true;
  }

  private parseTranscriptWords(text: string): any[] {
    // Simple word parsing - in production would include timestamps
    return text.split(/\s+/).map((word, index) => ({
      word,
      start: index * 0.5,
      end: (index + 1) * 0.5,
      confidence: 0.95
    }));
  }

  updatePlaybackInfo(noteId: string, info: Partial<VoiceNote['playbackInfo']>): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    note.playbackInfo = { ...note.playbackInfo, ...info };
    this.saveToStorage();

    this.emit('playbackInfoUpdated', { noteId, info });
    return true;
  }

  recordPlay(noteId: string, userId: string, duration: number): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    if (!note.playbackInfo.playedBy.includes(userId)) {
      note.playbackInfo.playedBy.push(userId);
    }

    note.playbackInfo.playCount++;
    note.playbackInfo.lastPlayedAt = new Date().toISOString();
    note.playbackInfo.totalListenTime += duration;

    // Update average listen percentage
    const listenPercent = (duration / note.duration) * 100;
    const currentAvg = note.playbackInfo.avgListenPercent;
    const plays = note.playbackInfo.playCount;
    note.playbackInfo.avgListenPercent = ((currentAvg * (plays - 1)) + listenPercent) / plays;

    this.saveToStorage();
    this.emit('voiceNotePlayed', { noteId, userId, duration });
    return true;
  }

  addReaction(noteId: string, userId: string, emoji: string): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    const existingReaction = note.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existingReaction) return false;

    note.reactions.push({
      id: `VN-REACT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      emoji,
      userId,
      createdAt: new Date().toISOString()
    });

    note.reactionCount = note.reactions.length;
    this.saveToStorage();

    this.emit('reactionAdded', { noteId, emoji, userId });
    return true;
  }

  removeReaction(noteId: string, userId: string, emoji: string): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    const index = note.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
    if (index === -1) return false;

    note.reactions.splice(index, 1);
    note.reactionCount = note.reactions.length;
    this.saveToStorage();

    this.emit('reactionRemoved', { noteId, emoji, userId });
    return true;
  }

  toggleReaction(noteId: string, userId: string, emoji: string): boolean {
    const note = this.voiceNotes.get(noteId);
    if (!note) return false;

    const existingReaction = note.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existingReaction) {
      return this.removeReaction(noteId, userId, emoji);
    } else {
      return this.addReaction(noteId, userId, emoji);
    }
  }

  searchTranscripts(query: string, filter: VoiceNoteFilter = {}): VoiceNote[] {
    const lowerQuery = query.toLowerCase();
    let notes = this.getVoiceNotes(filter).filter(n =>
      n.transcription && n.transcription.text.toLowerCase().includes(lowerQuery)
    );

    return notes;
  }

  getVoiceNoteStats(channelId: string): {
    totalNotes: number;
    totalDuration: number;
    avgDuration: number;
    transcribedCount: number;
    totalPlays: number;
    avgListenPercent: number;
  } {
    const notes = this.getChannelVoiceNotes(channelId);

    if (notes.length === 0) {
      return {
        totalNotes: 0,
        totalDuration: 0,
        avgDuration: 0,
        transcribedCount: 0,
        totalPlays: 0,
        avgListenPercent: 0
      };
    }

    const transcribedCount = notes.filter(n => n.hasTranscript).length;
    const totalPlays = notes.reduce((sum, n) => sum + n.playbackInfo.playCount, 0);
    const totalListenPercent = notes.reduce((sum, n) => sum + n.playbackInfo.avgListenPercent, 0);

    return {
      totalNotes: notes.length,
      totalDuration: notes.reduce((sum, n) => sum + n.duration, 0),
      avgDuration: notes.reduce((sum, n) => sum + n.duration, 0) / notes.length,
      transcribedCount,
      totalPlays,
      avgListenPercent: totalListenPercent / notes.length
    };
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  getStats(): { totalNotes: number; totalDuration: number; transcribedCount: number } {
    const allNotes = Array.from(this.voiceNotes.values());
    return {
      totalNotes: allNotes.length,
      totalDuration: allNotes.reduce((sum, n) => sum + n.duration, 0),
      transcribedCount: allNotes.filter(n => n.hasTranscript).length
    };
  }
}

export default VoiceNoteEngine;
