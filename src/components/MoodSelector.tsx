import type { MoodType } from '../types';

interface Props {
  selected: MoodType;
  onChange: (mood: MoodType) => void;
}

const MOODS: { id: MoodType; label: string; desc: string; color: string }[] = [
  { id: 'euphoria', label: 'Euphoria', desc: 'Major, soaring, fast', color: '#ff9f1c' },
  { id: 'deep', label: 'Deep', desc: 'Minor, hypnotic, heavy', color: '#00f0ff' },
  { id: 'psychedelic', label: 'Psychedelic', desc: 'Phrygian, textural', color: '#7b2ff7' },
  { id: 'melancholy', label: 'Melancholy', desc: 'Minor, slow, spacious', color: '#6366f1' },
  { id: 'ascension', label: 'Ascension', desc: 'Auto-building energy', color: '#f43f5e' },
];

export function MoodSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {MOODS.map(({ id, label, desc, color }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`
            px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-300
            border
            ${selected === id
              ? 'border-opacity-60 bg-opacity-20 scale-105'
              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
            }
          `}
          style={selected === id ? {
            borderColor: color,
            backgroundColor: `${color}18`,
            boxShadow: `0 0 15px ${color}25`,
          } : {}}
        >
          <div className="font-medium" style={selected === id ? { color } : { color: 'white' }}>
            {label}
          </div>
          <div className="text-[9px] text-white/30 mt-0.5">{desc}</div>
        </button>
      ))}
    </div>
  );
}
