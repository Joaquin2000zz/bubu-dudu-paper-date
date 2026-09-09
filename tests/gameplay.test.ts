import { describe, expect, test } from 'vitest';
import { Character } from '../src/actors/Character';
import { CharacterMotor } from '../src/actors/CharacterMotor';
import { Enemy } from '../src/actors/Enemy';
import { BouquetInventory } from '../src/gameplay/BouquetInventory';
import { GameSession } from '../src/gameplay/GameSession';
import { PhysicsWorld } from '../src/physics/PhysicsWorld';
import { LEVELS } from '../src/content/levels';
import { validateCampaign } from '../src/content/validateCampaign';
import { SceneManager, type Scene } from '../src/scenes/Scene';

test('additional platform content is registered without changing scene or physics code', () => {
  const extra = structuredClone(LEVELS[2]);
  extra.id = 4;
  extra.flowers.forEach((flower, i) => (flower.id = `l4-flower-${i}`));
  const levels = { ...LEVELS, 4: extra };
  expect(() => validateCampaign(levels, [1, 2, 4, 3])).not.toThrow();
  const world = new PhysicsWorld(levels, 4);
  expect(Number.isFinite(world.supportAt(extra.start.x, extra.start.z))).toBe(true);
  extra.flowers[0].id = LEVELS[1].flowers[0].id;
  expect(() => validateCampaign(levels, [1, 2, 4, 3])).toThrow(/duplicado/);
});

describe('inventory across chapters', () => {
  test('duplicate contacts cannot create bouquets and gifts cannot exceed the inventory', () => {
    const inventory = new BouquetInventory();
    expect(inventory.collect('first')).toBe(true);
    expect(inventory.collect('first')).toBe(false);
    expect(inventory.total).toBe(1);
    expect(inventory.give()).toBe(true);
    expect(inventory.give()).toBe(false);
    expect(inventory.available).toBe(0);
    expect(inventory.total).toBe(1);
    inventory.collect('second');
    expect(inventory.available).toBe(1);
  });
  test('switching chapters preserves inventory, starting a new run clears it', () => {
    const s = new GameSession();
    s.start('Bubu', 'Para Bettina');
    s.inventory.collect('l1');
    s.level = 2;
    expect(s.flowers).toBe(1);
    expect(s.partner).toBe('Dudu');
    s.start('Dudu', 'Para Bettina');
    expect(s.flowers).toBe(0);
    expect(s.partner).toBe('Bubu');
  });
});
describe('shared character motor', () => {
  for (const id of [1, 2, 3])
    test(`level ${id}: jump and move simultaneously, then land`, () => {
      const world = new PhysicsWorld(LEVELS, id),
        motor = new CharacterMotor(world),
        actor = new Character('Dudu', world.level().start);
      const x = actor.x;
      expect(motor.jump(actor)).toBe(true);
      expect(motor.jump(actor)).toBe(false);
      for (let i = 0; i < 10; i++) {
        motor.integrateJump(actor, 1 / 60);
        motor.move(actor, 0.4, 0, 1 / 60);
      }
      expect(actor.x).toBeGreaterThan(x);
      expect(actor.jumpY).toBeGreaterThan(0.1);
      for (let i = 0; i < 60; i++) motor.integrateJump(actor, 1 / 60);
      expect(actor.jumpY).toBe(0);
      expect(actor.jumpV).toBe(0);
      expect(motor.jump(actor)).toBe(true);
    });
  test('camera rotation changes world direction without changing speed', () => {
    const d = CharacterMotor.cameraDirection(0, 1, Math.PI / 2);
    expect(d.x).toBeCloseTo(1);
    expect(d.z).toBeCloseTo(0);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
  });
  test('every authored crossing uses the production jump integrator', () => {
    for (const id of [1, 2]) {
      const world = new PhysicsWorld(LEVELS, id),
        motor = new CharacterMotor(world);
      for (let i = 1; i < world.floors.length; i++) {
        const a = world.floors[i - 1],
          b = world.floors[i];
        const lo = Math.max(a.x - a.w / 2 + 0.3, b.x - b.w / 2 + 0.3),
          hi = Math.min(a.x + a.w / 2 - 0.3, b.x + b.w / 2 - 0.3);
        const actor = new Character('Bubu', { x: (lo + hi) / 2, z: a.z - a.d / 2 + 0.15 });
        motor.jump(actor);
        for (let frame = 0; frame < 100; frame++) {
          motor.integrateJump(actor, 1 / 120);
          if (!actor.jumpY) break;
          motor.move(actor, 0, Math.max(-1, (b.z - actor.z) / (motor.speed / 120)), 1 / 120);
        }
        expect(Math.abs(actor.z - b.z)).toBeLessThan(0.2);
        expect(Number.isFinite(world.supportAt(actor.x, actor.z))).toBe(true);
      }
    }
  });
});
test('enemy commits to the announced direction and respects recovery and stun', () => {
  const enemy = new Enemy(LEVELS[1].mobs[0]);
  const target = { x: enemy.x + 1, z: enemy.z };
  enemy.update(0.01, 0, target);
  expect(enemy.mode).toBe('windup');
  enemy.update(enemy.definition.windup, 0, target);
  expect(enemy.mode).toBe('charge');
  const vx = enemy.vx;
  enemy.update(0.1, 0.1, { x: enemy.x - 2, z: enemy.z });
  expect(enemy.vx).toBe(vx);
  enemy.update(0.4, 0.5, target);
  expect(enemy.mode).toBe('recover');
  enemy.stun();
  const x = enemy.x;
  enemy.update(0.2, 0.7, target);
  expect(enemy.x).toBe(x);
  expect(enemy.mode).toBe('stunned');
});
test('scene changes release the previous scene before entering the next', () => {
  const calls: string[] = [];
  const scene = (name: string): Scene => ({
    enter: () => calls.push(name + ' enter'),
    exit: () => calls.push(name + ' exit'),
    update: () => calls.push(name + ' update'),
  });
  const manager = new SceneManager();
  manager.change(scene('platform'));
  manager.update(0.01, 0);
  manager.change(scene('garden'));
  manager.dispose();
  manager.update(0.01, 0);
  expect(calls).toEqual([
    'platform enter',
    'platform update',
    'platform exit',
    'garden enter',
    'garden exit',
  ]);
});
test('physics instances do not leak their active chapter into other games', () => {
  const a = new PhysicsWorld(LEVELS, 1),
    b = new PhysicsWorld(LEVELS, 3);
  expect(a.supportAt(7, 3)).toBe(-Infinity);
  expect(Number.isFinite(b.supportAt(7, 3))).toBe(true);
  expect(() => a.setLevel(999)).toThrow();
  expect(a.activeId).toBe(1);
  expect(b.activeId).toBe(3);
});
