import * as Tone from 'tone';
import { euclidean } from '../utils/euclidean';
import type { GridCellConfig, GridAudioNode } from '../types';

// ============================================================
// GRID CELL CONFIGURATIONS (6x6 = 36 instruments)
// ============================================================

const ROW_COLORS: Record<string, string> = {
  pad: '#7b2ff7',
  arp: '#00f0ff',
  bass: '#ff9f1c',
  rhythm: '#f43f5e',
  texture: '#6366f1',
  melodic: '#10b981',
};

export const GRID_CELLS: GridCellConfig[] = [
  // Row 0: Pads
  { id: 'warm-pad', name: 'Warm', icon: '◈', color: ROW_COLORS.pad, row: 0, col: 0, category: 'pad' },
  { id: 'ice-pad', name: 'Ice', icon: '❄', color: '#a78bfa', row: 0, col: 1, category: 'pad' },
  { id: 'choir-pad', name: 'Choir', icon: '♫', color: '#c084fc', row: 0, col: 2, category: 'pad' },
  { id: 'shimmer-pad', name: 'Shimmer', icon: '✧', color: '#e879f9', row: 0, col: 3, category: 'pad' },
  { id: 'dark-pad', name: 'Dark', icon: '◆', color: '#581c87', row: 0, col: 4, category: 'pad' },
  { id: 'glass-pad', name: 'Glass', icon: '◇', color: '#d8b4fe', row: 0, col: 5, category: 'pad' },

  // Row 1: Arps
  { id: 'rise-arp', name: 'Rise', icon: '↑', color: ROW_COLORS.arp, row: 1, col: 0, category: 'arp' },
  { id: 'fall-arp', name: 'Fall', icon: '↓', color: '#22d3ee', row: 1, col: 1, category: 'arp' },
  { id: 'bounce-arp', name: 'Bounce', icon: '↕', color: '#06b6d4', row: 1, col: 2, category: 'arp' },
  { id: 'scatter-arp', name: 'Scatter', icon: '✦', color: '#0891b2', row: 1, col: 3, category: 'arp' },
  { id: 'pulse-arp', name: 'Pulse', icon: '⟡', color: '#67e8f9', row: 1, col: 4, category: 'arp' },
  { id: 'trill-arp', name: 'Trill', icon: '≈', color: '#a5f3fc', row: 1, col: 5, category: 'arp' },

  // Row 2: Bass
  { id: 'sub-bass', name: 'Sub', icon: '◉', color: ROW_COLORS.bass, row: 2, col: 0, category: 'bass' },
  { id: 'acid-bass', name: 'Acid', icon: '⚡', color: '#f59e0b', row: 2, col: 1, category: 'bass' },
  { id: 'pluck-bass', name: 'Pluck', icon: '◎', color: '#d97706', row: 2, col: 2, category: 'bass' },
  { id: 'wobble-bass', name: 'Wobble', icon: '〰', color: '#b45309', row: 2, col: 3, category: 'bass' },
  { id: 'fm-bass', name: 'FM', icon: '⊕', color: '#fbbf24', row: 2, col: 4, category: 'bass' },
  { id: 'round-bass', name: 'Round', icon: '●', color: '#fcd34d', row: 2, col: 5, category: 'bass' },

  // Row 3: Rhythm
  { id: 'kick', name: 'Kick', icon: '⬤', color: ROW_COLORS.rhythm, row: 3, col: 0, category: 'rhythm' },
  { id: 'snare', name: 'Snare', icon: '◼', color: '#fb7185', row: 3, col: 1, category: 'rhythm' },
  { id: 'hihat', name: 'Hi-hat', icon: '▲', color: '#f472b6', row: 3, col: 2, category: 'rhythm' },
  { id: 'clap', name: 'Clap', icon: '✋', color: '#e11d48', row: 3, col: 3, category: 'rhythm' },
  { id: 'rim', name: 'Rim', icon: '○', color: '#fda4af', row: 3, col: 4, category: 'rhythm' },
  { id: 'shaker', name: 'Shaker', icon: '◌', color: '#fecdd3', row: 3, col: 5, category: 'rhythm' },

  // Row 4: Textures
  { id: 'noise-tex', name: 'Noise', icon: '≋', color: ROW_COLORS.texture, row: 4, col: 0, category: 'texture' },
  { id: 'wind-tex', name: 'Wind', icon: '🌊', color: '#818cf8', row: 4, col: 1, category: 'texture' },
  { id: 'sparkle-tex', name: 'Sparkle', icon: '✨', color: '#a5b4fc', row: 4, col: 2, category: 'texture' },
  { id: 'drone-tex', name: 'Drone', icon: '━', color: '#4f46e5', row: 4, col: 3, category: 'texture' },
  { id: 'riser-tex', name: 'Riser', icon: '⤴', color: '#c7d2fe', row: 4, col: 4, category: 'texture' },
  { id: 'crackle-tex', name: 'Crackle', icon: '⚬', color: '#e0e7ff', row: 4, col: 5, category: 'texture' },

  // Row 5: Melodic
  { id: 'saw-lead', name: 'Saw', icon: '◇', color: ROW_COLORS.melodic, row: 5, col: 0, category: 'melodic' },
  { id: 'bell-mel', name: 'Bell', icon: '🔔', color: '#34d399', row: 5, col: 1, category: 'melodic' },
  { id: 'pluck-mel', name: 'Pluck', icon: '♪', color: '#6ee7b7', row: 5, col: 2, category: 'melodic' },
  { id: 'keys-mel', name: 'Keys', icon: '🎹', color: '#059669', row: 5, col: 3, category: 'melodic' },
  { id: 'whistle-mel', name: 'Whistle', icon: '○', color: '#a7f3d0', row: 5, col: 4, category: 'melodic' },
  { id: 'marimba-mel', name: 'Marimba', icon: '▪', color: '#d1fae5', row: 5, col: 5, category: 'melodic' },
];

