import { Lifetime } from '../core/Lifetime';
import { VirtualJoystick } from './VirtualJoystick';

export type InputAction =
  'jump' | 'kiss' | 'flowers' | 'reset' | 'menu' | 'cameraLeft' | 'cameraRight';
export class InputManager {
  readonly keys = new Set<string>();
  readonly joystick: VirtualJoystick;
  private life = new Lifetime();
  constructor(
    root: HTMLElement,
    private action: (action: InputAction) => void,
    private enabled: () => boolean,
    cancel: () => void,
  ) {
    this.joystick = new VirtualJoystick(
      root.querySelector('#joystick')!,
      root.querySelector('#joystickKnob')!,
    );
    this.life.listen(
      window,
      'keydown',
      (event) => {
        const e = event as KeyboardEvent;
        if ((e.target as Element)?.matches?.('input,textarea,[contenteditable=true]')) return;
        const key = e.key.toLowerCase();
        if (
          [
            'arrowup',
            'arrowdown',
            'arrowleft',
            'arrowright',
            ' ',
            'e',
            'r',
            'j',
            'x',
            'escape',
          ].includes(key)
        )
          e.preventDefault();
        if (!enabled() && key !== 'escape') return;
        const bindings: Record<string, InputAction> = {
          q: 'cameraLeft',
          c: 'cameraRight',
          escape: 'menu',
          r: 'reset',
          e: 'flowers',
          ' ': 'kiss',
          j: 'jump',
          x: 'jump',
        };
        this.keys.add(key);
        if (bindings[key] && !e.repeat) action(bindings[key]);
      },
      { passive: false },
    );
    this.life.listen(window, 'keyup', (event) =>
      this.keys.delete((event as KeyboardEvent).key.toLowerCase()),
    );
    this.life.listen(window, 'blur', () => {
      this.clear();
      cancel();
    });
    this.life.listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        this.clear();
        cancel();
      }
    });
    for (const name of ['selectstart', 'dragstart'])
      this.life.listen(
        document,
        name,
        (e) => {
          if (!(e.target as Element)?.matches?.('input,textarea,[contenteditable=true]'))
            e.preventDefault();
        },
        { passive: false },
      );
    for (const name of ['contextmenu', 'dblclick'])
      this.life.listen(
        document,
        name,
        (e) => {
          if ((e.target as Element)?.closest?.('#mobile,#cameraControls,#scene3d'))
            e.preventDefault();
        },
        { passive: false },
      );
    for (const name of ['gesturestart', 'gesturechange', 'gestureend'])
      this.life.listen(document, name, (e) => e.preventDefault(), { passive: false });
    for (const name of ['flowers', 'kiss', 'jump'] as const)
      this.bind(root.querySelector(`[data-action="${name}"]`)!, name);
    this.bind(root.querySelector('#cameraLeft')!, 'cameraLeft');
    this.bind(root.querySelector('#cameraRight')!, 'cameraRight');
  }
  private bind(button: HTMLElement, action: InputAction): void {
    let touchedAt = -Infinity;
    this.life.listen(
      button,
      'pointerdown',
      (event) => {
        const e = event as PointerEvent;
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        touchedAt = performance.now();
        try {
          button.setPointerCapture(e.pointerId);
        } catch {
          /* no capture */
        }
        this.action(action);
      },
      { passive: false },
    );
    this.life.listen(button, 'click', (e) => {
      if (performance.now() - touchedAt < 600) {
        e.preventDefault();
        return;
      }
      this.action(action);
    });
  }
  direction(): { x: number; z: number } {
    const a = this.joystick.axis;
    if (Math.hypot(a.x, a.y) > 0.04) return { x: a.x, z: a.y };
    const x =
      Number(this.keys.has('d') || this.keys.has('arrowright')) -
      Number(this.keys.has('a') || this.keys.has('arrowleft'));
    const z =
      Number(this.keys.has('s') || this.keys.has('arrowdown')) -
      Number(this.keys.has('w') || this.keys.has('arrowup'));
    const length = Math.hypot(x, z) || 1;
    return { x: x / length, z: z / length };
  }
  clear(): void {
    this.keys.clear();
    this.joystick.release();
  }
  dispose(): void {
    this.clear();
    this.life.dispose();
    this.joystick.dispose();
  }
}
