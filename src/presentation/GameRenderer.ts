import type { GameSession } from '../gameplay/GameSession';
export interface GameRenderer {
  readonly loaded: Promise<void>;
  readonly yaw: number;
  render(dt: number, time: number, session: GameSession): void;
  rotate(amount: number): void;
  project(x: number, y: number, z: number): { x: number; y: number };
  dispose(): void;
}