export const GRID_ROWS = ['Pads', 'Arps', 'Bass', 'Rhythm', 'Texture', 'Melodic'];

// ============================================================
// DEFAULT ENABLED CELLS
// ============================================================

export function getDefaultGridState(): Record<string, { enabled: boolean; volume: number }> {
  const state: Record<string, { enabled: boolean; volume: number }> = {};
  const defaults = ['warm-pad', 'rise-arp', 'sub-bass', 'kick', 'hihat', 'clap', 'noise-tex'];
  for (const cell of GRID_CELLS) {
    state[cell.id] = {
      enabled: defaults.includes(cell.id),
      volume: 0.7,
    };
  }
  return state;
}

// ============================================================
// AUDIO NODE FACTORIES
// ============================================================

type Dest = Tone.InputNode;

// --- PAD FACTORIES ---

function makePad(
  oscType: string,
  attack: number,
  filterFreq: number,
  reverbDecay: number,
  reverbWet: number,
  spread: number
) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.12);
    const reverb = new Tone.Reverb({ decay: reverbDecay, wet: reverbWet });
    const filter = new Tone.Filter({ frequency: filterFreq, type: 'lowpass', rolloff: -24 });
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscType as any, ...(oscType.includes('fat') ? { count: 3, spread } : {}) },
      envelope: { attack, decay: 0.5, sustain: 0.7, release: 2.5 },
      volume: -12,
    });
    synth.chain(filter, reverb, gain, dest as unknown as Tone.ToneAudioNode);
    let baseFilterFreq = filterFreq;

    return {
      start() {},
      stop() { synth.releaseAll(); },
      setChord(notes: string[]) {
        synth.releaseAll();
        if (notes.length > 0) synth.triggerAttack(notes);
      },
      setEnergy(e: number) {
        baseFilterFreq = 300 + e * 4500;
        filter.frequency.rampTo(baseFilterFreq, 0.5);
        reverb.wet.rampTo(Math.max(0.2, reverbWet - e * 0.3), 0.5);
      },
      setComplexity(c: number) {
        filter.Q.rampTo(1 + c * 4, 0.5);
      },
      setVolume(v: number) { gain.gain.rampTo(v * 0.12, 0.3); },
      dispose() { synth.dispose(); filter.dispose(); reverb.dispose(); gain.dispose(); },
    };
  };
}

