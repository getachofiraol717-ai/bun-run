/**
 * Knowledge Universe — Communication Engine Entry Point
 */

export * from './types';
export * from './types/Communication';
export * from './types/Conversation';
export * from './types/Message';
export * from './store/communicationStore';
export * from './services/MessageService';
export * from './services/ConversationService';
export * from './services/MediaService';
export * from './services/AIChatService';
export * from './hooks/useCommunication';
export * from './hooks/useVoiceNote';
export * from './components/CommunicationHub';
export * from './components/ConversationList';
export * from './components/ConversationView';
export * from './components/MessageItem';
export * from './components/MessageComposer';
export * from './components/VoiceNotePlayer';
export * from './components/VoiceNoteRecorder';
export * from './components/MediaPicker';
export * from './components/AttachmentPreview';
export * from './components/PresenceIndicator';
export * from './components/AIChatMessage';
export * from './adapters/ClassroomCommunicationAdapter';
export * from './adapters/MultiplayerCommunicationAdapter';
export * from './adapters/LibraryCommunicationAdapter';
export * from './utils/attachmentUtils';
export * from './utils/communicationValidation';
export * from './utils/mediaUtils';
export * from './utils/messageUtils';
export * from './utils/permissionUtils';
