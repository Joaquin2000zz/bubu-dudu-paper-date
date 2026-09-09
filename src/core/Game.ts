import { LEVELS, CAMPAIGN } from '../content/levels';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { CharacterMotor } from '../actors/CharacterMotor';
import { Enemy } from '../actors/Enemy';
import { GameSession } from '../gameplay/GameSession';
import { InputManager, type InputAction } from '../input/InputManager';
import { AudioManager } from '../presentation/AudioManager';
import { HudView } from '../presentation/HudView';
import { PaperRenderer } from '../presentation/PaperRenderer';
import { SceneManager } from '../scenes/Scene';
import { PlatformScene } from '../scenes/PlatformScene';
import { GardenScene } from '../scenes/GardenScene';
import type { SceneContext } from '../scenes/SceneContext';
import { GameLoop } from './GameLoop';
import { Lifetime } from './Lifetime';
import type { CharacterName } from './types';

export class Game implements SceneContext {
  readonly session = new GameSession();
  readonly world = new PhysicsWorld(LEVELS, CAMPAIGN[CAMPAIGN.length - 1]);
  readonly motor = new CharacterMotor(this.world);
  readonly audio = new AudioManager(this.session);
  readonly hud: HudView;
  readonly renderer: PaperRenderer;
  readonly input: InputManager;
  private readonly scenes = new SceneManager();
  private readonly life = new Lifetime();
  private readonly loop: GameLoop;
  private garden: GardenScene | null = null;
  private ready = false;
  private disposed = false;
  constructor(root: HTMLElement) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.hud = new HudView(root, reduced);
    this.renderer = new PaperRenderer(
      this.hud.get<HTMLCanvasElement>('#scene3d'),
      this.hud.get('#defs'),
      reduced,
      this.world,
    );
    this.input = new InputManager(
      root,
      this.action,
      () => this.session.mode !== 'menu',
      () => {
        if (this.garden) this.garden.autoWalk = false;
      },
    );
    const bind = (selector: string, fn: () => void) =>
      this.life.listen(this.hud.get(selector), 'click', fn);
    bind('#chooseBubu', () => this.start('Bubu'));
    bind('#chooseDudu', () => this.start('Dudu'));
    bind('#menuButton', this.menu);
    bind('#music', () => {
      this.session.music = !this.session.music;
      this.hud.get('#music').textContent =
        `♫ Sonido: ${this.session.music ? 'activado' : 'silenciado'}`;
      this.hud.get('#music').setAttribute('aria-pressed', String(this.session.music));
      if (this.session.music) this.audio.startMusic();
    });
    bind('#travel', () => {
      if (this.garden) this.garden.autoWalk = true;
      else if (this.session.mode === 'exit') this.advanceLevel();
    });
    this.loop = new GameLoop((dt, time) => {
      if (!this.ready) return;
      if (this.session.player) {
        this.session.eventT += dt;
        this.scenes.update(dt, time);
        this.hud.status(this.session, this.world.level());
      }
      this.renderer.render(dt, time, this.session);
      this.hud.update(dt, this.session, this.renderer);
    });
    this.renderer.loaded
      .then(() => {
        if (this.disposed) return;
        this.ready = true;
        this.hud.get('#renderStatus').hidden = true;
        this.hud.get<HTMLButtonElement>('#chooseBubu').disabled = false;
        this.hud.get<HTMLButtonElement>('#chooseDudu').disabled = false;
      })
      .catch((error) => {
        this.hud.get('#renderStatus').textContent = String(error);
        console.error(error);
      });
    this.loop.start();
  }
  start = (name: CharacterName): void => {
    if (!this.ready) return;
    this.input.clear();
    (document.activeElement as HTMLElement)?.blur();
    this.session.start(
      name,
      this.hud.get<HTMLInputElement>('#dedication').value.trim() ||
        'Para Bettina, con todo mi amor 💗',
    );
    this.loadLevel(CAMPAIGN[0]);
    this.audio.startMusic();
  };
  reset = (): void => {
    if (this.session.chosen) this.start(this.session.chosen);
    else this.menu();
  };
  menu = (): void => {
    this.scenes.dispose();
    this.garden = null;
    this.input.clear();
    this.world.setLevel(CAMPAIGN[CAMPAIGN.length - 1]);
    const s = this.session;
    s.mode = 'menu';
    s.player = s.partner = null;
    for (const actor of Object.values(s.positions)) actor.resetMotion();
    Object.assign(s.positions.Bubu, { x: -1.3, z: -5.8, flip: false });
    Object.assign(s.positions.Dudu, { x: 1.3, z: -5.8, flip: true });
    this.hud.showMenu();
  };
  loadLevel = (id: number): void => {
    const s = this.session;
    if (!s.player) return;
    const level = this.world.level(id); // Validate before touching the active scene.
    this.scenes.dispose();
    this.input.clear();
    this.world.setLevel(id);
    s.level = id;
    s.eventT = 0;
    s.hitCooldown = 0;
    s.checkpoint = null;
    s.giftSpots = level.giftSpots || [];
    s.theme = level.theme;
    s.chapterIndex = CAMPAIGN.indexOf(id) + 1;
    s.totalLevels = CAMPAIGN.length;
    s.mobs = level.mobs.map((definition, i) => new Enemy(definition, i * 0.9));
    Object.assign(s.actor, level.start, { flip: false });
    Object.assign(s.companion, level.goal, { flip: true });
    for (const actor of Object.values(s.positions)) actor.resetMotion();
    this.hud.showLevel(level, s);
    this.garden = level.kind === 'garden' ? new GardenScene(this) : null;
    this.scenes.change(this.garden || new PlatformScene(this));
    this.say(s.actor.name, level.intro.replace('{partner}', s.companion.name));
  };
  say = (name: CharacterName, text: string, kind = 'talk'): void => {
    this.hud.say(name, text);
    this.audio.babble(name, kind);
  };
  jump = (): void => {
    if (
      this.session.player &&
      ['platform', 'approach', 'ready', 'done'].includes(this.session.mode)
    )
      this.motor.jump(this.session.actor);
  };
  giveFlowers = (): void => {
    if (this.garden?.interactions.giveFlowers()) this.garden.autoWalk = false;
  };
  kiss = (): void => {
    if (this.garden?.interactions.kiss()) this.garden.autoWalk = false;
  };
  debugNear = (): void => {
    if (!this.session.player) return;
    const s = this.session;
    s.actor.x = s.companion.x - 1.55;
    s.actor.z = s.companion.z + 0.18;
    s.face();
  };
  move(dt: number, autoTarget?: { x: number; z: number }): boolean {
    const actor = this.session.actor;
    let direction = this.input.direction();
    if (autoTarget) {
      const x = autoTarget.x - actor.x,
        z = autoTarget.z - actor.z,
        length = Math.hypot(x, z) || 1;
      direction = { x: x / length, z: z / length };
    } else direction = CharacterMotor.cameraDirection(direction.x, direction.z, this.renderer.yaw);
    const moving = this.motor.move(actor, direction.x, direction.z, dt);
    if (moving) {
      actor.walkTime += dt;
      const heading = Math.atan2(direction.x, direction.z);
      if (Math.sin(actor.heading) * Math.sin(heading) < -0.2) actor.turnT = 0.18;
      actor.heading = heading;
      if (Math.abs(direction.x) > 0.05) actor.flip = direction.x < 0;
    }
    return moving;
  }
  private advanceLevel(): void {
    const level = this.world.level(),
      count = level.flowers.filter((f) => this.session.inventory.has(f.id)).length;
    if (count < level.flowers.length) {
      this.hud.prompt(
        `Todavía faltan ${level.flowers.length - count} ramos en este nivel 🌷`,
        true,
      );
      return;
    }
    const next = CAMPAIGN[CAMPAIGN.indexOf(level.id) + 1];
    if (next) {
      this.loadLevel(next);
      this.hud.hearts(this.session, this.renderer, 12);
    }
  }
  private action = (action: InputAction): void => {
    switch (action) {
      case 'jump':
        this.jump();
        break;
      case 'kiss':
        this.kiss();
        break;
      case 'flowers':
        this.giveFlowers();
        break;
      case 'reset':
        this.reset();
        break;
      case 'menu':
        this.menu();
        break;
      case 'cameraLeft':
        this.renderer.rotate(-0.28);
        break;
      case 'cameraRight':
        this.renderer.rotate(0.28);
        break;
    }
  };
  dispose(): void {
    this.disposed = true;
    this.ready = false;
    this.loop.stop();
    this.scenes.dispose();
    this.input.dispose();
    this.life.dispose();
    this.audio.dispose();
    this.hud.dispose();
    this.renderer.dispose();
  }
}
