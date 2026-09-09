import type { ActorBody, CharacterName, Point } from '../core/types';

export class Character implements ActorBody {
  x: number;
  z: number;
  flip = false;
  bob = 0;
  heading = 0;
  walkTime = 0;
  turnT = 0;
  moving = false;
  jumpY = 0;
  jumpV = 0;
  jumpBase?: number;
  constructor(
    readonly name: CharacterName,
    position: Point,
  ) {
    this.x = position.x;
    this.z = position.z;
  }
  resetMotion(): void {
    this.moving = false;
    this.walkTime = 0;
    this.turnT = 0;
    this.heading = 0;
    this.jumpY = 0;
    this.jumpV = 0;
    this.jumpBase = undefined;
  }
}
