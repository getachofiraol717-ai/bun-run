/**
 * Knowledge Universe — Time-Persistent Animation & Phase Calculation
 * Derives visual movement purely from real time (Date.now()), guaranteeing:
 * 1. Zero background battery drain or timers when page/tab is closed.
 * 2. Instant visual continuity when the student reopens AI Tutor.
 * 3. Smooth LEFT -> RIGHT 7-color gradient movement.
 */

export interface TimePhaseOptions {
  cycleDurationMs?: number; // Duration of one full 7-color cycle (default: 12000ms = 12s)
  referenceTimeMs?: number; // Fixed epoch reference timestamp
}

const DEFAULT_CYCLE_MS = 12000;
const DEFAULT_EPOCH_REF = 1704067200000; // Fixed anchor timestamp (Jan 1 2024 00:00:00 UTC)

/**
 * Calculates current time phase [0.0 ... 1.0) purely from real time.
 * Absolutely deterministic for any given millisecond.
 */
export function calculateTimePhase(
  currentTimeMs: number = Date.now(),
  options: TimePhaseOptions = {}
): number {
  const cycle = options.cycleDurationMs || DEFAULT_CYCLE_MS;
  const ref = options.referenceTimeMs || DEFAULT_EPOCH_REF;

  const elapsed = Math.max(0, currentTimeMs - ref);
  const rawPhase = (elapsed % cycle) / cycle;
  return rawPhase;
}

/**
 * Calculates a shifted phase for a specific item to stagger animation across recent chats.
 */
export function calculateItemPhase(
  itemIndex: number,
  currentTimeMs: number = Date.now(),
  options: TimePhaseOptions = {}
): number {
  const basePhase = calculateTimePhase(currentTimeMs, options);
  const staggerOffset = (itemIndex * 0.1428) % 1; // 1/7 offset per item index
  return (basePhase + staggerOffset) % 1;
}

/**
 * Converts a time phase (0..1) into CSS Custom Properties for a Left-To-Right 7-color gradient.
 */
export function getPhaseCSSProperties(phase: number, baseHueShift = 0): React.CSSProperties {
  // Move background position smoothly from 0% to 200% for smooth seamless left-to-right flow
  const backgroundPositionX = `${(phase * 200).toFixed(2)}%`;
  const angle = Math.round((phase * 360 + baseHueShift) % 360);

  return {
    '--rgb-phase-percent': `${(phase * 100).toFixed(2)}%`,
    '--rgb-bg-position-x': backgroundPositionX,
    '--rgb-angle': `${angle}deg`,
  } as React.CSSProperties;
}
