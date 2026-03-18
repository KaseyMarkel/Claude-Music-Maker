import * as Tone from 'tone';
import { PadLayer } from './layers/pad';
import { ArpeggioLayer } from './layers/arpeggio';
import { BassLayer } from './layers/bass';
import { RhythmLayer } from './layers/rhythm';
import { TextureLayer } from './layers/texture';
import { LeadLayer } from './layers/lead';
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
import type { MoodType, ScaleType, ArpPattern, ArpRate, LayerName } from '../types';

export class AudioEngine {
  // Layers
  pad: PadLayer | null = null;
  arpeggio: ArpeggioLayer | null = null;
  bass: BassLayer | null = null;
  rhythm: RhythmLayer | null = null;
  texture: TextureLayer | null = null;
  lead: LeadLayer | null = null;

  // Analysis & Recording
  analyzer: AudioAnalyzer | null = null;
  recorder: AudioRecorder;

  // State
  private harmonicState: HarmonicState;
  private generativeState: GenerativeState;
  private barCallback: number | null = null;
  private isStarted = false;
  private masterGain: Tone.Gain | null = null;

  // Layer enabled states
  private layerEnabled: Record<LayerName, boolean> = {
    pad: true,
    arpeggio: true,
    bass: true,
    rhythm: true,
    texture: true,
    lead: false,
  };

  // Current params
  private energy = 0.5;
  private harmonicComplexity = 0.3;
  private currentMood: MoodType = 'deep';

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

    // Create layers
    this.pad = new PadLayer(this.masterGain);
    this.arpeggio = new ArpeggioLayer(this.masterGain);
    this.bass = new BassLayer(this.masterGain);
    this.rhythm = new RhythmLayer(this.masterGain);
    this.texture = new TextureLayer(this.masterGain);
    this.lead = new LeadLayer(this.masterGain);

    // Wire sidechain: kick triggers bass ducking
    this.rhythm.onKickTrigger = (time) => {
      this.bass?.triggerSidechain(time);
    };

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

    // Start enabled layers
    if (this.layerEnabled.arpeggio) this.arpeggio?.start();
    if (this.layerEnabled.bass) this.bass?.start();
    if (this.layerEnabled.rhythm) this.rhythm?.start();
    if (this.layerEnabled.texture) this.texture?.start();
    if (this.layerEnabled.lead) this.lead?.start();

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

    this.pad?.releaseAll();
    this.arpeggio?.stop();
    this.bass?.stop();
    this.rhythm?.stop();
    this.texture?.stop();
    this.lead?.stop();
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

    // Apply energy to all layers
    this.applyEnergy();
  }

  private triggerChord(time: Tone.Unit.Time) {
    const { root, scale } = this.harmonicState;
    const degree = getCurrentChordDegree(this.harmonicState);
    const complexity = this.harmonicComplexity;

    // Pad: full voiced chord
    if (this.layerEnabled.pad) {
      const padNotes = voiceChord(root, scale, degree, complexity);
      this.pad?.playChord(padNotes, time);
    }

    // Arpeggio: chord tones across 2 octaves
    if (this.layerEnabled.arpeggio) {
      const arpNotes = getChordTones(root, scale, degree, 4, 2);
      this.arpeggio?.setNotes(arpNotes);
    }

    // Bass: root note
    if (this.layerEnabled.bass) {
      const bassNote = getScaleDegreeNote(root, scale, degree, 2);
      this.bass?.setRoot(bassNote);
    }

    // Lead: scale notes for melody generation
    if (this.layerEnabled.lead) {
      const scaleNotes = getScaleNotes(root, scale, 4, 2);
      this.lead?.setScaleNotes(scaleNotes);
    }
  }

  private applyEnergy() {
    const e = this.currentMood === 'ascension' ? this.generativeState.energy : this.energy;

    this.pad?.setEnergy(e);
    this.arpeggio?.setEnergy(e);
    this.bass?.setEnergy(e);
    this.rhythm?.setEnergy(e);
    this.texture?.setEnergy(e);
    this.lead?.setEnergy(e);
  }

  // --- Public API for controls ---

  setEnergy(value: number) {
    this.energy = value / 100; // Convert 0-100 to 0-1
    this.applyEnergy();
  }

  setHarmonicComplexity(value: number) {
    this.harmonicComplexity = value / 100;
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

    // Re-trigger chord with new harmony
    if (Tone.getTransport().state === 'started') {
      this.triggerChord(Tone.now());
    }
  }

  setLayerEnabled(layer: LayerName, enabled: boolean) {
    this.layerEnabled[layer] = enabled;

    if (Tone.getTransport().state !== 'started') return;

    switch (layer) {
      case 'pad':
        if (enabled) this.triggerChord(Tone.now());
        else this.pad?.releaseAll();
        break;
      case 'arpeggio':
        if (enabled) { this.triggerChord(Tone.now()); this.arpeggio?.start(); }
        else this.arpeggio?.stop();
        break;
      case 'bass':
        if (enabled) { this.triggerChord(Tone.now()); this.bass?.start(); }
        else this.bass?.stop();
        break;
      case 'rhythm':
        if (enabled) this.rhythm?.start();
        else this.rhythm?.stop();
        break;
      case 'texture':
        if (enabled) this.texture?.start();
        else this.texture?.stop();
        break;
      case 'lead':
        if (enabled) { this.triggerChord(Tone.now()); this.lead?.start(); }
        else this.lead?.stop();
        break;
    }
  }

  setLayerVolume(layer: LayerName, volume: number) {
    switch (layer) {
      case 'pad': this.pad?.setVolume(volume); break;
      case 'arpeggio': this.arpeggio?.setVolume(volume); break;
      case 'bass': this.bass?.setVolume(volume); break;
      case 'rhythm': this.rhythm?.setVolume(volume); break;
      case 'texture': this.texture?.setVolume(volume); break;
      case 'lead': this.lead?.setVolume(volume); break;
    }
  }

  setArpRate(rate: ArpRate) {
    this.arpeggio?.setRate(rate);
  }

  setArpPattern(pattern: ArpPattern) {
    this.arpeggio?.setPattern(pattern);
  }

  setReverbAmount(amount: number) {
    this.pad?.setReverbWet(amount);
  }

  setDelayFeedback(feedback: number) {
    this.arpeggio?.setDelayFeedback(feedback);
  }

  setDelayTime(time: string) {
    this.arpeggio?.setDelayTime(time);
  }

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
    this.pad?.dispose();
    this.arpeggio?.dispose();
    this.bass?.dispose();
    this.rhythm?.dispose();
    this.texture?.dispose();
    this.lead?.dispose();
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
