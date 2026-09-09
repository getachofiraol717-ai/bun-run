import React from 'react';
import { CommunicationHub } from '@/plugins/margeos/communication-engine';
import { useAuth } from '@/contexts/AuthContext';

export default function Communication() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 px-4 pb-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-5.5rem)]">
        <CommunicationHub
          userId={user?.id || 'explorer_guest'}
          userName={profile?.name || 'Knowledge Explorer'}
        />
      </div>
    </div>
  );
}
