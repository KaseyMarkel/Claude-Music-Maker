export type MoodType = 'euphoria' | 'deep' | 'psychedelic' | 'melancholy' | 'ascension';

export type ScaleType = 'natural-minor' | 'harmonic-minor' | 'phrygian-dominant' | 'major';

export type ArpPattern = 'up' | 'down' | 'up-down' | 'random' | 'euclidean';

export type ArpRate = '8n' | '16n' | '32n' | '8t' | '16t';

export type LayerName = 'pad' | 'arpeggio' | 'bass' | 'rhythm' | 'texture' | 'lead';

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

export interface Snapshot {
  energy: number;
  harmonicComplexity: number;
  tempo: number;
  mood: MoodType;
  layers: Record<LayerName, LayerState>;
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

  // Layers
  layers: Record<LayerName, LayerState>;

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
  setLayerEnabled: (layer: LayerName, enabled: boolean) => void;
  setLayerVolume: (layer: LayerName, volume: number) => void;
  setAdvanced: (settings: Partial<AdvancedSettings>) => void;
  setShowAdvanced: (show: boolean) => void;
  setHasStarted: (started: boolean) => void;
  getSnapshot: () => Snapshot;
  loadSnapshot: (snapshot: Snapshot) => void;
}
