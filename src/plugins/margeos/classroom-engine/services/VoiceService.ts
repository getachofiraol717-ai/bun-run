/**
 * VoiceService.ts
 *
 * High-level service for voice note operations.
 */

import { VoiceNoteEngine } from '../engines';
import { VoiceNote } from '../models';

class VoiceService {
  private static instance: VoiceService;
  private voiceNoteEngine: VoiceNoteEngine;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private recordingStartTime?: number;
  private localUserId?: string;
  private localUserName?: string;
  private isRecording: boolean = false;

  private constructor() {
    this.voiceNoteEngine = VoiceNoteEngine.getInstance();
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async initialize(): Promise<void> {
    await this.voiceNoteEngine.initialize();
  }

  setLocalUser(userId: string, userName: string): void {
    this.localUserId = userId;
    this.localUserName = userName;
  }

  // Check microphone permission
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch {
      return 'prompt';
    }
  }

  // Start recording
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    const permission = await this.checkPermission();
    if (permission === 'denied') {
      throw new Error('Microphone permission denied');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.audioChunks = [];
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
    } catch (error) {
      throw new Error(`Failed to start recording: ${(error as Error).message}`);
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  // Stop recording and get audio blob
  async stopRecording(): Promise<{ blob: Blob; duration: number }> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('Not recording');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = this.recordingStartTime
          ? (Date.now() - this.recordingStartTime) / 1000
          : 0;

        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType });

        // Stop all tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());

        this.audioChunks = [];
        this.recordingStartTime = undefined;
        this.isRecording = false;

        resolve({ blob, duration });
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event}`));
      };

      this.mediaRecorder.stop();
    });
  }

  // Cancel recording
  cancelRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    this.audioChunks = [];
    this.recordingStartTime = undefined;
    this.isRecording = false;
  }

  // Save voice note
  async saveVoiceNote(
    classroomId: string,
    channelId: string,
    blob: Blob,
    duration: number
  ): Promise<VoiceNote> {
    if (!this.localUserId || !this.localUserName) {
      throw new Error('Local user not set');
    }

    // Convert blob to data URL
    const dataUrl = await this.blobToDataUrl(blob);

    return this.voiceNoteEngine.createVoiceNote(
      classroomId,
      channelId,
      this.localUserId,
      this.localUserName,
      duration,
      dataUrl,
      blob.type
    );
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  // Get voice note
  getVoiceNote(noteId: string): VoiceNote | undefined {
    return this.voiceNoteEngine.getVoiceNote(noteId);
  }

  // Get channel voice notes
  getChannelVoiceNotes(channelId: string, limit?: number): VoiceNote[] {
    return this.voiceNoteEngine.getChannelVoiceNotes(channelId, limit);
  }

  // Add transcription
  addTranscription(noteId: string, transcript: string, language?: string): boolean {
    return this.voiceNoteEngine.addTranscription(noteId, transcript, language);
  }

  // Delete voice note
  deleteVoiceNote(noteId: string): boolean {
    return this.voiceNoteEngine.deleteVoiceNote(noteId);
  }

  // Toggle reaction
  toggleReaction(noteId: string, emoji: string): boolean {
    if (!this.localUserId) return false;
    return this.voiceNoteEngine.toggleReaction(noteId, this.localUserId, emoji);
  }

  // Record play
  recordPlay(noteId: string, duration: number): boolean {
    if (!this.localUserId) return false;
    return this.voiceNoteEngine.recordPlay(noteId, this.localUserId, duration);
  }

  // Search transcripts
  searchTranscripts(query: string, filter?: { classroomId?: string; channelId?: string }): VoiceNote[] {
    return this.voiceNoteEngine.searchTranscripts(query, filter);
  }

  // Get stats
  getVoiceNoteStats(channelId: string): {
    totalNotes: number;
    totalDuration: number;
    avgDuration: number;
    transcribedCount: number;
    totalPlays: number;
    avgListenPercent: number;
  } {
    return this.voiceNoteEngine.getVoiceNoteStats(channelId);
  }

  // Format duration
  formatDuration(seconds: number): string {
    return this.voiceNoteEngine.formatDuration(seconds);
  }

  // Check if currently recording
  getIsRecording(): boolean {
    return this.isRecording;
  }

  // Get recording duration
  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }
}

export default VoiceService;
