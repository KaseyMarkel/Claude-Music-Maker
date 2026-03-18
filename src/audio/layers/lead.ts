import * as Tone from 'tone';

export class LeadLayer {
  private synth: Tone.MonoSynth;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private gain: Tone.Gain;
  private sequence: Tone.Sequence | null = null;
  private scaleNotes: string[] = [];

  constructor(destination: Tone.InputNode) {
    this.gain = new Tone.Gain(0.15);
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.35, wet: 0.3 });

    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'fatsawtooth', count: 2, spread: 15 },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.8 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.3,
        release: 0.5,
        baseFrequency: 400,
        octaves: 3,
      },
      portamento: 0.05,
      volume: -10,
    });

    this.synth.chain(this.delay, this.reverb, this.gain, destination as unknown as Tone.ToneAudioNode);
  }

  setScaleNotes(notes: string[]) {
    this.scaleNotes = notes;
    this.rebuildMelody();
  }

  private rebuildMelody() {
    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
    }

    if (this.scaleNotes.length === 0) return;

    // Generate a melodic phrase using musical rules
    const phrase = this.generatePhrase();

    this.sequence = new Tone.Sequence(
      (time, note) => {
        if (note) {
          const vel = 0.4 + Math.random() * 0.3;
          const duration = Math.random() < 0.3 ? '4n' : '8n';
          this.synth.triggerAttackRelease(note, duration, time, vel);
        }
      },
      phrase,
      '8n'
    );

    this.sequence.loop = true;

    if (Tone.getTransport().state === 'started') {
      this.sequence.start(0);
    }
  }

  private generatePhrase(): (string | null)[] {
    const notes = this.scaleNotes;
    if (notes.length === 0) return [];

    const phrase: (string | null)[] = [];
    const phraseLength = 16; // 16 eighth notes = 2 bars
    let currentIndex = Math.floor(notes.length / 2); // Start in middle

    for (let i = 0; i < phraseLength; i++) {
      // Rest probability (more rests = more musical)
      if (Math.random() < 0.3) {
        phrase.push(null);
        continue;
      }

      // Stepwise motion preference (musical)
      const direction = Math.random();
      if (direction < 0.4) {
        currentIndex = Math.min(notes.length - 1, currentIndex + 1); // step up
      } else if (direction < 0.8) {
        currentIndex = Math.max(0, currentIndex - 1); // step down
      } else {
        // Occasional leap (2-3 steps)
        const leap = Math.floor(Math.random() * 3) + 2;
        currentIndex = Math.random() < 0.5
          ? Math.min(notes.length - 1, currentIndex + leap)
          : Math.max(0, currentIndex - leap);
      }

      phrase.push(notes[currentIndex]);
    }

    // End phrase on a chord tone (first note = root, approx)
    phrase[phraseLength - 1] = notes[0];

    return phrase;
  }

  start() {
    this.rebuildMelody();
    if (this.sequence) this.sequence.start(0);
  }

  stop() {
    if (this.sequence) this.sequence.stop();
    this.synth.triggerRelease();
  }

  setVolume(vol: number) {
    this.gain.gain.rampTo(vol * 0.15, 0.3);
  }

  setEnergy(energy: number) {
    this.synth.filterEnvelope.octaves = 2 + energy * 3;
    this.delay.feedback.rampTo(0.2 + energy * 0.2, 0.5);
  }

  dispose() {
    this.stop();
    if (this.sequence) this.sequence.dispose();
    this.synth.dispose();
    this.delay.dispose();
    this.reverb.dispose();
    this.gain.dispose();
  }
}
