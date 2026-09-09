export function formatAudioDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateDummyWaveform(length = 30): number[] {
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    result.push(Math.floor(Math.random() * 80) + 20);
  }
  return result;
}
