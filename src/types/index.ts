export type MoodType = 'euphoria' | 'deep' | 'psychedelic' | 'melancholy' | 'ascension';

export type ScaleType = 'natural-minor' | 'harmonic-minor' | 'phrygian-dominant' | 'major';

export type ArpPattern = 'up' | 'down' | 'up-down' | 'random' | 'euclidean';

export type ArpRate = '8n' | '16n' | '32n' | '8t' | '16t';

export type LayerName = 'pad' | 'arpeggio' | 'bass' | 'rhythm' | 'texture' | 'lead';

export type GridCategory = 'pad' | 'arp' | 'bass' | 'rhythm' | 'texture' | 'melodic';

export interface GridCellConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  row: number;
  col: number;
  category: GridCategory;
}

export interface GridCellState {
  enabled: boolean;
  volume: number; // 0-1
}

export interface GridAudioNode {
  start(): void;
  stop(): void;
  setEnergy(e: number): void;
  setComplexity(c: number): void;
  setVolume(v: number): void;
  setChord?(notes: string[]): void;
  setScale?(notes: string[]): void;
  setRoot?(note: string): void;
  dispose(): void;
}

export interface LayerState {
  enabled: boolean;
  volume: number; // 0-1
}

export interface AdvancedSettings {
  arpRate: ArpRate;
  arpPattern: ArpPattern;
  reverb: number; // 0-1
  delayFeedback: number; // 0-1
  delayTime: string; // Tone.js time value
  scale: ScaleType;
  rootNote: string;
  progressionMode: 'generative' | 'i-VI-III-VII' | 'i-iv-VI-V' | 'i-III-VII-IV';
}

export interface VisualizerMod {
  filterMod: number;  // -1 to 1
  reverbMod: number;  // 0 to 1
  energyMod: number;  // -0.3 to 0.3
}

export interface Snapshot {
  energy: number;
  harmonicComplexity: number;
  tempo: number;
  mood: MoodType;
  grid: Record<string, GridCellState>;
  advanced: AdvancedSettings;
  timestamp: number;
}

export interface AppState {
  // Transport
  isPlaying: boolean;
  isRecording: boolean;
  recordingTime: number;

  // Primary controls
  energy: number; // 0-100
  harmonicComplexity: number; // 0-100
  tempo: number; // 80-160
  mood: MoodType;

  // Grid (replaces layers)
  grid: Record<string, GridCellState>;

  // Advanced
  advanced: AdvancedSettings;

  // UI
  showAdvanced: boolean;
  hasStarted: boolean;

  // Actions
  setPlaying: (playing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setRecordingTime: (time: number) => void;
  setEnergy: (energy: number) => void;
  setHarmonicComplexity: (complexity: number) => void;
  setTempo: (tempo: number) => void;
  setMood: (mood: MoodType) => void;
  setGridCellEnabled: (id: string, enabled: boolean) => void;
  setGridCellVolume: (id: string, volume: number) => void;
  setAdvanced: (settings: Partial<AdvancedSettings>) => void;
  setShowAdvanced: (show: boolean) => void;
  setHasStarted: (started: boolean) => void;
  getSnapshot: () => Snapshot;
  loadSnapshot: (snapshot: Snapshot) => void;
}
