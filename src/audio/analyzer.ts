import * as Tone from 'tone';

export class AudioAnalyzer {
  private analyser: Tone.Analyser;
  private waveformAnalyser: Tone.Analyser;

  constructor() {
    this.analyser = new Tone.Analyser('fft', 256);
    this.waveformAnalyser = new Tone.Analyser('waveform', 256);
  }

  connect(source: Tone.ToneAudioNode) {
    source.connect(this.analyser);
    source.connect(this.waveformAnalyser);
  }

  getFFT(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  getWaveform(): Float32Array {
    return this.waveformAnalyser.getValue() as Float32Array;
  }

  // Get average amplitude (0-1) for visual reactivity
  getAmplitude(): number {
    const waveform = this.getWaveform();
    let sum = 0;
    for (let i = 0; i < waveform.length; i++) {
      sum += Math.abs(waveform[i]);
    }
    return sum / waveform.length;
  }

  // Get bass energy specifically (for kick-reactive visuals)
  getBassEnergy(): number {
    const fft = this.getFFT();
    let sum = 0;
    const bassRange = Math.floor(fft.length * 0.1); // Bottom 10% of spectrum
    for (let i = 0; i < bassRange; i++) {
      // FFT values are in dB, convert to linear
      sum += Math.pow(10, fft[i] / 20);
    }
    return Math.min(1, sum / bassRange);
  }

  dispose() {
    this.analyser.dispose();
    this.waveformAnalyser.dispose();
  }
}
