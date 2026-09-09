import { Lifetime } from '../core/Lifetime';

export class VirtualJoystick {
  readonly axis = { x: 0, y: 0 };
  private pointer: number | null = null;
  private touch: number | null = null;
  private life = new Lifetime();
  constructor(
    private element: HTMLElement,
    private knob: HTMLElement,
  ) {
    const on = (target: EventTarget, type: string, fn: (e: Event) => void, options = {}) =>
      this.life.listen(target, type, fn, options);
    on(
      element,
      'pointerdown',
      (event) => {
        const e = event as PointerEvent;
        e.preventDefault();
        this.release();
        this.pointer = e.pointerId;
        this.update(e);
        try {
          element.setPointerCapture(e.pointerId);
        } catch {
          /* capture unsupported */
        }
      },
      { passive: false },
    );
    on(
      document,
      'pointermove',
      (event) => {
        const e = event as PointerEvent;
        if (e.pointerId !== this.pointer) return;
        if (e.pointerType !== 'touch' && !e.buttons) {
          this.release();
          return;
        }
        e.preventDefault();
        this.update(e);
      },
      { capture: true, passive: false },
    );
    for (const name of ['pointerup', 'pointercancel'])
      on(
        window,
        name,
        (e) => {
          if ((e as PointerEvent).pointerId === this.pointer) this.release();
        },
        { capture: true },
      );
    on(element, 'lostpointercapture', (e) => {
      if ((e as PointerEvent).pointerId === this.pointer) this.release();
    });
    for (const name of ['pagehide', 'pageshow', 'resize', 'orientationchange', 'blur'])
      on(window, name, this.release);
    on(document, 'visibilitychange', () => {
      if (document.hidden) this.release();
    });
    if (window.PointerEvent) {
      on(
        document,
        'touchstart',
        (event) => {
          const e = event as TouchEvent;
          if (this.pointer !== null && (e.target as Element).closest('#joystick'))
            this.touch = e.changedTouches[0]?.identifier ?? null;
        },
        { capture: true, passive: true },
      );
      for (const name of ['touchmove', 'touchend', 'touchcancel'])
        on(
          window,
          name,
          (event) => {
            const e = event as TouchEvent;
            if (
              this.pointer !== null &&
              (!e.touches.length || (this.touch !== null && !this.find(e.touches, this.touch)))
            )
              this.release();
          },
          { capture: true, passive: true },
        );
    } else {
      on(
        element,
        'touchstart',
        (event) => {
          const e = event as TouchEvent;
          const p = e.changedTouches[0];
          if (!p) return;
          e.preventDefault();
          this.touch = p.identifier;
          this.update(p);
        },
        { passive: false },
      );
      on(
        document,
        'touchmove',
        (event) => {
          const e = event as TouchEvent;
          const p = this.find(e.touches, this.touch);
          if (p) {
            e.preventDefault();
            this.update(p);
          }
        },
        { capture: true, passive: false },
      );
      for (const name of ['touchend', 'touchcancel'])
        on(
          window,
          name,
          (event) => {
            const e = event as TouchEvent;
            if (this.find(e.changedTouches, this.touch) || !e.touches.length) this.release();
          },
          { capture: true },
        );
    }
  }
  private find(list: TouchList, id: number | null): Touch | null {
    if (id === null) return null;
    for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
    return null;
  }
  private update(p: { clientX: number; clientY: number }): void {
    const r = this.element.getBoundingClientRect(),
      max = r.width * 0.34;
    if (!max) {
      this.release();
      return;
    }
    let x = p.clientX - r.left - r.width / 2,
      y = p.clientY - r.top - r.height / 2;
    const length = Math.hypot(x, y);
    if (length > max) {
      x *= max / length;
      y *= max / length;
    }
    this.axis.x = x / max;
    this.axis.y = y / max;
    this.knob.style.transform = `translate(${x}px,${y}px)`;
  }
  release = (): void => {
    const pointer = this.pointer;
    this.pointer = this.touch = null;
    this.axis.x = this.axis.y = 0;
    this.knob.style.transform = 'translate(0,0)';
    try {
      if (pointer !== null && this.element.hasPointerCapture(pointer))
        this.element.releasePointerCapture(pointer);
    } catch {
      /* already released */
    }
  };
  dispose(): void {
    this.release();
    this.life.dispose();
  }
}
