/** Preserve the original variable step while migrating; physics changes are separate. */
export class GameLoop {
  private handle: number | null = null;
  private last = 0;
  constructor(private readonly frame: (dt: number, seconds: number) => void) {}
  start(): void {
    if (this.handle !== null) return;
    this.last = performance.now();
    this.handle = requestAnimationFrame(this.tick);
  }
  stop(): void {
    if (this.handle !== null) cancelAnimationFrame(this.handle);
    this.handle = null;
  }
  private tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.frame(dt, now / 1000);
    this.handle = requestAnimationFrame(this.tick);
  };
}
