import { useRef } from 'react';
import type { Snapshot } from '../types';

interface Props {
  onSave: () => Snapshot;
  onLoad: (snapshot: Snapshot) => void;
}

export function SnapshotManager({ onSave, onLoad }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const snapshot = onSave();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petalwave-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const snapshot = JSON.parse(evt.target?.result as string) as Snapshot;
        onLoad(snapshot);
      } catch {
        console.error('Invalid snapshot file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSave}
        className="px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider
          bg-white/[0.04] border border-white/10 text-white/50
          hover:bg-white/[0.08] hover:text-white/70 transition-all"
      >
        Save
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider
          bg-white/[0.04] border border-white/10 text-white/50
          hover:bg-white/[0.08] hover:text-white/70 transition-all"
      >
        Load
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleLoad}
        className="hidden"
      />
    </div>
  );
}
