export interface Scene {
  enter(): void;
  update(dt: number, time: number): void;
  exit(): void;
}
export class SceneManager {
  private active: Scene | null = null;
  change(scene: Scene): void {
    this.active?.exit();
    this.active = scene;
    scene.enter();
  }
  update(dt: number, time: number): void {
    this.active?.update(dt, time);
  }
  dispose(): void {
    this.active?.exit();
    this.active = null;
  }
}
