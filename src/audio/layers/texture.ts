import * as Tone from 'tone';

export class TextureLayer {
  private noise: Tone.Noise;
  private filter: Tone.AutoFilter;
  private reverb: Tone.Reverb;
  private gain: Tone.Gain;
  private riserSynth: Tone.Synth;
  private riserFilter: Tone.Filter;
  private riserGain: Tone.Gain;
  private scheduledEvents: number[] = [];
  private isRunning = false;

  constructor(destination: Tone.InputNode) {
    this.gain = new Tone.Gain(0.15);
    this.reverb = new Tone.Reverb({ decay: 8, wet: 0.7 });
    this.filter = new Tone.AutoFilter({
      frequency: 0.1,
      baseFrequency: 200,
      octaves: 4,
      type: 'sine',
      depth: 0.8,
      wet: 1,
    });

    this.noise = new Tone.Noise({ type: 'pink', volume: -20 });
    this.noise.chain(this.filter, this.reverb, this.gain, destination as unknown as Tone.ToneAudioNode);

    // Riser synth for tension builds
    this.riserGain = new Tone.Gain(0);
    this.riserFilter = new Tone.Filter({ frequency: 500, type: 'bandpass', Q: 2 });
    this.riserSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 4, decay: 0.5, sustain: 0.3, release: 2 },
      volume: -18,
    });
    this.riserSynth.chain(this.riserFilter, this.riserGain, this.reverb);
  }

  start() {
    this.isRunning = true;
    this.filter.start();
    this.noise.start();
    this.scheduleTextures();
  }

  stop() {
    this.isRunning = false;
    this.noise.stop();
    this.filter.stop();
    this.scheduledEvents.forEach(id => Tone.getTransport().clear(id));
    this.scheduledEvents = [];
    this.riserSynth.triggerRelease();
  }

  private scheduleTextures() {
    // Schedule risers at musical intervals
    const id = Tone.getTransport().scheduleRepeat((time) => {
      if (!this.isRunning) return;

      // Random chance of riser
      if (Math.random() < 0.3) {
        this.triggerRiser(time);
      }

      // Vary the noise filter
      const newFreq = 0.05 + Math.random() * 0.2;
      this.filter.frequency.setValueAtTime(newFreq, time);
    }, '4m'); // Every 4 bars

    this.scheduledEvents.push(id);
  }

  private triggerRiser(time: Tone.Unit.Time) {
    // Sweep the riser up
    this.riserGain.gain.setValueAtTime(0, time);
    this.riserGain.gain.rampTo(0.15, 4, time);
    this.riserFilter.frequency.setValueAtTime(200, time);
    this.riserFilter.frequency.rampTo(4000, 4, time);

    this.riserSynth.triggerAttack('C3', time);

    // Release after sweep
    const releaseTime = (time as number) + 4.5;
    this.riserSynth.triggerRelease(releaseTime);
    this.riserGain.gain.rampTo(0, 1, releaseTime);
  }

  setVolume(vol: number) {
    this.gain.gain.rampTo(vol * 0.15, 0.3);
  }

  setEnergy(energy: number) {
    // More energy = more texture presence
    this.noise.volume.rampTo(-24 + energy * 10, 1);
    this.filter.depth.rampTo(0.3 + energy * 0.6, 0.5);
  }

  dispose() {
    this.stop();
    this.noise.dispose();
    this.filter.dispose();
    this.reverb.dispose();
    this.gain.dispose();
    this.riserSynth.dispose();
    this.riserFilter.dispose();
    this.riserGain.dispose();
  }
}
