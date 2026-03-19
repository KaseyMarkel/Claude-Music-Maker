import type { GridCellConfig } from '../types';

interface Props {
  config: GridCellConfig;
  enabled: boolean;
  volume: number;
  onToggle: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

export function GridCell({ config, enabled, volume, onToggle, onVolumeChange }: Props) {
  return (
    <div
      className={`
        grid-cell relative flex flex-col items-center justify-center gap-0.5 rounded-md transition-all duration-200
        cursor-pointer select-none
        ${enabled
          ? 'bg-white/[0.06] border border-white/15 shadow-lg'
          : 'bg-white/[0.015] border border-white/[0.04] opacity-40 hover:opacity-60 hover:bg-white/[0.03]'
        }
      `}
      style={enabled ? {
        boxShadow: `0 0 12px ${config.color}30, inset 0 0 8px ${config.color}10`,
        borderColor: `${config.color}40`,
      } : {}}
      onClick={() => onToggle(!enabled)}
      title={`${config.name} (${config.category})`}
    >
      <span
        className="text-sm leading-none transition-all duration-200"
        style={{
          color: enabled ? config.color : 'rgba(255,255,255,0.25)',
          textShadow: enabled ? `0 0 6px ${config.color}50` : 'none',
          filter: enabled ? 'none' : 'grayscale(1)',
        }}
      >
        {config.icon}
      </span>
      <span className="text-[8px] uppercase tracking-wider text-white/40 leading-none">
        {config.name}
      </span>
      {enabled && (
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={volume}
          onChange={(e) => { e.stopPropagation(); onVolumeChange(Number(e.target.value)); }}
          onClick={(e) => e.stopPropagation()}
          className="grid-cell-slider absolute bottom-0 left-0 w-full opacity-0 hover:opacity-100 transition-opacity"
          style={{ height: '6px' }}
        />
      )}
    </div>
  );
}
