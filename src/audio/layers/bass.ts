import * as Tone from 'tone';

export class BassLayer {
  private subBass: Tone.MonoSynth;
  private midBass: Tone.MonoSynth;
  private filter: Tone.Filter;
  private compressor: Tone.Compressor;
  private gain: Tone.Gain;
  private sequence: Tone.Sequence | null = null;
  private currentRoot: string = 'A2';
  private sidechain: Tone.Gain;
  private sidechainEnv: Tone.Envelope;

  constructor(destination: Tone.InputNode) {
    this.gain = new Tone.Gain(0.4);
    this.compressor = new Tone.Compressor({ threshold: -20, ratio: 4, attack: 0.003, release: 0.1 });
    this.filter = new Tone.Filter({ frequency: 200, type: 'lowpass', rolloff: -24 });

    // Sidechain ducking simulation
    this.sidechain = new Tone.Gain(1);
    this.sidechainEnv = new Tone.Envelope({ attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 });

    this.subBass = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.3 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.3, baseFrequency: 80, octaves: 1 },
      volume: -6,
    });

    this.midBass = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2, baseFrequency: 150, octaves: 2.5 },
      volume: -12,
    });

    this.subBass.chain(this.sidechain, this.compressor, this.gain, destination as unknown as Tone.ToneAudioNode);
    this.midBass.chain(this.filter, this.sidechain);
  }

  setRoot(note: string) {
    this.currentRoot = note;
    this.rebuildSequence();
  }

  private rebuildSequence() {
    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
    }

    // Simple bass pattern: root on beats with occasional octave
    const pattern = [
      this.currentRoot,
      null,
      this.currentRoot,
      null,
      this.currentRoot,
      null,
      null,
      this.currentRoot,
    ];

    this.sequence = new Tone.Sequence(
      (time, note) => {
        if (note) {
          this.subBass.triggerAttackRelease(note, '8n', time, 0.8);
          if (Math.random() > 0.5) {
            this.midBass.triggerAttackRelease(note, '16n', time, 0.5 + Math.random() * 0.3);
          }
        }
      },
      pattern,
      '8n'
    );

    this.sequence.loop = true;
    if (Tone.getTransport().state === 'started') {
      this.sequence.start(0);
    }
  }

  // Called by kick to trigger sidechain ducking
  triggerSidechain(time: Tone.Unit.Time) {
    // Duck the bass when kick hits
    this.sidechain.gain.setValueAtTime(0.2, time);
    this.sidechain.gain.rampTo(1, 0.12, time as number + 0.01);
  }

  start() {
    this.rebuildSequence();
    if (this.sequence) this.sequence.start(0);
  }

  stop() {
    if (this.sequence) this.sequence.stop();
    this.subBass.triggerRelease();
    this.midBass.triggerRelease();
  }

  setVolume(vol: number) {
    this.gain.gain.rampTo(vol * 0.4, 0.3);
  }

  setEnergy(energy: number) {
    const filterFreq = 100 + energy * 300;
    this.filter.frequency.rampTo(filterFreq, 0.5);
  }

  dispose() {
    this.stop();
    if (this.sequence) this.sequence.dispose();
    this.subBass.dispose();
    this.midBass.dispose();
    this.filter.dispose();
    this.compressor.dispose();
    this.gain.dispose();
    this.sidechain.dispose();
    this.sidechainEnv.dispose();
  }
}
