import type { Scene } from './Scene';
import type { SceneContext } from './SceneContext';
import { InteractionDirector } from '../gameplay/InteractionDirector';

export class GardenScene implements Scene {
  autoWalk = false;
  readonly interactions: InteractionDirector;
  constructor(private context: SceneContext) {
    this.interactions = new InteractionDirector(context);
  }
  enter(): void {
    this.context.session.mode = 'approach';
  }
  exit(): void {
    this.autoWalk = false;
    this.context.input.clear();
  }
  update(dt: number): void {
    const { session: s, motor, hud, input } = this.context,
      locked = this.interactions.locked;
    motor.integrateJump(s.actor, dt);
    this.interactions.stage(dt);
    let moving = false;
    if (!locked) {
      const direction = input.direction();
      if (direction.x || direction.z) this.autoWalk = false;
      const target = this.autoWalk ? { x: s.companion.x - 1.65, z: s.companion.z } : undefined;
      if (target && Math.hypot(target.x - s.actor.x, target.z - s.actor.z) < 0.09)
        this.autoWalk = false;
      moving = this.context.move(dt, this.autoWalk ? target : undefined);
    }
    s.companion.moving = false;
    for (const p of Object.values(s.positions)) p.turnT = Math.max(0, p.turnT - dt);
    if (s.mode === 'approach') {
      if (s.distance() < 2.35) {
        if (!moving) s.face();
        hud.prompt(s.inventory.available ? hud.flowerHint() : 'Ya regalaste todos los ramos 🌷');
      } else hud.prompt(`Acercate a ${s.partner} · ${s.distance().toFixed(1)} m 💕`);
    }
    this.interactions.update(dt);
    if (s.mode === 'ready' || s.mode === 'done') {
      if (!moving) s.face();
      hud.prompt(
        s.distance() < 2.35
          ? s.mode === 'done'
            ? hud.kissHint(true)
            : hud.kissHint()
          : 'Acercate un poquito más · ' + s.distance().toFixed(1) + ' m',
      );
    }
    hud.travel(s.distance() > 2.35 && !locked);
  }
}
