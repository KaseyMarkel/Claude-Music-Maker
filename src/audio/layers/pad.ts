import * as Tone from 'tone';

export class PadLayer {
  private synth: Tone.PolySynth;
  private filter: Tone.Filter;
  private reverb: Tone.Reverb;
  private chorus: Tone.Chorus;
  private gain: Tone.Gain;
  private currentNotes: string[] = [];

  constructor(destination: Tone.InputNode) {
    this.gain = new Tone.Gain(0.35);
    this.reverb = new Tone.Reverb({ decay: 6, wet: 0.5 });
    this.chorus = new Tone.Chorus({ frequency: 0.3, delayTime: 12, depth: 0.8, wet: 0.3 });
    this.filter = new Tone.Filter({ frequency: 2000, type: 'lowpass', rolloff: -24 });

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 30,
      },
      envelope: {
        attack: 1.5,
        decay: 0.5,
        sustain: 0.8,
        release: 3.0,
      },
      volume: -8,
    });

    this.synth.chain(this.filter, this.chorus, this.reverb, this.gain, destination as unknown as Tone.ToneAudioNode);
  }

  playChord(notes: string[], time?: Tone.Unit.Time) {
    // Release old notes with ramp to avoid clicks
    if (this.currentNotes.length > 0) {
      this.synth.releaseAll(time);
    }

    // Play new notes
    const t = time ?? Tone.now();
    this.synth.triggerAttack(notes, t);
    this.currentNotes = notes;
  }

  releaseAll(time?: Tone.Unit.Time) {
    this.synth.releaseAll(time);
    this.currentNotes = [];
  }

  setFilterFrequency(freq: number) {
    this.filter.frequency.rampTo(freq, 0.5);
  }

  setReverbWet(wet: number) {
    this.reverb.wet.rampTo(wet, 0.3);
  }

  setVolume(vol: number) {
    this.gain.gain.rampTo(vol * 0.35, 0.3);
  }

  setEnergy(energy: number) {
    // Energy controls filter openness and reverb
    const filterFreq = 400 + energy * 4600; // 400 - 5000 Hz
    const reverbWet = 0.7 - energy * 0.3;   // More reverb at low energy
    this.setFilterFrequency(filterFreq);
    this.setReverbWet(reverbWet);
  }

  dispose() {
    this.synth.dispose();
    this.filter.dispose();
    this.reverb.dispose();
    this.chorus.dispose();
    this.gain.dispose();
  }
}
