import type { LayerName } from '../types';
import { Knob } from './Knob';

interface Props {
  name: LayerName;
  enabled: boolean;
  volume: number;
  onToggle: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

const LAYER_INFO: Record<LayerName, { label: string; color: string; icon: string }> = {
  pad: { label: 'Pad', color: '#7b2ff7', icon: '◈' },
  arpeggio: { label: 'Arp', color: '#00f0ff', icon: '⟡' },
  bass: { label: 'Bass', color: '#ff9f1c', icon: '◉' },
  rhythm: { label: 'Rhythm', color: '#f43f5e', icon: '◆' },
  texture: { label: 'Texture', color: '#6366f1', icon: '✦' },
  lead: { label: 'Lead', color: '#10b981', icon: '◇' },
};

export function LayerCard({ name, enabled, volume, onToggle, onVolumeChange }: Props) {
  const info = LAYER_INFO[name];

  return (
    <div
      className={`
        flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 min-w-[60px]
        ${enabled
          ? 'bg-white/[0.04] border border-white/10'
          : 'bg-white/[0.01] border border-white/[0.04] opacity-40'
        }
      `}
    >
      <button
        onClick={() => onToggle(!enabled)}
        className="text-lg transition-all duration-300 hover:scale-110"
        style={{
          color: enabled ? info.color : 'rgba(255,255,255,0.2)',
          textShadow: enabled ? `0 0 8px ${info.color}60` : 'none',
        }}
        title={`Toggle ${info.label}`}
      >
        {info.icon}
      </button>
      <span className="text-[9px] uppercase tracking-wider text-white/40">{info.label}</span>
      {enabled && (
        <Knob
          value={volume}
          onChange={onVolumeChange}
          size={32}
          color={info.color}
        />
      )}
    </div>
  );
}
