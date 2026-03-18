import * as Tone from 'tone';

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;

  async start(): Promise<void> {
    const ctx = Tone.getContext().rawContext as unknown as AudioContext;
    const dest = ctx.createMediaStreamDestination();
    Tone.getDestination().connect(dest as unknown as AudioNode);

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(dest.stream, {
      mimeType: this.getSupportedMimeType(),
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.isRecording = true;
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.chunks[0]?.type || 'audio/webm' });
        this.chunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  private getSupportedMimeType(): string {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
  }

  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
