import React from 'react';
import { CompanionContext } from './types';
import LibraryNotepad from './LibraryNotepad';

export default function LibraryNotesTab({
  ctx,
  language = 'en',
  onAskAITutor,
  initialSourceText,
}: {
  ctx: CompanionContext;
  language?: string;
  onAskAITutor?: (prompt: string) => void;
  initialSourceText?: string;
}) {
  return (
    <div className="flex-1 overflow-hidden h-full">
      <LibraryNotepad
        ctx={ctx}
        language={language}
        onAskAITutor={onAskAITutor}
        initialSourceText={initialSourceText}
      />
    </div>
  );
}

