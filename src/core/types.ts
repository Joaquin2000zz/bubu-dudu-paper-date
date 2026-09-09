export type CharacterName = 'Bubu' | 'Dudu';
export type GameMode =
  'menu' | 'platform' | 'exit' | 'approach' | 'flowers' | 'ready' | 'kiss' | 'done';
export interface Point {
  x: number;
  z: number;
}
export interface ActorBody extends Point {
  y?: number;
  flip: boolean;
  bob: number;
  heading: number;
  walkTime: number;
  turnT: number;
  moving: boolean;
  jumpY: number;
  jumpV: number;
  jumpBase?: number;
}
export interface Floor extends Point {
  id: string;
  y: number;
  w: number;
  h: number;
  d: number;
  color: string;
  top: number;
}
export interface Bouquet extends Point {
  id: string;
}
export interface EnemyDefinition extends Point {
  id: string;
  range: number;
  speed: number;
  arena: Floor;
  windup: number;
  recovery: number;
  axis?: string;
}
export interface LevelDefinition {
  id: number;
  kind: 'platform' | 'garden';
  name: string;
  chapter: string;
  theme: 'night' | 'dawn' | 'joy';
  intro: string;
  start: Point;
  goal: Point;
  floors: Floor[];
  flowers: Bouquet[];
  mobs: EnemyDefinition[];
  giftSpots?: Point[];
}
export interface WorldGeometry {
  supportAt(x: number, z: number): number;
  heightAt(x: number, z: number): number;
  move(body: ActorBody, x: number, z: number): Point & { y: number };
  hazardAt(x: number, z: number): unknown;
}
