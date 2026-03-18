import * as Tone from 'tone';
import type { ArpPattern, ArpRate } from '../../types';
import { euclidean } from '../../utils/euclidean';

export class ArpeggioLayer {
  private synth: Tone.PolySynth;
  private filter: Tone.Filter;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private gain: Tone.Gain;
  private sequence: Tone.Sequence | null = null;
  private notes: string[] = [];
  private pattern: ArpPattern = 'up';
  private rate: ArpRate = '16n';
  private euclideanPattern: boolean[] = [];
  constructor(destination: Tone.InputNode) {
    this.gain = new Tone.Gain(0.25);
    this.reverb = new Tone.Reverb({ decay: 3, wet: 0.3 });
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 0.25 });
    this.filter = new Tone.Filter({ frequency: 4000, type: 'lowpass', rolloff: -12 });

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 2,
        spread: 20,
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.4,
      },
      volume: -10,
    });

    this.synth.chain(this.filter, this.delay, this.reverb, this.gain, destination as unknown as Tone.ToneAudioNode);
    this.euclideanPattern = euclidean(16, 9);
  }

  setNotes(notes: string[]) {
    this.notes = notes;
    this.rebuildSequence();
  }

  setPattern(pattern: ArpPattern) {
    this.pattern = pattern;
    if (pattern === 'euclidean') {
      this.euclideanPattern = euclidean(16, 7 + Math.floor(Math.random() * 4));
    }
    this.rebuildSequence();
  }

  setRate(rate: ArpRate) {
    this.rate = rate;
    this.rebuildSequence();
  }

  private getOrderedNotes(): (string | null)[] {
    if (this.notes.length === 0) return [];

    switch (this.pattern) {
      case 'up':
        return [...this.notes];
      case 'down':
        return [...this.notes].reverse();
      case 'up-down': {
        const up = [...this.notes];
        const down = [...this.notes].reverse().slice(1, -1);
        return [...up, ...down];
      }
      case 'random':
        return this.notes.map(() => this.notes[Math.floor(Math.random() * this.notes.length)]);
      case 'euclidean': {
        const ordered: (string | null)[] = [];
        for (let i = 0; i < this.euclideanPattern.length; i++) {
          if (this.euclideanPattern[i]) {
            ordered.push(this.notes[i % this.notes.length]);
          } else {
            ordered.push(null); // rest
          }
        }
        return ordered;
      }
      default:
        return [...this.notes];
    }
  }

  private rebuildSequence() {
    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
      this.sequence = null;
    }

    const ordered = this.getOrderedNotes();
    if (ordered.length === 0) return;

    this.sequence = new Tone.Sequence(
      (time, note) => {
        if (note) {
          // Humanization: slight probability of skipping
          if (Math.random() > 0.08) {
            const velocity = 0.5 + Math.random() * 0.4;
            this.synth.triggerAttackRelease(note, '32n', time, velocity);
          }
        }
      },
      ordered,
      this.rate
    );

    this.sequence.loop = true;
    if (Tone.getTransport().state === 'started') {
      this.sequence.start(0);
    }
  }

  start() {
    if (this.sequence) {
      this.sequence.start(0);
    }
  }

  stop() {
    if (this.sequence) {
      this.sequence.stop();
    }
    this.synth.releaseAll();
  }

  setFilterFrequency(freq: number) {
    this.filter.frequency.rampTo(freq, 0.3);
  }

  setDelayFeedback(feedback: number) {
    this.delay.feedback.rampTo(feedback, 0.3);
  }

  setDelayTime(time: string) {
    this.delay.delayTime.rampTo(Tone.Time(time).toSeconds(), 0.3);
  }

  setVolume(vol: number) {
    this.gain.gain.rampTo(vol * 0.25, 0.3);
  }

  setEnergy(energy: number) {
    const filterFreq = 1000 + energy * 7000;
    this.setFilterFrequency(filterFreq);
    this.delay.feedback.rampTo(0.2 + energy * 0.25, 0.5);
  }

  dispose() {
    this.stop();
    if (this.sequence) this.sequence.dispose();
    this.synth.dispose();
    this.filter.dispose();
    this.delay.dispose();
    this.reverb.dispose();
    this.gain.dispose();
  }
}