// --- ARP FACTORIES ---

function makeArp(
  getPattern: (notes: string[]) => (string | null)[],
  rate: string,
  oscType: string,
  delayFb: number,
  filterBase: number
) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.1);
    const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: delayFb, wet: 0.2 });
    const filter = new Tone.Filter({ frequency: filterBase, type: 'lowpass' });
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscType as any },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
      volume: -14,
    });
    synth.chain(filter, delay, gain, dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;
    let chordNotes: string[] = [];
    let currentRate = rate;

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); seq = null; }
      const ordered = getPattern(chordNotes);
      if (ordered.length === 0) return;
      seq = new Tone.Sequence((time, note) => {
        if (note && Math.random() > 0.06) {
          synth.triggerAttackRelease(note, '32n', time, 0.4 + Math.random() * 0.4);
        }
      }, ordered, currentRate as any);
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); synth.releaseAll(); },
      setScale(notes: string[]) { chordNotes = notes; rebuild(); },
      setEnergy(e: number) { filter.frequency.rampTo(filterBase + e * 6000, 0.3); delay.feedback.rampTo(delayFb + e * 0.15, 0.3); },
      setComplexity(c: number) {
        // Higher complexity = faster rate
        if (c > 0.7) currentRate = '32n';
        else if (c > 0.4) currentRate = '16n';
        else currentRate = rate;
      },
      setVolume(v: number) { gain.gain.rampTo(v * 0.1, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); filter.dispose(); delay.dispose(); gain.dispose(); },
    };
  };
}

// --- BASS FACTORIES ---

function makeBass(
  oscType: string,
  filterFreq: number,
  patternFn: (root: string) => (string | null)[]
) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.2);
    const filter = new Tone.Filter({ frequency: filterFreq, type: 'lowpass', rolloff: -24 });
    const synth = new Tone.MonoSynth({
      oscillator: { type: oscType as any },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 },
      filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2, baseFrequency: filterFreq, octaves: 2 },
      volume: -8,
    });
    synth.chain(filter, gain, dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;
    let root = 'A2';

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); seq = null; }
      const pattern = patternFn(root);
      seq = new Tone.Sequence((time, note) => {
        if (note) synth.triggerAttackRelease(note, '8n', time, 0.7 + Math.random() * 0.2);
      }, pattern, '8n');
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); synth.triggerRelease(); },
      setRoot(note: string) { root = note; rebuild(); },
      setEnergy(e: number) { filter.frequency.rampTo(filterFreq + e * 400, 0.5); },
      setComplexity(c: number) {
        synth.filterEnvelope.octaves = 1 + c * 3;
      },
      setVolume(v: number) { gain.gain.rampTo(v * 0.2, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); filter.dispose(); gain.dispose(); },
    };
  };
}

// --- DRUM FACTORIES ---

function makeKick(pattern: number[]) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.45);
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -4,
    });
    synth.connect(gain);
    gain.connect(dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;
    let kickPattern = pattern;

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); }
      seq = new Tone.Sequence((time, active) => {
        if (active) synth.triggerAttackRelease('C1', '8n', time, 0.85);
      }, kickPattern, '16n');
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); },
      setEnergy(e: number) { gain.gain.rampTo(0.3 + e * 0.3, 0.3); },
      setComplexity(c: number) {
        // Add ghost kicks at high complexity
        if (c > 0.6) {
          kickPattern = [1, 0, 0, c > 0.8 ? 1 : 0, 1, 0, 0, 0, 1, 0, c > 0.7 ? 1 : 0, 0, 1, 0, 0, 0];
        } else {
          kickPattern = pattern;
        }
      },
      setVolume(v: number) { gain.gain.rampTo(v * 0.45, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); gain.dispose(); },
    };
  };
}

