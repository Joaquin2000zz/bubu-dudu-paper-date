import type { Scene } from './Scene';
import type { SceneContext } from './SceneContext';

export class PlatformScene implements Scene {
  constructor(private context: SceneContext) {}
  enter(): void {
    this.context.session.mode = 'platform';
  }
  exit(): void {
    this.context.input.clear();
  }
  update(dt: number, time: number): void {
    const { session: s, world, motor, hud, audio } = this.context,
      actor = s.actor;
    s.hitCooldown = Math.max(0, s.hitCooldown - dt);
    for (const enemy of s.mobs) enemy.update(dt, time, actor);
    motor.integrateJump(actor, dt);
    this.context.move(dt);
    s.companion.moving = false;
    if (actor.jumpY <= 0 && world.supportAt(actor.x, actor.z) < -100) {
      this.respawn();
      return;
    }
    if (
      s.hitCooldown <= 0 &&
      ((world.hazardAt(actor.x, actor.z) && actor.jumpY < 0.22) ||
        (actor.jumpY < 0.4 &&
          s.mobs.some(
            (m) => m.mode !== 'stunned' && Math.hypot(m.x - actor.x, m.z - actor.z) < 0.88,
          )))
    ) {
      this.respawn();
      return;
    }
    for (const m of s.mobs)
      if (
        m.mode !== 'stunned' &&
        actor.jumpV < 0 &&
        actor.jumpY > 0.4 &&
        actor.jumpY < 0.85 &&
        Math.hypot(m.x - actor.x, m.z - actor.z) < 0.8
      ) {
        m.stun();
        actor.jumpV = 3.2;
        audio.flowerChime();
      }
    const level = world.level();
    for (const f of level.flowers) {
      if (s.inventory.has(f.id) || Math.hypot(actor.x - f.x, actor.z - f.z) >= 0.85) continue;
      const text =
        s.flowers < 2
          ? 'Una flor para vos… me siento un poquito mejor.'
          : 'Otro ramo. ¡Ya falta menos!';
      if (s.inventory.collect(f.id)) {
        s.checkpoint = { x: f.x, z: f.z };
        this.context.say(actor.name, text);
        hud.toast(`🌷 RAMO ${s.flowers}`, 800);
        audio.flowerChime();
      }
    }
    const count = level.flowers.filter((f) => s.inventory.has(f.id)).length;
    if (
      Math.hypot(actor.x - level.goal.x, actor.z - level.goal.z) < 1.35 &&
      count === level.flowers.length
    ) {
      if (s.mode !== 'exit') hud.prompt('¡Nivel superado! El siguiente camino te espera.', true);
      s.mode = 'exit';
      hud.travel(true);
    } else {
      s.mode = 'platform';
      hud.travel(false);
      hud.prompt(
        count === level.flowers.length
          ? '¡Tenés los tres ramos! Llegá a la bandera.'
          : 'Juntá los tres ramos · saltá entre islas · esquivá a los enemigos',
      );
    }
  }
  private respawn(): void {
    const { session: s, world, hud } = this.context,
      checkpoint = s.checkpoint || world.level().start;
    Object.assign(s.actor, { x: checkpoint.x, z: checkpoint.z, jumpY: 0, jumpV: 0 });
    s.actor.moving = false;
    s.hitCooldown = 1.4;
    hud.toast(
      s.checkpoint ? 'De vuelta al último ramo' : 'Intentá de nuevo · esperá el momento',
      1300,
    );
  }
}
