/**
 * Knowledge Universe — Custom Visual Hook for Recent Chats
 * Manages visibility detection, reduced motion preference, and time-persistent phase calculations.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateItemPhase, getPhaseCSSProperties } from './recentChatAnimation';
import { getChatVisualIdentity, ChatVisualIdentity } from './DynamicChatColor';
import { createLeftToRightGradient } from './RecentChatTheme';

export interface UseRecentChatVisualProps {
  chatId: string;
  createdAt: number;
  messages: Array<{ role: string; content: string; retryText?: string | null }>;
  isCurrentlyStreaming: boolean;
  isActiveChat: boolean;
  itemIndex: number;
}

export function useRecentChatVisual({
  chatId,
  createdAt,
  messages,
  isCurrentlyStreaming,
  isActiveChat,
  itemIndex,
}: UseRecentChatVisualProps) {
  // 1. Reduced Motion Check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 2. Deterministic Visual Identity
  const identity: ChatVisualIdentity = getChatVisualIdentity(
    chatId,
    createdAt,
    messages,
    isCurrentlyStreaming,
    isActiveChat
  );

  // 3. Time Phase State
  const [phase, setPhase] = useState<number>(() => calculateItemPhase(itemIndex, Date.now()));
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // 4. Smooth Phase Update Loop (Active only while mounted & visible)
  const updatePhase = useCallback(() => {
    if (prefersReducedMotion || !isVisibleRef.current) return;
    
    setPhase(calculateItemPhase(itemIndex, Date.now()));
    animFrameRef.current = requestAnimationFrame(updatePhase);
  }, [itemIndex, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(0);
      return;
    }

    isVisibleRef.current = document.visibilityState === 'visible';
    
    // Recalculate phase immediately from current timestamp
    setPhase(calculateItemPhase(itemIndex, Date.now()));

    if (isVisibleRef.current) {
      animFrameRef.current = requestAnimationFrame(updatePhase);
    }

    const handleVisibilityChange = () => {
      const isVis = document.visibilityState === 'visible';
      isVisibleRef.current = isVis;

      if (isVis) {
        // Immediately snap to current real time phase when user returns to page
        setPhase(calculateItemPhase(itemIndex, Date.now()));
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(updatePhase);
      } else {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [updatePhase, prefersReducedMotion, itemIndex]);

  // 5. Build Gradient & Styling Properties
  const gradientCss = createLeftToRightGradient(identity.sequence, 0.9);
  const phaseStyles = getPhaseCSSProperties(phase, identity.baseIndex * 51.4);

  return {
    identity,
    phase,
    prefersReducedMotion,
    gradientCss,
    phaseStyles,
  };
}
