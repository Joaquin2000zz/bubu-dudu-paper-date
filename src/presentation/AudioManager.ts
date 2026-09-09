import bubuVoice from '../assets/voices/bubu.mp3?inline';
import duduVoice from '../assets/voices/dudu.mp3?inline';
import type { CharacterName } from '../core/types';

/** Recorded character voices, with procedural music and effects. */
export class AudioManager {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private note = 0;
  constructor(private state: { music: boolean; mode: string; theme: string }) {}
  private audio(): AudioContext | null {
    try {
      const ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context ||= new ctor();
      void this.context.resume();
      return this.context;
    } catch {
      return null;
    }
  }
  private tone(f: number, d = 0.18, v = 0.025, delay = 0, type: OscillatorType = 'sine'): void {
    if (!this.state.music) return;
    const a = this.audio();
    if (!a) return;
    const o = a.createOscillator(),
      g = a.createGain(),
      t = a.currentTime + delay;
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + d + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  private voice: AudioBufferSourceNode | null = null;
  private voiceRequest = 0;
  private buffers = new Map<CharacterName, Promise<AudioBuffer>>();
  private readonly recordings: Record<CharacterName, string> = { Bubu: duduVoice, Dudu: bubuVoice };
  stopVoice(): void {
    this.voiceRequest++;
    this.voice?.stop();
    this.voice = null;
  }
  babble(name: CharacterName, _kind = 'talk'): void {
    this.stopVoice();
    if (!this.state.music) return;
    const context = this.audio();
    if (!context) return;
    const request = this.voiceRequest;
    let buffer = this.buffers.get(name);
    if (!buffer) {
      buffer = fetch(this.recordings[name])
        .then((r) => r.arrayBuffer())
        .then((bytes) => context.decodeAudioData(bytes));
      this.buffers.set(name, buffer);
    }
    void Promise.all([buffer, context.resume()])
      .then(([decoded]) => {
        if (request !== this.voiceRequest || !this.state.music || context.state === 'closed')
          return;
        const source = context.createBufferSource();
        source.buffer = decoded;
        source.connect(context.destination);
        this.voice = source;
        source.onended = () => {
          source.disconnect();
          if (this.voice === source) this.voice = null;
        };
        source.start();
      })
      .catch((error) => {
        this.buffers.delete(name);
        console.error('No se pudo reproducir la voz de ' + name, error);
      });
  }
  startMusic(): void {
    this.audio();
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.state.music || this.state.mode === 'menu') return;
      const tune =
        this.state.theme === 'night'
          ? [220, 261.63, 293.66, 261.63, 196, 233.08, 220, 174.61]
          : this.state.theme === 'dawn'
            ? [293.66, 349.23, 440, 392, 349.23, 329.63, 293.66, 261.63]
            : [
                523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 880, 783.99, 659.25, 587.33,
                523.25,
              ];
      const n = tune[this.note++ % tune.length];
      this.tone(n, 0.3, 0.012);
      this.tone(n / 2, 0.38, 0.006, 0.02, 'triangle');
    }, 440);
  }
  flowerChime(): void {
    this.tone(659, 0.17, 0.045);
    this.tone(784, 0.2, 0.042, 0.1);
    this.tone(988, 0.3, 0.038, 0.2);
  }
  kissChime(): void {
    this.tone(784, 0.14, 0.045);
    this.tone(1047, 0.18, 0.04, 0.08);
    this.tone(1319, 0.25, 0.035, 0.16);
  }
  dispose(): void {
    this.stopVoice();
    this.buffers.clear();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.context?.close();
    this.context = null;
  }
}
