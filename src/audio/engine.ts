import * as Tone from 'tone';
import { AudioAnalyzer } from './analyzer';
import { AudioRecorder } from './recorder';
import {
  createHarmonicState,
  getCurrentChordDegree,
  advanceBar,
  applyModulation,
  getMoodDefaults,
  type HarmonicState,
} from './harmony';
import {
  createGenerativeState,
  tickBar,
  type GenerativeState,
} from './generative';
import { voiceChord, getChordTones, getScaleNotes, getScaleDegreeNote } from '../utils/scales';
import { createGridAudio, GRID_CELLS } from './grid-instruments';
import type { MoodType, ScaleType, ArpPattern, ArpRate, GridAudioNode, VisualizerMod } from '../types';

export class AudioEngine {
  // Grid instruments (replaces individual layers)
  private gridNodes: Map<string, GridAudioNode> = new Map();

  // Analysis & Recording
  analyzer: AudioAnalyzer | null = null;
  recorder: AudioRecorder;

  // State
  private harmonicState: HarmonicState;
  private generativeState: GenerativeState;
  private barCallback: number | null = null;
  private isStarted = false;
  private masterGain: Tone.Gain | null = null;

  // Current params
  private energy = 0.5;
  private harmonicComplexity = 0.3;
  private currentMood: MoodType = 'deep';
  private visualizerMod: VisualizerMod = { filterMod: 0, reverbMod: 0, energyMod: 0 };

  constructor() {
    this.harmonicState = createHarmonicState('deep');
    this.generativeState = createGenerativeState(false);
    this.recorder = new AudioRecorder();
  }

  async init() {
    await Tone.start();

    this.masterGain = new Tone.Gain(0.8).toDestination();
    this.analyzer = new AudioAnalyzer();
    this.analyzer.connect(this.masterGain);

    // Set initial tempo
    Tone.getTransport().bpm.value = 128;

    this.isStarted = true;
  }

  start() {
    if (!this.isStarted) return;

    const transport = Tone.getTransport();

    // Update harmony and trigger layers on bar boundaries
    this.barCallback = transport.scheduleRepeat((time) => {
      this.onBar(time);
    }, '1m');

    // Trigger initial chord
    this.triggerChord(Tone.now());

    // Start all enabled grid instruments
    for (const [, node] of this.gridNodes) {
      node.start();
    }

    transport.start();
  }

  stop() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;

    if (this.barCallback !== null) {
      transport.clear(this.barCallback);
      this.barCallback = null;
    }

