import type { CharacterName } from '../core/types';

/** Retains the published procedural sound; this refactor does not replace the voices. */
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
  babble(name: CharacterName, kind = 'talk'): void {
    if (!this.state.music) return;
    const a = this.audio();
    if (!a) return;
    const pitch = name === 'Bubu' ? 238 : 352,
      syllables = name === 'Bubu' ? 'atata' : 'dadada';
    const pattern =
      kind === 'kiss'
        ? name === 'Bubu'
          ? [1.08, 1.24]
          : [1.02, 1.18]
        : syllables === 'atata'
          ? [1, 0.88, 1.02, 0.9]
          : [1, 1.15, 1.04, 1.2, 1.08];
    pattern.forEach((p, i) => {
      const t = a.currentTime + i * 0.135,
        source = a.createOscillator(),
        envelope = a.createGain();
      source.type = 'triangle';
      source.frequency.setValueAtTime(pitch * p, t);
      source.frequency.exponentialRampToValueAtTime(
        pitch * p * (name === 'Bubu' ? 0.82 : 0.9),
        t + 0.12,
      );
      envelope.gain.setValueAtTime(0, t);
      envelope.gain.linearRampToValueAtTime(0.13, t + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      envelope.connect(a.destination);
      const vowels =
        i % 2 === 0
          ? name === 'Bubu'
            ? [420, 920, 2200]
            : [520, 1250, 2700]
          : name === 'Bubu'
            ? [330, 760, 1900]
            : [700, 1500, 3100];
      const filters = vowels.map((f, j) => {
        const filter = a.createBiquadFilter(),
          gain = a.createGain();
        filter.type = 'bandpass';
        filter.frequency.value = f;
        filter.Q.value = 5;
        gain.gain.value = [1, 0.5, 0.18][j];
        source.connect(filter);
        filter.connect(gain);
        gain.connect(envelope);
        return [filter, gain];
      });
      source.start(t);
      source.stop(t + 0.14);
      source.onended = () => {
        source.disconnect();
        envelope.disconnect();
        for (const [f, g] of filters) {
          f.disconnect();
          g.disconnect();
        }
      };
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
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.context?.close();
    this.context = null;
  }
}
