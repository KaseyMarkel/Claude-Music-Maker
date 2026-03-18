import { useRef, useCallback, useEffect, useState } from 'react';

interface Props {
  value: number;       // 0-1
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  label?: string;
}

export function Knob({ value, onChange, size = 48, color = '#00f0ff', label }: Props) {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = displayValue;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [displayValue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dy = startY.current - e.clientY;
    const sensitivity = 200;
    const newValue = Math.max(0, Math.min(1, startValue.current + dy / sensitivity));
    setDisplayValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // SVG arc for value indicator
  const radius = (size - 8) / 2;
  const circumference = radius * Math.PI * 1.5; // 270 degrees
  const offset = circumference * (1 - displayValue);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1" ref={knobRef}>
      <div
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={3}
            strokeDasharray={`${circumference} ${circumference * 0.33}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
          />
          {/* Value arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeDasharray={`${circumference} ${circumference * 0.33}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(135 ${center} ${center})`}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)`, transition: 'stroke-dashoffset 0.05s' }}
          />
          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={3}
            fill={color}
            opacity={0.6}
          />
        </svg>
      </div>
      {label && (
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}
