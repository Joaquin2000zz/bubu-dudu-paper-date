import type { GameSession } from '../gameplay/GameSession';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { CharacterMotor } from '../actors/CharacterMotor';
import type { InputManager } from '../input/InputManager';
import type { HudView } from '../presentation/HudView';
import type { AudioManager } from '../presentation/AudioManager';
import type { GameRenderer } from '../presentation/GameRenderer';
import type { CharacterName } from '../core/types';

export interface SceneContext {
  session: GameSession;
  world: PhysicsWorld;
  motor: CharacterMotor;
  input: InputManager;
  hud: HudView;
  audio: AudioManager;
  renderer: GameRenderer;
  say(name: CharacterName, text: string, kind?: string): void;
  move(dt: number, autoTarget?: { x: number; z: number }): boolean;
}
