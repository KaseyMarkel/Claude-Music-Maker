import * as Tone from 'tone';
import { euclidean } from '../../utils/euclidean';

export class RhythmLayer {
  private kick: Tone.MembraneSynth;
  private hihat: Tone.MetalSynth;
  private clap: Tone.NoiseSynth;
  private gain: Tone.Gain;
  private kickGain: Tone.Gain;
  private hihatGain: Tone.Gain;
  private clapGain: Tone.Gain;
  private kickLoop: Tone.Sequence | null = null;
  private hihatLoop: Tone.Sequence | null = null;
  private clapLoop: Tone.Sequence | null = null;
  private hihatPattern: boolean[] = euclidean(16, 9);
  onKickTrigger: ((time: Tone.Unit.Time) => void) | null = null;

  constructor(destination: Tone.InputNode) {
    this.gain = new Tone.Gain(0.5);
    this.kickGain = new Tone.Gain(0.8);
    this.hihatGain = new Tone.Gain(0.3);
    this.clapGain = new Tone.Gain(0.4);

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -4,
    });

    this.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -16,
    });

    this.clap = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
      volume: -12,
    });

    const clapFilter = new Tone.Filter({ frequency: 3000, type: 'bandpass' });

    this.kick.connect(this.kickGain);
    this.hihat.connect(this.hihatGain);
    this.clap.chain(clapFilter, this.clapGain);

    this.kickGain.connect(this.gain);
    this.hihatGain.connect(this.gain);
    this.clapGain.connect(this.gain);
    this.gain.connect(destination as unknown as Tone.ToneAudioNode);
  }

  buildPatterns() {
    // Kick: four-on-the-floor
    if (this.kickLoop) { this.kickLoop.stop(); this.kickLoop.dispose(); }
    this.kickLoop = new Tone.Sequence(
      (time, active) => {
        if (active) {
          this.kick.triggerAttackRelease('C1', '8n', time, 0.9);
          if (this.onKickTrigger) this.onKickTrigger(time);
        }
      },
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      '16n'
    );
    this.kickLoop.loop = true;

    // Hi-hat: euclidean
    if (this.hihatLoop) { this.hihatLoop.stop(); this.hihatLoop.dispose(); }
    this.hihatLoop = new Tone.Sequence(
      (time, active) => {
        if (active) {
          const vel = 0.4 + Math.random() * 0.4;
          this.hihat.triggerAttackRelease('16n', time, vel);
        }
      },
      this.hihatPattern.map(b => b ? 1 : 0),
      '16n'
    );
    this.hihatLoop.loop = true;

    // Clap: 2 and 4
    if (this.clapLoop) { this.clapLoop.stop(); this.clapLoop.dispose(); }
    this.clapLoop = new Tone.Sequence(
      (time, active) => {
        if (active) {
          this.clap.triggerAttackRelease('8n', time);
        }
      },
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      '16n'
    );
    this.clapLoop.loop = true;
  }

  setHihatDensity(pulses: number) {
    this.hihatPattern = euclidean(16, Math.min(16, Math.max(1, pulses)));
    this.buildPatterns();
    if (Tone.getTransport().state === 'started') {
      this.start();
    }
  }

  start() {
    this.buildPatterns();
    this.kickLoop?.start(0);
    this.hihatLoop?.start(0);
    this.clapLoop?.start(0);
  }

  stop() {
    this.kickLoop?.stop();
    this.hihatLoop?.stop();
    this.clapLoop?.stop();
  }

  setVolume(vol: number) {
    this.gain.gain.rampTo(vol * 0.5, 0.3);
  }

  setEnergy(energy: number) {
    // Higher energy = more hi-hat density, louder kick
    const hatPulses = Math.floor(4 + energy * 10); // 4-14 pulses
    this.hihatPattern = euclidean(16, hatPulses);
    this.kickGain.gain.rampTo(0.5 + energy * 0.5, 0.3);
    this.hihatGain.gain.rampTo(0.15 + energy * 0.25, 0.3);
    this.clapGain.gain.rampTo(0.2 + energy * 0.3, 0.3);
  }

  dispose() {
    this.stop();
    this.kickLoop?.dispose();
    this.hihatLoop?.dispose();
    this.clapLoop?.dispose();
    this.kick.dispose();
    this.hihat.dispose();
    this.clap.dispose();
    this.gain.dispose();
    this.kickGain.dispose();
    this.hihatGain.dispose();
    this.clapGain.dispose();
  }
}
