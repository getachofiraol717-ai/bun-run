/**
 * Knowledge Universe — Media & Attachment Service
 * Handles file validation, storage uploading, and voice note recording.
 */

import { supabase } from '@/integrations/supabase/client';
import { MessageAttachment, VoiceNote } from '../types';
import { getFileTypeFromMime, MAX_ATTACHMENT_SIZE_BYTES } from '../utils/attachmentUtils';

export class MediaService {
  /**
   * Upload an attachment file to Supabase Storage or generate data URL fallback
   */
  static async uploadAttachment(file: File, userId: string): Promise<MessageAttachment> {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error(`File size exceeds maximum allowed limit of 25MB.`);
    }

    const fileType = getFileTypeFromMime(file.type, file.name);
    const fileName = `${userId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
      // Try uploading to 'avatars' or generic attachments storage bucket
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`attachments/${fileName}`, file, { upsert: true });

      if (!error && data) {
        const { data: pubUrl } = supabase.storage.from('avatars').getPublicUrl(data.path);
        return {
          id: 'att_' + Date.now(),
          name: file.name,
          url: pubUrl.publicUrl,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
        };
      }
    } catch (e) {
      console.warn('Storage bucket upload fallback:', e);
    }

    // Fallback: Read as Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      id: 'att_' + Date.now(),
      name: file.name,
      url: dataUrl,
      file_type: fileType,
      file_size: file.size,
      mime_type: file.type,
    };
  }

  /**
   * Upload Voice Note recording blob
   */
  static async uploadVoiceNote(blob: Blob, durationSeconds: number, userId: string): Promise<VoiceNote> {
    const file = new File([blob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
    const attachment = await this.uploadAttachment(file, userId);

    return {
      id: 'vn_' + Date.now(),
      audio_url: attachment.url,
      duration: durationSeconds,
      file_size: blob.size,
      created_at: new Date().toISOString(),
    };
  }
}
