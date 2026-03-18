interface Props {
  isPlaying: boolean;
  isRecording: boolean;
  recordingTime: number;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onStopRecord: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TransportBar({
  isPlaying, isRecording, recordingTime,
  onPlay, onStop, onRecord, onStopRecord
}: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
          ${isPlaying
            ? 'bg-white/10 hover:bg-white/15 glow-cyan'
            : 'bg-cyan/20 hover:bg-cyan/30 glow-cyan'
          }
        `}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-cyan">
            <rect x="1" y="1" width="4" height="12" rx="1" />
            <rect x="9" y="1" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-cyan ml-0.5">
            <polygon points="2,0 14,7 2,14" />
          </svg>
        )}
      </button>

      {/* Record */}
      <button
        onClick={isRecording ? onStopRecord : onRecord}
        disabled={!isPlaying}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
          ${!isPlaying ? 'opacity-30 cursor-not-allowed' : ''}
          ${isRecording
            ? 'bg-red-500/20 glow-red'
            : 'bg-white/5 hover:bg-white/10'
          }
        `}
      >
        <div className={`
          w-3 h-3 rounded-full
          ${isRecording ? 'bg-red-500 animate-recording-pulse' : 'bg-red-400/60'}
        `} />
      </button>

      {/* Recording time */}
      {isRecording && (
        <span className="text-[11px] text-red-400 font-mono tabular-nums">
          {formatTime(recordingTime)}
        </span>
      )}
    </div>
  );
}
