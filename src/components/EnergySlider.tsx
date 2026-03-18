interface Props {
  value: number; // 0-100
  onChange: (value: number) => void;
}

export function EnergySlider({ value, onChange }: Props) {
  const gradient = `linear-gradient(90deg,
    rgba(123, 47, 247, 0.8) 0%,
    rgba(0, 240, 255, 0.8) ${value}%,
    rgba(255, 255, 255, 0.05) ${value}%
  )`;

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] uppercase tracking-widest text-white/40 font-display">Energy</span>
        <span className="text-[11px] text-cyan font-mono">{value}%</span>
      </div>
      <div className="relative">
        <div
          className="absolute inset-0 h-1.5 rounded-full top-[9px] pointer-events-none"
          style={{ background: gradient }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full"
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-white/20">Ambient</span>
        <span className="text-[9px] text-white/20">Euphoria</span>
      </div>
    </div>
  );
}
