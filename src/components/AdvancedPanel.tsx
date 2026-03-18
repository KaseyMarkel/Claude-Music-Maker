import type { AdvancedSettings, ArpPattern, ArpRate, ScaleType } from '../types';

interface Props {
  settings: AdvancedSettings;
  onChange: (settings: Partial<AdvancedSettings>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ARP_RATES: { value: ArpRate; label: string }[] = [
  { value: '8n', label: '1/8' },
  { value: '16n', label: '1/16' },
  { value: '32n', label: '1/32' },
  { value: '8t', label: '1/8T' },
  { value: '16t', label: '1/16T' },
];

const ARP_PATTERNS: { value: ArpPattern; label: string }[] = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'up-down', label: 'Up-Down' },
  { value: 'random', label: 'Random' },
  { value: 'euclidean', label: 'Euclidean' },
];

const SCALES: { value: ScaleType; label: string }[] = [
  { value: 'natural-minor', label: 'Natural Minor' },
  { value: 'harmonic-minor', label: 'Harmonic Minor' },
  { value: 'phrygian-dominant', label: 'Phrygian Dom.' },
  { value: 'major', label: 'Major' },
];

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const PROGRESSIONS = [
  { value: 'generative', label: 'Generative' },
  { value: 'i-VI-III-VII', label: 'i-VI-III-VII' },
  { value: 'i-iv-VI-V', label: 'i-iv-VI-V' },
  { value: 'i-III-VII-IV', label: 'i-III-VII-IV' },
];

function SelectGroup<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-widest text-white/30 mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              px-2 py-0.5 rounded text-[10px] font-mono transition-all
              ${value === opt.value
                ? 'bg-cyan/20 text-cyan border border-cyan/30'
                : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min = 0, max = 1, step = 0.01 }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <div className="flex justify-between">
        <label className="text-[9px] uppercase tracking-widest text-white/30">{label}</label>
        <span className="text-[9px] text-white/20">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full mt-1"
      />
    </div>
  );
}

export function AdvancedPanel({ settings, onChange, isOpen, onToggle }: Props) {
  return (
    <div className="w-full">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors mx-auto"
      >
        <span>{isOpen ? '▾' : '▸'}</span>
        Advanced
      </button>

      {isOpen && (
        <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <SelectGroup
              label="Arp Rate"
              value={settings.arpRate}
              options={ARP_RATES}
              onChange={(v) => onChange({ arpRate: v })}
            />
            <SelectGroup
              label="Arp Pattern"
              value={settings.arpPattern}
              options={ARP_PATTERNS}
              onChange={(v) => onChange({ arpPattern: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SliderControl
              label="Reverb"
              value={settings.reverb}
              onChange={(v) => onChange({ reverb: v })}
            />
            <SliderControl
              label="Delay Feedback"
              value={settings.delayFeedback}
              onChange={(v) => onChange({ delayFeedback: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectGroup
              label="Scale"
              value={settings.scale}
              options={SCALES}
              onChange={(v) => onChange({ scale: v })}
            />
            <SelectGroup
              label="Key"
              value={settings.rootNote}
              options={KEYS.map(k => ({ value: k, label: k }))}
              onChange={(v) => onChange({ rootNote: v })}
            />
          </div>

          <SelectGroup
            label="Progression"
            value={settings.progressionMode}
            options={PROGRESSIONS as { value: typeof settings.progressionMode; label: string }[]}
            onChange={(v) => onChange({ progressionMode: v })}
          />
        </div>
      )}
    </div>
  );
}
