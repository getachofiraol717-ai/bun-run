/**
 * useVoiceNotes.ts
 *
 * React hook for voice note operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceNoteEngine } from '../engines';
import { VoiceNote } from '../models';

export interface UseVoiceNotesOptions {
  channelId?: string;
  limit?: number;
}

export interface UseVoiceNotesReturn {
  voiceNotes: VoiceNote[];
  loading: boolean;
  error: string | null;
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<VoiceNote | null>;
  cancelRecording: () => void;
  deleteVoiceNote: (noteId: string) => boolean;
  toggleReaction: (noteId: string, emoji: string) => void;
  transcribe: (noteId: string, transcript: string, language?: string) => boolean;
  formatDuration: (seconds: number) => string;
}

export function useVoiceNotes(
  options: UseVoiceNotesOptions = {}
): UseVoiceNotesReturn {
  const { channelId, limit } = options;

  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const voiceNoteEngine = VoiceNoteEngine.getInstance();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>( null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load voice notes
  const loadVoiceNotes = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      const loadedNotes = voiceNoteEngine.getChannelVoiceNotes(channelId, limit);
      setVoiceNotes(loadedNotes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [channelId, limit, voiceNoteEngine]);

  // Initial load
  useEffect(() => {
    loadVoiceNotes();
  }, [loadVoiceNotes]);

  // Subscribe to updates
  useEffect(() => {
    if (!channelId) return;

    const unsubscribe = voiceNoteEngine.subscribe('voiceNoteCreated', (note) => {
      if (note.channelId === channelId) {
        setVoiceNotes(prev => [note, ...prev]);
      }
    });

    return () => unsubscribe();
  }, [channelId, voiceNoteEngine]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      recordingStartRef.current = Date.now();
      setIsRecording(true);

      // Update duration
      durationIntervalRef.current = setInterval(() => {
        if (recordingStartRef.current) {
          setRecordingDuration((Date.now() - recordingStartRef.current) / 1000);
        }
      }, 100);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<VoiceNote | null> => {
    if (!mediaRecorderRef.current || !channelId) return null;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }

        const duration = recordingStartRef.current
          ? (Date.now() - recordingStartRef.current) / 1000
          : 0;

        setIsRecording(false);
        setRecordingDuration(0);

        // Create blob
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;

          try {
            const note = voiceNoteEngine.createVoiceNote(
              channelId,
              channelId,
              'current-user',
              'Current User',
              duration,
              dataUrl,
              mediaRecorder.mimeType
            );

            resolve(note);
          } catch (err) {
            setError((err as Error).message);
            resolve(null);
          }
        };

        reader.readAsDataURL(blob);
      };

      mediaRecorder.stop();
    });
  }, [channelId, voiceNoteEngine]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    audioChunksRef.current = [];
    recordingStartRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  // Delete voice note
  const deleteVoiceNote = useCallback((noteId: string): boolean => {
    try {
      const result = voiceNoteEngine.deleteVoiceNote(noteId);
      if (result) {
        setVoiceNotes(prev => prev.filter(n => n.id !== noteId));
      }
      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [voiceNoteEngine]);

  // Toggle reaction
  const toggleReaction = useCallback((noteId: string, emoji: string) => {
    const userId = 'current-user';
    voiceNoteEngine.toggleReaction(noteId, userId, emoji);
  }, [voiceNoteEngine]);

  // Transcribe
  const transcribe = useCallback((noteId: string, transcript: string, language?: string): boolean => {
    try {
      const result = voiceNoteEngine.addTranscription(noteId, transcript, language);
      if (result) {
        setVoiceNotes(prev => prev.map(n =>
          n.id === noteId
            ? { ...n, transcription: { text: transcript, language: language || 'en', confidence: 0.95, words: [], completedAt: new Date().toISOString() }, hasTranscript: true }
            : n
        ));
      }
      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [voiceNoteEngine]);

  // Format duration
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    voiceNotes,
    loading,
    error,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    deleteVoiceNote,
    toggleReaction,
    transcribe,
    formatDuration
  };
}

export default useVoiceNotes;
