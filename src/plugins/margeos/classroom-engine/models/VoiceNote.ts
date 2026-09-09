// @ts-nocheck
/**
 * VoiceNote.ts
 *
 * Model for VoiceNote entity with transcription support.
 */

export type VoiceNoteStatus = 'recording' | 'uploading' | 'processing' | 'ready' | 'failed';

export interface ProcessingInfo {
  isProcessing: boolean;
  completed: boolean;
  completedAt?: string;
  error?: string;
}

export interface TranscriptionInfo {
  text: string;
  language: string;
  confidence: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  completedAt?: string;
}

export interface PlaybackInfo {
  playCount: number;
  playedBy: string[];
  lastPlayedAt?: string;
  avgListenPercent: number;
  totalListenTime: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  odcupy;
  userId: string;
  createdAt: string;
}

export interface VoiceNote {
  id: string;
  classroomId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  duration: number;
  mimeType: string;
  audioUrl: string;
  transcription: TranscriptionInfo | null;
  hasTranscript: boolean;
  status: VoiceNoteStatus;
  processing: ProcessingInfo;
  playbackInfo: PlaybackInfo;
  reactions: Reaction[];
  reactionCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Factory functions
 */

export function createVoiceNote(
  classroomId: string,
  channelId: string,
  senderId: string,
  senderName: string,
  duration: number
): VoiceNote {
  return {
    id: `VN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    channelId,
    senderId,
    senderName,
    duration,
    mimeType: 'audio/webm',
    audioUrl: '',
    transcription: null,
    hasTranscript: false,
    status: 'recording',
    processing: {
      isProcessing: true,
      completed: false
    },
    playbackInfo: {
      playCount: 0,
      playedBy: [],
      avgListenPercent: 0,
      totalListenTime: 0
    },
    reactions: [],
    reactionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function addTranscription(
  voiceNote: VoiceNote,
  transcript: string,
  language: string = 'en',
  confidence: number = 0.95
): VoiceNote {
  voiceNote.transcription = {
    text: transcript,
    language,
    confidence,
    words: parseTranscriptToWords(transcript),
    completedAt: new Date().toISOString()
  };
  voiceNote.hasTranscript = true;
  voiceNote.updatedAt = new Date().toISOString();
  return voiceNote;
}

export function updatePlaybackInfo(
  voiceNote: VoiceNote,
  playCount: number,
  avgListenPercent: number,
  totalListenTime: number
): VoiceNote {
  voiceNote.playbackInfo = {
    playCount,
    playedBy: voiceNote.playbackInfo.playedBy,
    lastPlayedAt: new Date().toISOString(),
    avgListenPercent,
    totalListenTime
  };
  voiceNote.updatedAt = new Date().toISOString();
  return voiceNote;
}

export function addReaction(
  voiceNote: VoiceNote,
  emoji: string,
  userId: string
): VoiceNote {
  const existing = voiceNote.reactions.find(r => r.emoji === emoji && r.userId === userId);
  if (existing) return voiceNote;

  voiceNote.reactions.push({
    id: `VN-REACT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    emoji,
    userId,
    createdAt: new Date().toISOString()
  });

  voiceNote.reactionCount = voiceNote.reactions.length;
  voiceNote.updatedAt = new Date().toISOString();

  return voiceNote;
}

export function removeReaction(
  voiceNote: VoiceNote,
  emoji: string,
  userId: string
): VoiceNote {
  const index = voiceNote.reactions.findIndex(r => r.emoji === emoji && r.userId === userId);
  if (index > -1) {
    voiceNote.reactions.splice(index, 1);
    voiceNote.reactionCount = voiceNote.reactions.length;
    voiceNote.updatedAt = new Date().toISOString();
  }

  return voiceNote;
}

function parseTranscriptToWords(text: string): TranscriptionInfo['words'] {
  return text.split(/\s+/).map((word, index) => ({
    word,
    start: index * 0.5,
    end: (index + 1) * 0.5,
    confidence: 0.95
  }));
}

export function formatVoiceDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getPlaybackSpeedOptions(): number[] {
  return [0.5, 0.75, 1, 1.25, 1.5, 2];
}

export function isVoiceNotePlayable(voiceNote: VoiceNote): boolean {
  return voiceNote.status === 'ready' && !!voiceNote.audioUrl;
}

export function getWaveformData(duration: number): number[] {
  // Generate random waveform data for visualization
  const sampleCount = Math.min(Math.floor(duration * 10), 100);
  const waveform: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    waveform.push(Math.random() * 0.8 + 0.2);
  }

  return waveform;
}
