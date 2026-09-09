import type { ActorBody, WorldGeometry } from '../core/types';

/** Shared by the platform chapters and garden. World-space units and seconds. */
export class CharacterMotor {
  constructor(
    private readonly world: WorldGeometry,
    readonly speed = 3.7,
  ) {}
  jump(actor: ActorBody): boolean {
    if (actor.jumpY > 0.02) return false;
    actor.jumpBase = this.world.supportAt(actor.x, actor.z);
    actor.jumpV = 5;
    actor.jumpY = 0.03;
    return true;
  }
  integrateJump(actor: ActorBody, dt: number): void {
    if (actor.jumpY <= 0 && actor.jumpV <= 0) return;
    actor.jumpY += actor.jumpV * dt;
    actor.jumpV -= 13.5 * dt;
    if (actor.jumpY <= 0) {
      actor.jumpY = 0;
      actor.jumpV = 0;
    }
  }
  move(actor: ActorBody, x: number, z: number, dt: number): boolean {
    const previousX = actor.x,
      previousZ = actor.z;
    const nx = Math.max(-8.5, Math.min(8.5, actor.x + x * this.speed * dt));
    const nz = Math.max(-8.5, Math.min(8.1, actor.z + z * this.speed * dt));
    Object.assign(actor, this.world.move(actor, nx, nz));
    actor.moving = Math.hypot(actor.x - previousX, actor.z - previousZ) > 0.0001;
    return actor.moving;
  }
  static cameraDirection(x: number, z: number, yaw: number) {
    return { x: x * Math.cos(yaw) + z * Math.sin(yaw), z: -x * Math.sin(yaw) + z * Math.cos(yaw) };
  }
}
