// Euclidean rhythm generator
// Distributes k pulses as evenly as possible across n steps
export function euclidean(steps: number, pulses: number): boolean[] {
  if (pulses >= steps) return Array(steps).fill(true);
  if (pulses <= 0) return Array(steps).fill(false);

  // Bjorklund's algorithm
  let pattern: number[][] = [];
  let remainder: number[][] = [];

  for (let i = 0; i < pulses; i++) pattern.push([1]);
  for (let i = 0; i < steps - pulses; i++) remainder.push([0]);

  while (remainder.length > 1) {
    const newPattern: number[][] = [];
    const minLen = Math.min(pattern.length, remainder.length);

    for (let i = 0; i < minLen; i++) {
      newPattern.push([...pattern[i], ...remainder[i]]);
    }

    const leftoverPattern = pattern.slice(minLen);
    const leftoverRemainder = remainder.slice(minLen);

    pattern = newPattern;
    remainder = leftoverPattern.length > 0 ? leftoverPattern : leftoverRemainder;
  }

  if (remainder.length > 0) {
    pattern.push(...remainder);
  }

  return pattern.flat().map(v => v === 1);
}

// Common Euclidean patterns for electronic music
export const EUCLIDEAN_PRESETS = {
  'hat-8-3': euclidean(8, 3),    // Classic offbeat hats
  'hat-8-5': euclidean(8, 5),    // Busier hat pattern
  'hat-16-7': euclidean(16, 7),  // Complex 16th hat
  'hat-16-9': euclidean(16, 9),  // Dense hat
  'clap-8-2': euclidean(8, 2),   // Simple clap
  'clap-16-3': euclidean(16, 3), // Syncopated clap
  'rim-16-5': euclidean(16, 5),  // Rim pattern
} as const;