function makeSnare(pattern: number[]) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.3);
    const clapFilter = new Tone.Filter({ frequency: 3000, type: 'bandpass' });
    const synth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
      volume: -10,
    });
    synth.chain(clapFilter, gain, dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); }
      seq = new Tone.Sequence((time, active) => {
        if (active) synth.triggerAttackRelease('8n', time);
      }, pattern, '16n');
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); },
      setEnergy(e: number) { gain.gain.rampTo(0.15 + e * 0.25, 0.3); },
      setComplexity(_c: number) {},
      setVolume(v: number) { gain.gain.rampTo(v * 0.3, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); clapFilter.dispose(); gain.dispose(); },
    };
  };
}

function makeHihat(pulses: number) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.15);
    const synth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
      volume: -16,
    });
    synth.connect(gain);
    gain.connect(dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;
    let currentPulses = pulses;

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); }
      const pat = euclidean(16, currentPulses).map(b => b ? 1 : 0);
      seq = new Tone.Sequence((time, active) => {
        if (active) synth.triggerAttackRelease('16n', time, 0.3 + Math.random() * 0.4);
      }, pat, '16n');
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); },
      setEnergy(e: number) {
        currentPulses = Math.floor(4 + e * 10);
        gain.gain.rampTo(0.1 + e * 0.15, 0.3);
      },
      setComplexity(c: number) {
        currentPulses = Math.floor(pulses + c * 6);
      },
      setVolume(v: number) { gain.gain.rampTo(v * 0.15, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); gain.dispose(); },
    };
  };
}

function makePerc(freq: number, decay: number, pattern: number[]) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.2);
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.02, octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay, sustain: 0, release: 0.05 },
      volume: -10,
    });
    synth.connect(gain);
    gain.connect(dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); }
      seq = new Tone.Sequence((time, active) => {
        if (active) synth.triggerAttackRelease(Tone.Frequency(freq, 'midi').toNote(), '16n', time, 0.6 + Math.random() * 0.3);
      }, pattern, '16n');
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); },
      setEnergy(e: number) { gain.gain.rampTo(0.1 + e * 0.2, 0.3); },
      setComplexity(_c: number) {},
      setVolume(v: number) { gain.gain.rampTo(v * 0.2, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); gain.dispose(); },
    };
  };
}

// --- TEXTURE FACTORIES ---

function makeNoiseTex(noiseType: 'pink' | 'brown' | 'white', filterFreq: number, filterRate: number) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.06);
    const reverb = new Tone.Reverb({ decay: 6, wet: 0.6 });
    const autoFilter = new Tone.AutoFilter({
      frequency: filterRate, baseFrequency: filterFreq, octaves: 3, type: 'sine', depth: 0.7, wet: 1,
    });
    const noise = new Tone.Noise({ type: noiseType, volume: -22 });
    noise.chain(autoFilter, reverb, gain, dest as unknown as Tone.ToneAudioNode);

    return {
      start() { autoFilter.start(); noise.start(); },
      stop() { noise.stop(); autoFilter.stop(); },
      setEnergy(e: number) { noise.volume.rampTo(-26 + e * 12, 1); autoFilter.depth.rampTo(0.3 + e * 0.5, 0.5); },
      setComplexity(c: number) { autoFilter.frequency.rampTo(filterRate + c * 0.3, 0.5); },
      setVolume(v: number) { gain.gain.rampTo(v * 0.06, 0.3); },
      dispose() { noise.dispose(); autoFilter.dispose(); reverb.dispose(); gain.dispose(); },
    };
  };
}

