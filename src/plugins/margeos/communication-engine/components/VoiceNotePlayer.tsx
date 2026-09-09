import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { formatAudioDuration, generateDummyWaveform } from '../utils/mediaUtils';

interface VoiceNotePlayerProps {
  audioUrl: string;
  durationSeconds?: number;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ audioUrl, durationSeconds = 12 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [waveformBars] = useState(() => generateDummyWaveform(24));

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-1.5 p-2.5 rounded-2xl bg-card/80 border border-border/80 flex items-center gap-3 max-w-xs shadow-sm">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-md"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        {/* Waveform Bars */}
        <div className="flex items-center gap-0.5 h-6 mb-1">
          {waveformBars.map((barHeight, idx) => {
            const barPct = (idx / waveformBars.length) * 100;
            const isPassed = barPct <= progressPct;

            return (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPassed ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                style={{ height: `${barHeight}%` }}
              />
            );
          })}
        </div>

        {/* Time counter */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-poppins font-medium">
          <span className="flex items-center gap-1">
            <Mic className="h-2.5 w-2.5 text-primary" />
            Voice Note
          </span>
          <span>
            {formatAudioDuration(currentTime)} / {formatAudioDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
