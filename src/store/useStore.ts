import { create } from 'zustand';
import type { AppState, MoodType, Snapshot, AdvancedSettings } from '../types';
import { getDefaultGridState } from '../audio/grid-instruments';

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

  // Grid
  grid: getDefaultGridState(),

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
  setGridCellEnabled: (id: string, enabled: boolean) =>
    set((state) => ({
      grid: {
        ...state.grid,
        [id]: { ...state.grid[id], enabled },
      },
    })),
  setGridCellVolume: (id: string, volume: number) =>
    set((state) => ({
      grid: {
        ...state.grid,
        [id]: { ...state.grid[id], volume },
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
      grid: JSON.parse(JSON.stringify(state.grid)),
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
      grid: snapshot.grid,
      advanced: snapshot.advanced,
    });
  },
}));