function makeDroneTex(note: string, oscType: string) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.05);
    const reverb = new Tone.Reverb({ decay: 8, wet: 0.7 });
    const filter = new Tone.Filter({ frequency: 600, type: 'lowpass' });
    const lfo = new Tone.LFO({ frequency: 0.05, min: 300, max: 800 });
    const synth = new Tone.Synth({
      oscillator: { type: oscType as any },
      envelope: { attack: 3, decay: 1, sustain: 0.8, release: 4 },
      volume: -16,
    });
    synth.chain(filter, reverb, gain, dest as unknown as Tone.ToneAudioNode);
    lfo.connect(filter.frequency);

    return {
      start() { lfo.start(); synth.triggerAttack(note); },
      stop() { synth.triggerRelease(); lfo.stop(); },
      setEnergy(e: number) { filter.frequency.rampTo(300 + e * 600, 1); },
      setComplexity(c: number) { lfo.frequency.rampTo(0.02 + c * 0.1, 0.5); },
      setVolume(v: number) { gain.gain.rampTo(v * 0.05, 0.3); },
      dispose() { synth.dispose(); filter.dispose(); reverb.dispose(); lfo.dispose(); gain.dispose(); },
    };
  };
}

function makeRiserTex() {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.04);
    const reverb = new Tone.Reverb({ decay: 6, wet: 0.6 });
    const filter = new Tone.Filter({ frequency: 500, type: 'bandpass', Q: 2 });
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 4, decay: 0.5, sustain: 0.3, release: 2 },
      volume: -18,
    });
    synth.chain(filter, reverb, gain, dest as unknown as Tone.ToneAudioNode);

    let scheduled: number[] = [];

    return {
      start() {
        const id = Tone.getTransport().scheduleRepeat((time) => {
          if (Math.random() < 0.35) {
            gain.gain.setValueAtTime(0, time);
            gain.gain.rampTo(0.04, 4, time);
            filter.frequency.setValueAtTime(200, time);
            filter.frequency.rampTo(4000, 4, time);
            synth.triggerAttack('C3', time);
            synth.triggerRelease((time as number) + 4.5);
          }
        }, '4m');
        scheduled.push(id);
      },
      stop() {
        scheduled.forEach(id => Tone.getTransport().clear(id));
        scheduled = [];
        synth.triggerRelease();
      },
      setEnergy(e: number) { gain.gain.rampTo(e * 0.06, 0.5); },
      setComplexity(_c: number) {},
      setVolume(v: number) { gain.gain.rampTo(v * 0.04, 0.3); },
      dispose() { scheduled.forEach(id => Tone.getTransport().clear(id)); synth.dispose(); filter.dispose(); reverb.dispose(); gain.dispose(); },
    };
  };
}

function makeCrackleTex() {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.04);
    const filter = new Tone.Filter({ frequency: 2000, type: 'highpass' });
    const noise = new Tone.Noise({ type: 'white', volume: -30 });
    const env = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 });
    noise.chain(env, filter, gain, dest as unknown as Tone.ToneAudioNode);

    let scheduled: number[] = [];

    return {
      start() {
        noise.start();
        const id = Tone.getTransport().scheduleRepeat((time) => {
          if (Math.random() < 0.6) env.triggerAttackRelease(0.01, time);
        }, '32n');
        scheduled.push(id);
      },
      stop() {
        noise.stop();
        scheduled.forEach(id => Tone.getTransport().clear(id));
        scheduled = [];
      },
      setEnergy(e: number) { noise.volume.rampTo(-35 + e * 10, 0.5); },
      setComplexity(_c: number) {},
      setVolume(v: number) { gain.gain.rampTo(v * 0.04, 0.3); },
      dispose() { scheduled.forEach(id => Tone.getTransport().clear(id)); noise.dispose(); env.dispose(); filter.dispose(); gain.dispose(); },
    };
  };
}

