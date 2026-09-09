import type { ActorBody, Floor, LevelDefinition, WorldGeometry } from '../core/types';

export interface CollisionLevel extends LevelDefinition {
  gaps: Array<{ id: string; x: number; z: number; w: number; d: number }>;
  obstacles: Array<{
    id: string;
    x: number;
    z: number;
    w: number;
    d: number;
    y: number;
    h: number;
    color: string;
    kind: string;
  }>;
  hazards: Array<{ id: string; x: number; z: number; w: number; d: number }>;
  route?: number[][];
}
export class PhysicsWorld implements WorldGeometry {
  readonly radius = 0.24;
  readonly maxStep = 0.23;
  private current: CollisionLevel;
  constructor(
    readonly levels: Record<number, CollisionLevel>,
    initialLevel = 3,
  ) {
    this.current = this.level(initialLevel);
  }
  get activeId(): number {
    return this.current.id;
  }
  get floors(): Floor[] {
    return this.current.floors;
  }
  level(id = this.activeId): CollisionLevel {
    const level = this.levels[id];
    if (!level) throw Error(`Nivel inexistente: ${id}`);
    return level;
  }
  setLevel(id: number): CollisionLevel {
    this.current = this.level(id);
    return this.current;
  }
  heightAt(x: number, z: number): number {
    let height = -Infinity;
    const inGap =
      this.current.kind !== 'garden' &&
      this.current.gaps.some((g) => Math.abs(x - g.x) <= g.w / 2 && Math.abs(z - g.z) <= g.d / 2);
    for (const f of this.floors)
      if (
        !(inGap && f.id.endsWith('-ground')) &&
        Math.abs(x - f.x) <= f.w / 2 + 1e-8 &&
        Math.abs(z - f.z) <= f.d / 2 + 1e-8
      )
        height = Math.max(height, f.top);
    if (this.current.kind === 'garden' && Math.abs(x + 5) <= 0.725 && Math.abs(z) <= 2.18) {
      const i = Math.max(0, Math.min(10, Math.round((z + 2) / 0.4)));
      const plank = this.floors.find((f) => f.id === 'bridge' + i);
      if (plank) height = Math.max(height, plank.top);
    }
    return height;
  }
  supportAt(x: number, z: number): number {
    const r = this.radius;
    return Math.max(
      this.heightAt(x, z),
      this.heightAt(x - r, z),
      this.heightAt(x + r, z),
      this.heightAt(x, z - r),
      this.heightAt(x, z + r),
    );
  }
  private rect(x: number, z: number, cx: number, cz: number, w: number, d: number): boolean {
    return Math.abs(x - cx) < w / 2 + this.radius && Math.abs(z - cz) < d / 2 + this.radius;
  }
  blocked(x: number, z: number): boolean {
    if (Math.abs(x) > 8.5 || z < -9.5 || z > 8.1) return true;
    if (this.current.kind !== 'garden')
      return this.current.obstacles.some((o) => this.rect(x, z, o.x, o.z, o.w, o.d));
    if (((x + 5) / 2.85) ** 2 + (z / 2.15) ** 2 < 1 && Math.abs(x + 5) > 0.48) return true;
    for (const tx of [-3.1, 3.1])
      for (const tz of [-6.6, -9]) if (this.rect(x, z, tx, tz, 0.6, 0.6)) return true;
    if (this.rect(x, z, 0, -8.4, 4.3, 1)) return true;
    for (const side of [-1, 1]) if (this.rect(x, z, side * 6.4, -4.1, 4.2, 0.2)) return true;
    for (const rail of [-5.8, -4.2]) if (this.rect(x, z, rail, 0, 0.14, 4.2)) return true;
    return false;
  }
  hazardAt(x: number, z: number) {
    return this.current.kind === 'garden'
      ? null
      : this.current.hazards.find((h) => this.rect(x, z, h.x, h.z, h.w, h.d)) || null;
  }
  private canMove(x: number, z: number, nx: number, nz: number, jumping: boolean): boolean {
    if (Math.abs(nx) > 8.5 || nz < -9.5 || nz > 8.1) return false;
    if (jumping) {
      const from = this.supportAt(x, z),
        to = this.supportAt(nx, nz);
      if (from === -Infinity || to === -Infinity) return true;
      return Math.abs(to - from) <= 1.25;
    }
    return (
      !this.blocked(nx, nz) &&
      Math.abs(this.supportAt(nx, nz) - this.supportAt(x, z)) <= this.maxStep + 1e-8
    );
  }
  move(position: Pick<ActorBody, 'x' | 'z'> & Partial<ActorBody>, nx: number, nz: number) {
    let { x, z } = position;
    const count = Math.max(1, Math.ceil(Math.hypot(nx - x, nz - z) / 0.06)),
      dx = (nx - x) / count,
      dz = (nz - z) / count;
    const jumping = (position.jumpY || 0) > 0.04;
    for (let i = 0; i < count; i++) {
      if (this.canMove(x, z, x + dx, z + dz, jumping)) {
        x += dx;
        z += dz;
      } else {
        if (this.canMove(x, z, x + dx, z, jumping)) x += dx;
        if (this.canMove(x, z, x, z + dz, jumping)) z += dz;
      }
    }
    return { x, z, y: this.supportAt(x, z) };
  }
}
