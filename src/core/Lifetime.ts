/** Own browser subscriptions and delayed work so restart/dispose is deterministic. */
export class Lifetime {
  readonly abort = new AbortController();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  listen(
    target: EventTarget,
    name: string,
    listener: EventListener,
    options: AddEventListenerOptions = {},
  ): void {
    target.addEventListener(name, listener, { ...options, signal: this.abort.signal });
  }
  later(callback: () => void, milliseconds: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, milliseconds);
    this.timers.add(timer);
  }
  dispose(): void {
    this.abort.abort();
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }
}