function makeSparkle() {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.05);
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 });
    const delay = new Tone.FeedbackDelay({ delayTime: '16n.', feedback: 0.4, wet: 0.3 });
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.3 },
      volume: -18,
    });
    synth.chain(delay, reverb, gain, dest as unknown as Tone.ToneAudioNode);

    let scheduled: number[] = [];

    return {
      start() {
        const id = Tone.getTransport().scheduleRepeat((time) => {
          if (Math.random() < 0.4) {
            const note = ['C6', 'E6', 'G6', 'B6', 'D7'][Math.floor(Math.random() * 5)];
            synth.triggerAttackRelease(note, '32n', time, 0.2 + Math.random() * 0.3);
          }
        }, '8n');
        scheduled.push(id);
      },
      stop() {
        scheduled.forEach(id => Tone.getTransport().clear(id));
        scheduled = [];
      },
      setEnergy(e: number) { gain.gain.rampTo(0.02 + e * 0.06, 0.5); },
      setComplexity(_c: number) {},
      setVolume(v: number) { gain.gain.rampTo(v * 0.05, 0.3); },
      dispose() { scheduled.forEach(id => Tone.getTransport().clear(id)); synth.dispose(); delay.dispose(); reverb.dispose(); gain.dispose(); },
    };
  };
}

// --- MELODIC FACTORIES ---

function makeMelodic(oscType: string, attack: number, release: number, portamento: number, delayFb: number) {
  return (dest: Dest): GridAudioNode => {
    const gain = new Tone.Gain(0.07);
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.35 });
    const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: delayFb, wet: 0.25 });
    const synth = new Tone.MonoSynth({
      oscillator: { type: oscType as any },
      envelope: { attack, decay: 0.2, sustain: 0.4, release },
      filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.5, baseFrequency: 400, octaves: 3 },
      portamento,
      volume: -12,
    });
    synth.chain(delay, reverb, gain, dest as unknown as Tone.ToneAudioNode);

    let seq: Tone.Sequence | null = null;
    let scaleNotes: string[] = [];

    function generatePhrase(): (string | null)[] {
      if (scaleNotes.length === 0) return [];
      const phrase: (string | null)[] = [];
      let idx = Math.floor(scaleNotes.length / 2);
      for (let i = 0; i < 16; i++) {
        if (Math.random() < 0.3) { phrase.push(null); continue; }
        const dir = Math.random();
        if (dir < 0.4) idx = Math.min(scaleNotes.length - 1, idx + 1);
        else if (dir < 0.8) idx = Math.max(0, idx - 1);
        else idx = Math.max(0, Math.min(scaleNotes.length - 1, idx + (Math.random() < 0.5 ? 3 : -3)));
        phrase.push(scaleNotes[idx]);
      }
      phrase[15] = scaleNotes[0];
      return phrase;
    }

    function rebuild() {
      if (seq) { seq.stop(); seq.dispose(); seq = null; }
      const phrase = generatePhrase();
      if (phrase.length === 0) return;
      seq = new Tone.Sequence((time, note) => {
        if (note) synth.triggerAttackRelease(note, Math.random() < 0.3 ? '4n' : '8n', time, 0.3 + Math.random() * 0.3);
      }, phrase, '8n');
      seq.loop = true;
      if (Tone.getTransport().state === 'started') seq.start(0);
    }

    return {
      start() { rebuild(); },
      stop() { if (seq) seq.stop(); synth.triggerRelease(); },
      setScale(notes: string[]) { scaleNotes = notes; rebuild(); },
      setEnergy(e: number) { synth.filterEnvelope.octaves = 2 + e * 3; delay.feedback.rampTo(delayFb + e * 0.15, 0.5); },
      setComplexity(c: number) { synth.portamento = portamento + c * 0.1; },
      setVolume(v: number) { gain.gain.rampTo(v * 0.07, 0.3); },
      dispose() { if (seq) seq.dispose(); synth.dispose(); delay.dispose(); reverb.dispose(); gain.dispose(); },
    };
  };
}

// ============================================================
// MASTER FACTORY
// ============================================================

