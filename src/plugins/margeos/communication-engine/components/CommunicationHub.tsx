import React, { useState } from 'react';
import { useCommunication } from '../hooks/useCommunication';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { X, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommunicationHubProps {
  userId?: string;
  userName?: string;
  className?: string;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  userId = 'explorer_user',
  userName = 'Knowledge Explorer',
  className = '',
}) => {
  const navigate = useNavigate();
  const {
    activeConversationId,
    activeConversation,
    conversations,
    currentMessages,
    typingUsers,
    activeTab,
    searchQuery,
    isMediaUploading,
    setActiveConversationId,
    setActiveTab,
    setSearchQuery,
    startDirectMessage,
    sendMessage,
    toggleReaction,
    uploadFile,
    deleteMessage,
  } = useCommunication(userId, userName);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('Physics');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    // Send initial group creation message
    const newGroupId = `room_group_${Date.now()}`;
    sendMessage(`🚀 Study Group "${newGroupName}" created for ${newGroupSubject}!`);
    setShowCreateModal(false);
    setNewGroupName('');
  };

  const handleOpenLibraryDoc = (url: string, name: string) => {
    navigate('/library', { state: { pdfUrl: url, title: name } });
  };

  return (
    <div className={`flex h-[calc(100vh-4rem)] w-full overflow-hidden border border-border/80 rounded-2xl bg-card shadow-2xl font-poppins ${className}`}>
      {/* Sidebar List */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSearchChange={(q) => setSearchQuery(q)}
        onCreateGroup={() => setShowCreateModal(true)}
        onStartDirectMessage={startDirectMessage}
      />

      {/* Main Conversation Canvas */}
      <ConversationView
        conversation={activeConversation}
        messages={currentMessages}
        typingUsers={typingUsers}
        currentUserId={userId}
        onSendMessage={async (text, type, replyTo, atts) => {
          await sendMessage(text, type, replyTo, atts);
        }}
        onSendVoiceNote={async (blob, duration) => {
          const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          const att = await uploadFile(file);
          await sendMessage('🎤 Sent a voice note', 'voice_note', undefined, [att]);
        }}
        onUploadFile={uploadFile}
        onToggleReaction={toggleReaction}
        onDeleteMessage={deleteMessage}
        onOpenLibraryDoc={handleOpenLibraryDoc}
        isMediaUploading={isMediaUploading}
      />

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Create Learning Study Group
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Group Title</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Quantum Mechanics Mastermind"
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Subject</label>
                <select
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-md"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
