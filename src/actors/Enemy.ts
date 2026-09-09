import type { EnemyDefinition, Point } from '../core/types';

export class Enemy {
  x: number;
  z: number;
  flip = false;
  timer = 0;
  vx = 0;
  vz = 0;
  mode: 'patrol' | 'windup' | 'charge' | 'recover' | 'stunned' = 'patrol';
  constructor(
    readonly definition: EnemyDefinition,
    readonly phase = 0,
  ) {
    this.x = definition.x;
    this.z = definition.z;
  }
  stun(seconds = 2.5): void {
    this.mode = 'stunned';
    this.timer = seconds;
  }
  update(dt: number, time: number, target: Point): void {
    const m = this.definition,
      a = m.arena;
    this.timer = Math.max(0, this.timer - dt);
    if (this.mode === 'stunned') {
      if (!this.timer) this.mode = 'patrol';
      return;
    }
    if (this.mode === 'windup' && !this.timer) {
      this.mode = 'charge';
      this.timer = 0.38;
      const distance = Math.hypot(target.x - this.x, target.z - this.z) || 1;
      this.vx = (target.x - this.x) / distance;
      this.vz = (target.z - this.z) / distance;
    } else if (this.mode === 'charge') {
      this.x += this.vx * 5.4 * dt;
      this.z += this.vz * 5.4 * dt;
      if (!this.timer) {
        this.mode = 'recover';
        this.timer = m.recovery;
      }
    } else if (this.mode === 'recover') {
      if (!this.timer) this.mode = 'patrol';
    } else if (this.mode !== 'windup') {
      this.x = m.x + Math.sin(time * m.speed + this.phase) * m.range;
      if (Math.hypot(target.x - this.x, target.z - this.z) < 3.4) {
        this.mode = 'windup';
        this.timer = m.windup;
      }
    }
    this.x = Math.max(a.x - a.w / 2 + 0.35, Math.min(a.x + a.w / 2 - 0.35, this.x));
    this.z = Math.max(a.z - a.d / 2 + 0.3, Math.min(a.z + a.d / 2 - 0.3, this.z));
    this.flip = target.x < this.x;
  }
}