const FACTORIES: Record<string, (dest: Dest) => GridAudioNode> = {
  // Pads
  'warm-pad': makePad('fatsawtooth', 1.5, 2000, 5, 0.5, 30),
  'ice-pad': makePad('triangle', 0.8, 5000, 4, 0.4, 0),
  'choir-pad': makePad('fatsquare', 1.2, 1500, 6, 0.6, 20),
  'shimmer-pad': makePad('fatsawtooth', 0.5, 6000, 3, 0.3, 40),
  'dark-pad': makePad('fatsawtooth', 2.0, 800, 8, 0.7, 25),
  'glass-pad': makePad('sine', 0.3, 8000, 4, 0.4, 0),

  // Arps
  'rise-arp': makeArp(
    (notes) => [...notes],
    '16n', 'fatsawtooth', 0.3, 4000
  ),
  'fall-arp': makeArp(
    (notes) => [...notes].reverse(),
    '16n', 'fatsawtooth', 0.3, 3500
  ),
  'bounce-arp': makeArp(
    (notes) => { const up = [...notes]; const down = [...notes].reverse().slice(1, -1); return [...up, ...down]; },
    '8n', 'triangle', 0.25, 5000
  ),
  'scatter-arp': makeArp(
    (notes) => notes.map(() => notes[Math.floor(Math.random() * notes.length)]),
    '16n', 'square', 0.35, 3000
  ),
  'pulse-arp': makeArp(
    (notes) => {
      const eu = euclidean(16, 9);
      return eu.map((b, i) => b ? notes[i % notes.length] : null);
    },
    '16n', 'fatsawtooth', 0.2, 4500
  ),
  'trill-arp': makeArp(
    (notes) => {
      if (notes.length < 2) return notes;
      const a = notes[0], b = notes[1];
      return [a, b, a, b, a, b, a, b];
    },
    '32n', 'sine', 0.4, 6000
  ),

  // Bass
  'sub-bass': makeBass('sine', 150, (r) => [r, null, r, null, r, null, null, r]),
  'acid-bass': makeBass('sawtooth', 300, (r) => [r, null, r, r, null, r, null, null]),
  'pluck-bass': makeBass('triangle', 200, (r) => [r, null, null, r, null, null, r, null]),
  'wobble-bass': makeBass('square', 180, (r) => [r, null, null, null, r, null, null, null]),
  'fm-bass': makeBass('fmsine', 250, (r) => [r, null, r, null, null, r, r, null]),
  'round-bass': makeBass('sine', 120, (r) => [r, null, null, null, r, null, null, null]),

  // Drums
  'kick': makeKick([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
  'snare': makeSnare([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
  'hihat': makeHihat(9),
  'clap': makeSnare([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
  'rim': makePerc(72, 0.05, [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0]),
  'shaker': makePerc(80, 0.03, euclidean(16, 8).map(b => b ? 1 : 0)),

  // Textures
  'noise-tex': makeNoiseTex('pink', 200, 0.1),
  'wind-tex': makeNoiseTex('brown', 150, 0.03),
  'sparkle-tex': makeSparkle(),
  'drone-tex': makeDroneTex('A1', 'sine'),
  'riser-tex': makeRiserTex(),
  'crackle-tex': makeCrackleTex(),

  // Melodic
  'saw-lead': makeMelodic('fatsawtooth', 0.05, 0.8, 0.05, 0.3),
  'bell-mel': makeMelodic('sine', 0.001, 1.5, 0, 0.4),
  'pluck-mel': makeMelodic('triangle', 0.005, 0.3, 0, 0.2),
  'keys-mel': makeMelodic('square', 0.01, 0.5, 0, 0.25),
  'whistle-mel': makeMelodic('sine', 0.1, 1.0, 0.15, 0.35),
  'marimba-mel': makeMelodic('triangle', 0.001, 0.2, 0, 0.15),
};

export function createGridAudio(id: string, dest: Dest): GridAudioNode | null {
  const factory = FACTORIES[id];
  if (!factory) return null;
  return factory(dest);
}
