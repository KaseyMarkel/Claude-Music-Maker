import { create } from 'zustand';
import type { AppState, LayerName, MoodType, Snapshot, AdvancedSettings } from '../types';

export const useStore = create<AppState>((set, get) => ({
  // Transport
  isPlaying: false,
  isRecording: false,
  recordingTime: 0,

  // Primary controls
  energy: 50,
  harmonicComplexity: 30,
  tempo: 128,
  mood: 'deep' as MoodType,

  // Layers
  layers: {
    pad: { enabled: true, volume: 0.8 },
    arpeggio: { enabled: true, volume: 0.7 },
    bass: { enabled: true, volume: 0.75 },
    rhythm: { enabled: true, volume: 0.7 },
    texture: { enabled: true, volume: 0.5 },
    lead: { enabled: false, volume: 0.5 },
  },

  // Advanced
  advanced: {
    arpRate: '16n',
    arpPattern: 'up',
    reverb: 0.5,
    delayFeedback: 0.3,
    delayTime: '8n.',
    scale: 'natural-minor',
    rootNote: 'A',
    progressionMode: 'generative',
  },

  // UI
  showAdvanced: false,
  hasStarted: false,

  // Actions
  setPlaying: (playing) => set({ isPlaying: playing }),
  setRecording: (recording) => set({ isRecording: recording }),
  setRecordingTime: (time) => set({ recordingTime: time }),
  setEnergy: (energy) => set({ energy }),
  setHarmonicComplexity: (complexity) => set({ harmonicComplexity: complexity }),
  setTempo: (tempo) => set({ tempo }),
  setMood: (mood) => set({ mood }),
  setLayerEnabled: (layer: LayerName, enabled: boolean) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: { ...state.layers[layer], enabled },
      },
    })),
  setLayerVolume: (layer: LayerName, volume: number) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: { ...state.layers[layer], volume },
      },
    })),
  setAdvanced: (settings: Partial<AdvancedSettings>) =>
    set((state) => ({
      advanced: { ...state.advanced, ...settings },
    })),
  setShowAdvanced: (show) => set({ showAdvanced: show }),
  setHasStarted: (started) => set({ hasStarted: started }),

  getSnapshot: (): Snapshot => {
    const state = get();
    return {
      energy: state.energy,
      harmonicComplexity: state.harmonicComplexity,
      tempo: state.tempo,
      mood: state.mood,
      layers: JSON.parse(JSON.stringify(state.layers)),
      advanced: { ...state.advanced },
      timestamp: Date.now(),
    };
  },

  loadSnapshot: (snapshot: Snapshot) => {
    set({
      energy: snapshot.energy,
      harmonicComplexity: snapshot.harmonicComplexity,
      tempo: snapshot.tempo,
      mood: snapshot.mood,
      layers: snapshot.layers,
      advanced: snapshot.advanced,
    });
  },
}));
