import type { CharacterName, GameMode, Point } from '../core/types';
import { Character } from '../actors/Character';
import { Enemy } from '../actors/Enemy';
import { BouquetInventory } from './BouquetInventory';

export class GameSession {
  readonly inventory = new BouquetInventory();
  readonly positions = {
    Bubu: new Character('Bubu', { x: -1.3, z: -5.8 }),
    Dudu: new Character('Dudu', { x: 1.3, z: -5.8 }),
  };
  chosen: CharacterName | '' = '';
  player: CharacterName | null = null;
  partner: CharacterName | null = null;
  mode: GameMode = 'menu';
  kisses = 0;
  eventT = 0;
  music = true;
  level = 1;
  hitCooldown = 0;
  theme: 'night' | 'dawn' | 'joy' = 'joy';
  chapterIndex = 1;
  totalLevels = 3;
  dedication = '';
  checkpoint: Point | null = null;
  giftSpots: Point[] = [];
  mobs: Enemy[] = [];
  get flowers(): number {
    return this.inventory.total;
  }
  get gifted(): number {
    return this.inventory.gifted;
  }
  get collected(): string[] {
    return this.inventory.collected;
  }
  get actor(): Character {
    if (!this.player) throw Error('No active player');
    return this.positions[this.player];
  }
  get companion(): Character {
    if (!this.partner) throw Error('No active partner');
    return this.positions[this.partner];
  }
  start(name: CharacterName, dedication: string): void {
    this.inventory.reset();
    this.chosen = this.player = name;
    this.partner = name === 'Bubu' ? 'Dudu' : 'Bubu';
    this.dedication = dedication;
    this.kisses = 0;
    this.eventT = 0;
  }
  distance(): number {
    return Math.hypot(this.actor.x - this.companion.x, this.actor.z - this.companion.z);
  }
  face(): void {
    if (!this.player || !this.partner) return;
    for (const [a, b] of [
      [this.actor, this.companion],
      [this.companion, this.actor],
    ]) {
      const angle = Math.atan2(b.x - a.x, b.z - a.z);
      if (Math.sin(a.heading) * Math.sin(angle) < -0.2) a.turnT = 0.18;
      a.heading = angle;
    }
  }
}
