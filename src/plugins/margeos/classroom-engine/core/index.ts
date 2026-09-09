// @ts-nocheck
/**
 * Core Index
 *
 * Barrel export for all core modules.
 */

// Re-exports from engines
export * from './ClassroomEngine';
export * from './MessagingEngine';
export * from './ChannelManager';
export * from './MediaManager';
export * from './VoiceNoteEngine';
export * from './NotificationEngine';
export * from './PresenceEngine';
export * from './ModerationEngine';

// Main controller
export { ClassroomController, ClassroomControllerConfig, ClassroomState, default } from './ClassroomController';
