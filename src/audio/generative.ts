// Generative logic: energy curves, phrase structure, and variation

export interface GenerativeState {
  energy: number;         // 0-1 current auto-energy
  targetEnergy: number;   // 0-1 where energy is heading
  phraseBar: number;      // Current bar within phrase (0-7)
  phraseCount: number;    // How many phrases have played
  isBuilding: boolean;    // Are we in a build section?
  isDropped: boolean;     // Are we in a drop/climax?
  autoMode: boolean;      // Is ascension mode auto-controlling energy?
}

export function createGenerativeState(autoMode: boolean = false): GenerativeState {
  return {
    energy: 0.3,
    targetEnergy: 0.3,
    phraseBar: 0,
    phraseCount: 0,
    isBuilding: false,
    isDropped: false,
    autoMode,
  };
}

export function tickBar(state: GenerativeState, userEnergy: number): GenerativeState {
  const next = { ...state };
  next.phraseBar = (state.phraseBar + 1) % 8;

  // New phrase
  if (next.phraseBar === 0) {
    next.phraseCount++;
  }

  if (state.autoMode) {
    // Ascension mode: auto-build over time
    const cycle = state.phraseCount % 16; // 16-phrase cycle (128 bars)

    if (cycle < 8) {
      // Building phase
      next.targetEnergy = Math.min(1, 0.2 + (cycle / 8) * 0.6);
      next.isBuilding = true;
      next.isDropped = false;
    } else if (cycle < 10) {
      // Breakdown
      next.targetEnergy = 0.15;
      next.isBuilding = false;
      next.isDropped = false;
    } else if (cycle === 10) {
      // Drop!
      next.targetEnergy = 1.0;
      next.isBuilding = false;
      next.isDropped = true;
    } else if (cycle < 14) {
      // Sustain peak
      next.targetEnergy = 0.85 + Math.random() * 0.15;
      next.isDropped = true;
    } else {
      // Wind down
      next.targetEnergy = Math.max(0.2, 1.0 - ((cycle - 13) / 3) * 0.6);
      next.isDropped = false;
    }

    // Smooth energy toward target
    next.energy = state.energy + (next.targetEnergy - state.energy) * 0.15;
  } else {
    // Manual mode: use user energy directly with slight smoothing
    next.energy = state.energy + (userEnergy - state.energy) * 0.2;
  }

  return next;
}

// Determines if this bar should have a fill/variation
export function shouldFill(state: GenerativeState): boolean {
  // Fills on bar 4 and 8 of phrase
  return state.phraseBar === 3 || state.phraseBar === 7;
}

// Determines intensity for filter sweeps on phrase boundaries
export function getPhraseSweep(state: GenerativeState): number {
  // Build tension over phrase, release at end
  if (state.phraseBar < 4) {
    return state.phraseBar / 4; // 0 to 1 over first half
  }
  if (state.phraseBar < 7) {
    return 1 - ((state.phraseBar - 4) / 3) * 0.3; // Slight dip
  }
  return 0.5; // Reset before new phrase
}