    for (const [, node] of this.gridNodes) {
      node.stop();
    }
  }

  private onBar(time: Tone.Unit.Time) {
    // Advance generative state
    this.generativeState = tickBar(this.generativeState, this.energy);

    // Advance harmony
    this.harmonicState = advanceBar(this.harmonicState, this.harmonicComplexity);

    // Check for modulation
    if (this.harmonicState.modulationPending) {
      this.harmonicState = applyModulation(this.harmonicState);
    }

    // Trigger new chord if on chord boundary
    if (this.harmonicState.barCount % this.harmonicState.barsPerChord === 0) {
      this.triggerChord(time);
    }

    // Apply energy and complexity to all layers
    this.applyEnergy();
    this.applyComplexity();
  }

  private triggerChord(_time: Tone.Unit.Time) {
    const { root, scale } = this.harmonicState;
    const degree = getCurrentChordDegree(this.harmonicState);
    const complexity = this.harmonicComplexity;

    // Compute chord/scale/root info
    const chordNotes = voiceChord(root, scale, degree, complexity);
    const chordTones = getChordTones(root, scale, degree, 4, 2);
    const scaleNotesArr = getScaleNotes(root, scale, 4, 2);
    const rootNote = getScaleDegreeNote(root, scale, degree, 2);

    // Send to all active grid instruments based on category
    for (const [id, node] of this.gridNodes) {
      const config = GRID_CELLS.find(c => c.id === id);
      if (!config) continue;

      switch (config.category) {
        case 'pad':
          node.setChord?.(chordNotes);
          break;
        case 'arp':
          node.setScale?.(chordTones);
          break;
        case 'bass':
          node.setRoot?.(rootNote);
          break;
        case 'melodic':
          node.setScale?.(scaleNotesArr);
          break;
        // rhythm and texture don't need harmonic info
      }
    }
  }

  private applyEnergy() {
    const baseEnergy = this.currentMood === 'ascension' ? this.generativeState.energy : this.energy;
    const e = Math.max(0, Math.min(1, baseEnergy + this.visualizerMod.energyMod));
    for (const [, node] of this.gridNodes) {
      node.setEnergy(e);
    }
  }

  private applyComplexity() {
    const c = this.harmonicComplexity;
    for (const [, node] of this.gridNodes) {
      node.setComplexity(c);
    }
  }

  // --- Public API ---

  setEnergy(value: number) {
    this.energy = value / 100;
    this.applyEnergy();
  }

  setHarmonicComplexity(value: number) {
    this.harmonicComplexity = value / 100;
    this.applyComplexity();
  }

  setVisualizerMod(mod: VisualizerMod) {
    this.visualizerMod = mod;
    this.applyEnergy();
  }

  setTempo(bpm: number) {
    Tone.getTransport().bpm.rampTo(bpm, 2);
  }

  setMood(mood: MoodType) {
    this.currentMood = mood;
    const defaults = getMoodDefaults(mood);

    this.harmonicState = createHarmonicState(
      mood,
      this.harmonicState.scale !== defaults.scale ? undefined : this.harmonicState.scale,
      undefined,
      undefined
    );

    if (mood === 'ascension') {
      this.generativeState = createGenerativeState(true);
    } else {
      this.generativeState = createGenerativeState(false);
    }

    if (Tone.getTransport().state === 'started') {
      this.triggerChord(Tone.now());
    }
  }

  // Grid instrument management
  setGridCellEnabled(id: string, enabled: boolean) {
    if (!this.masterGain) return;

    if (enabled) {
      if (!this.gridNodes.has(id)) {
        const node = createGridAudio(id, this.masterGain);
        if (node) {
          this.gridNodes.set(id, node);
          node.setEnergy(this.energy);
          node.setComplexity(this.harmonicComplexity);
          if (Tone.getTransport().state === 'started') {
            // Send current chord info
            this.triggerChordForNode(id, node);
            node.start();
          }
        }
      }
    } else {
      const node = this.gridNodes.get(id);
      if (node) {
        node.stop();
        node.dispose();
        this.gridNodes.delete(id);
      }
    }
  }

  private triggerChordForNode(id: string, node: GridAudioNode) {
    const config = GRID_CELLS.find(c => c.id === id);
    if (!config) return;
    const { root, scale } = this.harmonicState;
    const degree = getCurrentChordDegree(this.harmonicState);

    switch (config.category) {
      case 'pad':
        node.setChord?.(voiceChord(root, scale, degree, this.harmonicComplexity));
        break;
      case 'arp':
        node.setScale?.(getChordTones(root, scale, degree, 4, 2));
        break;
      case 'bass':
        node.setRoot?.(getScaleDegreeNote(root, scale, degree, 2));
        break;
      case 'melodic':
        node.setScale?.(getScaleNotes(root, scale, 4, 2));
        break;
    }
  }

  setGridCellVolume(id: string, volume: number) {
    const node = this.gridNodes.get(id);
    if (node) node.setVolume(volume);
  }

  // Advanced settings
  setArpRate(_rate: ArpRate) {
    // Applied globally to arp instruments via complexity
  }

  setArpPattern(_pattern: ArpPattern) {
    // Applied via grid cell selection
  }

  setReverbAmount(_amount: number) {
    // Applied via grid cell selection
  }

  setDelayFeedback(_feedback: number) {
    // Applied via grid cell selection
  }

  setDelayTime(_time: string) {}

  setScale(scale: ScaleType) {
    this.harmonicState = { ...this.harmonicState, scale };
    if (Tone.getTransport().state === 'started') {
      this.triggerChord(Tone.now());
    }
  }

  setRootNote(root: string) {
    this.harmonicState = { ...this.harmonicState, root };
    if (Tone.getTransport().state === 'started') {
      this.triggerChord(Tone.now());
    }
  }

  setProgression(prog: string) {
    this.harmonicState = createHarmonicState(
      this.currentMood,
      this.harmonicState.scale,
      this.harmonicState.root,
      prog
    );
  }

  // Recording
  async startRecording() {
    await this.recorder.start();
  }

  async stopRecording(): Promise<Blob> {
    return this.recorder.stop();
  }

  getAnalyzer(): AudioAnalyzer | null {
    return this.analyzer;
  }

  dispose() {
    this.stop();
    for (const [, node] of this.gridNodes) {
      node.dispose();
    }
    this.gridNodes.clear();
    this.analyzer?.dispose();
    this.masterGain?.dispose();
  }
}

// Singleton
let engineInstance: AudioEngine | null = null;

export function getEngine(): AudioEngine {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
}
