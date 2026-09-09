import type { SceneContext } from '../scenes/SceneContext';

/** Owns the shared staging and timing of the two-character sequences. */
export class InteractionDirector {
  constructor(private context: SceneContext) {}
  get locked(): boolean {
    return ['flowers', 'kiss'].includes(this.context.session.mode);
  }
  giveFlowers(): boolean {
    const { session: s, hud, audio, input, renderer } = this.context;
    if (
      !s.player ||
      this.context.world.level().kind !== 'garden' ||
      s.distance() > 2.35 ||
      !['approach', 'ready', 'done'].includes(s.mode) ||
      s.actor.jumpY > 0
    )
      return false;
    if (!s.inventory.give()) {
      hud.prompt('Primero juntá ramos en los niveles anteriores 🌷', true);
      return false;
    }
    input.clear();
    this.context.say(s.actor.name, 'Estas flores son para vos.');
    s.mode = 'flowers';
    s.eventT = 0;
    s.face();
    hud.quest('flowers');
    hud.prompt('Entregando el ramo… 🌷', true);
    hud.hearts(s, renderer, 10);
    audio.flowerChime();
    return true;
  }
  kiss(): boolean {
    const { session: s, hud, audio, input, renderer } = this.context;
    if (
      !s.player ||
      !['ready', 'done'].includes(s.mode) ||
      s.distance() > 2.35 ||
      s.actor.jumpY > 0
    )
      return false;
    input.clear();
    this.context.say(s.companion.name, 'Vení… te extrañé mucho.');
    s.mode = 'kiss';
    s.eventT = 0;
    s.kisses++;
    s.face();
    hud.quest('kiss');
    hud.prompt('💋 ¡Muá!', true);
    hud.hearts(s, renderer, 30);
    audio.kissChime();
    hud.toast(s.kisses === 1 ? '💗 PRIMER BESO 💗' : `💗 ${s.kisses} BESOS 💗`);
    return true;
  }
  stage(dt: number): void {
    if (!this.locked) return;
    const { session: s, renderer } = this.context,
      yaw = renderer.yaw,
      half = s.mode === 'kiss' ? 1.025 : 1.1;
    const q = s.eventT > 0.55 ? 1 : 1 - Math.exp(-dt * 10);
    for (const [actor, side] of [
      [s.actor, -1],
      [s.companion, 1],
    ] as const) {
      const x = side * half * Math.cos(yaw),
        z = -6.55 - side * half * Math.sin(yaw);
      actor.x += (x - actor.x) * q;
      actor.z += (z - actor.z) * q;
      actor.jumpY = actor.jumpV = 0;
      actor.moving = false;
    }
  }
  update(dt: number): void {
    const { session: s, hud } = this.context;
    if (s.mode === 'flowers') {
      if (s.eventT > 1.4 && s.eventT - dt <= 1.4)
        this.context.say(s.companion.name, '¡Son hermosas! Gracias, mi amor.');
      s.face();
      if (s.eventT > 3.1) {
        s.mode = 'ready';
        s.eventT = 0;
        hud.quest('kiss');
        hud.prompt(hud.kissHint(), true);
      }
    } else if (s.mode === 'kiss') {
      if (s.eventT > 1.5 && s.eventT - dt <= 1.5)
        this.context.say(s.actor.name, '¡Muá! Te quiero mucho.', 'kiss');
      s.face();
      if (s.eventT > 2.8) {
        s.mode = 'done';
        s.eventT = 0;
        hud
          .get('#quest')
          .querySelectorAll('.q')
          .forEach((q) => (q.className = 'q done'));
        hud.prompt(`${s.dedication} · ${s.kisses} ${s.kisses === 1 ? 'beso' : 'besos'} 💗`, true);
      }
    }
  }
}
