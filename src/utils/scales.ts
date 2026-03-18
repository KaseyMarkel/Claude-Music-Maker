import type { ScaleType } from '../types';

// Intervals from root in semitones
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  'natural-minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'phrygian-dominant': [0, 1, 4, 5, 7, 8, 10],
  'major': [0, 2, 4, 5, 7, 9, 11],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const [, name, octStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(name);
  const octave = parseInt(octStr);
  return noteIndex + (octave + 1) * 12;
}

export function midiToNote(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function getScaleNotes(root: string, scale: ScaleType, octave: number, numOctaves: number = 2): string[] {
  const rootMidi = noteToMidi(`${root}${octave}`);
  const intervals = SCALE_INTERVALS[scale];
  const notes: string[] = [];
  for (let oct = 0; oct < numOctaves; oct++) {
    for (const interval of intervals) {
      notes.push(midiToNote(rootMidi + interval + oct * 12));
    }
  }
  return notes;
}

export function getScaleDegreeNote(root: string, scale: ScaleType, degree: number, octave: number): string {
  const intervals = SCALE_INTERVALS[scale];
  const rootMidi = noteToMidi(`${root}${octave}`);
  const octaveOffset = Math.floor(degree / intervals.length);
  const degreeIndex = ((degree % intervals.length) + intervals.length) % intervals.length;
  return midiToNote(rootMidi + intervals[degreeIndex] + octaveOffset * 12);
}

// Build a chord from scale degrees (0-indexed)
// Returns array of note names with octaves
export function buildChord(
  root: string,
  scale: ScaleType,
  chordRoot: number, // scale degree 0-6
  octave: number,
  extensions: number[] = [0, 2, 4] // triad by default (root, 3rd, 5th in scale degrees)
): string[] {
  return extensions.map(ext => {
    const degree = chordRoot + ext;
    return getScaleDegreeNote(root, scale, degree, octave);
  });
}

// Voice a chord across a range for rich pad sounds
export function voiceChord(
  root: string,
  scale: ScaleType,
  chordRoot: number,
  complexity: number // 0-1, controls extensions
): string[] {
  const baseOctave = 3;
  const extensions = [0, 2, 4]; // triad

  if (complexity > 0.4) extensions.push(6); // 7th
  if (complexity > 0.7) extensions.push(1); // 9th (add2)

  const notes = buildChord(root, scale, chordRoot, baseOctave, extensions);

  // Add bass note an octave below
  const bassNote = getScaleDegreeNote(root, scale, chordRoot, baseOctave - 1);

  // Spread voicing: move some notes up an octave for width
  const voiced = [bassNote];
  notes.forEach((note, i) => {
    if (i >= 2) {
      // Move upper notes up an octave
      const midi = noteToMidi(note);
      voiced.push(midiToNote(midi + 12));
    } else {
      voiced.push(note);
    }
  });

  return voiced;
}

// Get notes that belong to a chord for arpeggio use
export function getChordTones(
  root: string,
  scale: ScaleType,
  chordRoot: number,
  octave: number,
  numOctaves: number = 2
): string[] {
  const tones: string[] = [];
  const extensions = [0, 2, 4]; // triad tones
  for (let oct = 0; oct < numOctaves; oct++) {
    for (const ext of extensions) {
      tones.push(getScaleDegreeNote(root, scale, chordRoot + ext, octave + oct));
    }
  }
  return tones;
}

export function isNoteInScale(note: string, root: string, scale: ScaleType): boolean {
  const intervals = SCALE_INTERVALS[scale];
  const rootMidi = noteToMidi(`${root}0`) % 12;
  const noteMidi = noteToMidi(note) % 12;
  const interval = ((noteMidi - rootMidi) % 12 + 12) % 12;
  return intervals.includes(interval);
}
