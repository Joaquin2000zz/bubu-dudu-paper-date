import { createPaperEngine } from '../engine.js';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import type { GameSession } from '../gameplay/GameSession';
import type { GameRenderer } from './GameRenderer';

/** Adapter keeps the authored WebGL drawing unchanged behind a typed boundary. */
export class PaperRenderer implements GameRenderer {
  private engine: ReturnType<typeof createPaperEngine>;
  readonly loaded: Promise<void>;
  constructor(
    canvas: HTMLCanvasElement,
    symbols: HTMLElement,
    reducedMotion: boolean,
    world: PhysicsWorld,
  ) {
    this.engine = createPaperEngine(canvas, symbols, reducedMotion, world);
    this.loaded = this.engine.loaded.then(() => undefined);
  }
  get yaw(): number {
    return this.engine.yaw;
  }
  rotate(amount: number): void {
    this.engine.rotate(amount);
  }
  project(x: number, y: number, z: number) {
    return this.engine.project(x, y, z);
  }
  render(dt: number, time: number, s: GameSession): void {
    this.engine.render(dt, time, s, s.positions, s.player, s.partner);
  }
  dispose(): void {
    this.engine.dispose();
  }
}
