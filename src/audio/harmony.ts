import type { ScaleType, MoodType } from '../types';

export interface ChordInfo {
  degree: number;       // Scale degree (0-6)
  notes: string[];      // Actual note names
  duration: number;     // In bars
}

export interface HarmonicState {
  root: string;
  scale: ScaleType;
  currentChordIndex: number;
  progression: number[];
  barCount: number;
  barsPerChord: number;
  modulationPending: boolean;
}

// Classic trance/euphoric progressions (scale degrees, 0-indexed)
const PROGRESSIONS: Record<string, number[]> = {
  'i-VI-III-VII': [0, 5, 2, 6],     // Am - F - C - G (natural minor classic)
  'i-iv-VI-V': [0, 3, 5, 4],        // Am - Dm - F - E (with V for trance feel)
  'i-III-VII-IV': [0, 2, 6, 3],     // Am - C - G - Dm
  'i-VII-VI-VII': [0, 6, 5, 6],     // Am - G - F - G (driving)
  'i-VI-VII-III': [0, 5, 6, 2],     // Am - F - G - C (uplifting)
};

const MOOD_DEFAULTS: Record<MoodType, { scale: ScaleType; progressions: string[]; root: string }> = {
  euphoria: {
    scale: 'major',
    progressions: ['i-VI-III-VII', 'i-VI-VII-III'],
    root: 'C',
  },
  deep: {
    scale: 'natural-minor',
    progressions: ['i-iv-VI-V', 'i-VII-VI-VII'],
    root: 'A',
  },
  psychedelic: {
    scale: 'phrygian-dominant',
    progressions: ['i-iv-VI-V', 'i-III-VII-IV'],
    root: 'E',
  },
  melancholy: {
    scale: 'natural-minor',
    progressions: ['i-VI-III-VII', 'i-III-VII-IV'],
    root: 'D',
  },
  ascension: {
    scale: 'natural-minor',
    progressions: ['i-iv-VI-V', 'i-VI-VII-III'],
    root: 'A',
  },
};

export function createHarmonicState(mood: MoodType, overrideScale?: ScaleType, overrideRoot?: string, overrideProgression?: string): HarmonicState {
  const defaults = MOOD_DEFAULTS[mood];
  const progressionKey = overrideProgression && overrideProgression !== 'generative'
    ? overrideProgression
    : defaults.progressions[Math.floor(Math.random() * defaults.progressions.length)];

  return {
    root: overrideRoot || defaults.root,
    scale: overrideScale || defaults.scale,
    currentChordIndex: 0,
    progression: PROGRESSIONS[progressionKey] || PROGRESSIONS['i-VI-III-VII'],
    barCount: 0,
    barsPerChord: 4,
    modulationPending: false,
  };
}

export function getCurrentChordDegree(state: HarmonicState): number {
  return state.progression[state.currentChordIndex % state.progression.length];
}

export function advanceBar(state: HarmonicState, complexity: number): HarmonicState {
  const newState = { ...state, barCount: state.barCount + 1 };

  if (newState.barCount % newState.barsPerChord === 0) {
    // Time for chord change
    const expectedNext = (state.currentChordIndex + 1) % state.progression.length;

    // Probability of surprise chord based on complexity
    if (complexity > 0.6 && Math.random() < complexity * 0.3) {
      // Surprise substitution - pick a random degree
      const surpriseDegrees = [0, 1, 2, 3, 4, 5, 6].filter(
        d => d !== state.progression[state.currentChordIndex]
      );
      const surpriseDegree = surpriseDegrees[Math.floor(Math.random() * surpriseDegrees.length)];
      newState.progression = [...state.progression];
      newState.progression[expectedNext] = surpriseDegree;
    }

    newState.currentChordIndex = expectedNext;

    // Check for modulation (key change up) - classic trance move
    if (complexity > 0.7 && state.barCount > 0 && state.barCount % 32 === 0) {
      if (Math.random() < 0.3) {
        newState.modulationPending = true;
      }
    }
  }

  return newState;
}

export function applyModulation(state: HarmonicState): HarmonicState {
  if (!state.modulationPending) return state;

  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const currentIndex = noteOrder.indexOf(state.root);
  // Modulate up a semitone or whole tone
  const step = Math.random() < 0.6 ? 1 : 2;
  const newRoot = noteOrder[(currentIndex + step) % 12];

  return {
    ...state,
    root: newRoot,
    modulationPending: false,
  };
}

export function getMoodDefaults(mood: MoodType) {
  return MOOD_DEFAULTS[mood];
}

export function getAvailableProgressions(): string[] {
  return Object.keys(PROGRESSIONS);
}
