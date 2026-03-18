interface Props {
  isRecording: boolean;
}

export function RecordingIndicator({ isRecording }: Props) {
  if (!isRecording) return null;

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 glow-red z-50">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-recording-pulse" />
      <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider">Recording</span>
    </div>
  );
}
