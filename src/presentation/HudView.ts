import { Lifetime } from '../core/Lifetime';
import type { CharacterName, LevelDefinition } from '../core/types';
import type { GameSession } from '../gameplay/GameSession';
import type { GameRenderer } from './GameRenderer';

export class HudView {
  private life = new Lifetime();
  private speaking: { name: CharacterName; until: number } | null = null;
  private dialogue = document.createElement('div');
  private petalT = 0;
  private touchControls = matchMedia('(pointer: coarse)').matches;
  constructor(
    readonly root: HTMLElement,
    private reducedMotion: boolean,
  ) {
    this.dialogue.className = 'dialogue';
    this.dialogue.setAttribute('role', 'status');
    this.dialogue.setAttribute('aria-live', 'polite');
    root.append(this.dialogue);
    const setControls = (touch: boolean) => {
      this.touchControls = touch;
      root.dataset.controls = touch ? 'touch' : 'keyboard';
    };
    setControls(this.touchControls);
    const pointer = matchMedia('(pointer: coarse)');
    this.life.listen(pointer, 'change', () => setControls(pointer.matches));
    this.life.listen(
      root,
      'pointerdown',
      (event) => {
        if ((event as PointerEvent).pointerType === 'touch') setControls(true);
      },
      { passive: true },
    );
    this.life.listen(window, 'keydown', (event) => {
      const e = event as KeyboardEvent;
      if ((e.target as Element)?.matches?.('input,textarea')) return;
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          'j',
          'x',
          'e',
          ' ',
        ].includes(e.key.toLowerCase())
      )
        setControls(false);
    });
  }
  flowerHint(): string {
    return this.touchControls ? 'Tocá «Regalar ramo» 🌷' : 'Presioná E para regalar un ramo 🌷';
  }
  kissHint(again = false): string {
    return this.touchControls
      ? `Tocá «Besar»${again ? ' para otro beso' : ''} 💋`
      : `Presioná Espacio para ${again ? 'otro beso' : 'besar'} 💋`;
  }
  get<T extends HTMLElement = HTMLElement>(selector: string): T {
    const node = this.root.querySelector<T>(selector);
    if (!node) throw Error(`Falta ${selector}`);
    return node;
  }
  prompt(text: string, pop = false): void {
    const node = this.get('#prompt');
    if (node.textContent !== text) node.textContent = text;
    if (pop) {
      node.classList.add('pop');
      this.life.later(() => node.classList.remove('pop'), 180);
    }
  }
  toast(text: string, duration = 900): void {
    const node = this.get('#toast');
    node.textContent = text;
    node.classList.add('show');
    this.life.later(() => node.classList.remove('show'), duration);
  }
  showLevel(level: LevelDefinition, s: GameSession): void {
    document.body.dataset.chapter = String(
      level.theme === 'night' ? 1 : level.theme === 'dawn' ? 2 : 3,
    );
    document.body.classList.add('playing');
    this.get('#menu').style.display = 'none';
    this.get('#hud').style.display = 'block';
    this.get('#prompt').style.display = 'block';
    this.get('#chapter').textContent = level.chapter;
    const title = document.createElement('b');
    title.textContent = level.name;
    this.get('#chapter').append(title);
    this.get('#travel').textContent =
      level.kind === 'garden'
        ? 'Acercarme automáticamente →'
        : `Ir al nivel ${s.chapterIndex + 1} →`;
  }
  showMenu(): void {
    this.speaking = null;
    this.dialogue.classList.remove('show');
    delete document.body.dataset.chapter;
    document.body.classList.remove('playing');
    this.get('#menu').style.display = 'flex';
    for (const id of ['#hud', '#prompt', '#travel']) this.get(id).style.display = 'none';
  }
  travel(visible: boolean): void {
    this.get('#travel').style.display = visible ? 'block' : 'none';
  }
  status(s: GameSession, level: LevelDefinition): void {
    const dedication = this.escape(s.dedication),
      count = level.flowers.filter((f) => s.inventory.has(f.id)).length;
    const html =
      level.kind === 'garden'
        ? `<strong>${s.chosen} · Nivel ${s.chapterIndex}/${s.totalLevels}</strong><br>${dedication}<br>Ramos disponibles: ${s.inventory.available} · Besos: ${s.kisses} 💋`
        : `<strong>${s.chosen} · Nivel ${s.chapterIndex}/${s.totalLevels}</strong><br>${dedication}<br>Ramos del nivel: ${count}/${level.flowers.length} · Reunidos: ${s.flowers}`;
    if (this.get('#hud').innerHTML !== html) this.get('#hud').innerHTML = html;
    const garden = level.kind === 'garden',
      locked = ['flowers', 'kiss'].includes(s.mode);
    const jump = this.get<HTMLButtonElement>('[data-action="jump"]');
    const flowers = this.get<HTMLButtonElement>('[data-action="flowers"]');
    const kiss = this.get<HTMLButtonElement>('[data-action="kiss"]');
    flowers.hidden = !garden || !s.inventory.available;
    kiss.hidden = !garden || !['ready', 'done', 'kiss'].includes(s.mode);
    jump.disabled =
      !['platform', 'approach', 'ready', 'done'].includes(s.mode) || s.actor.jumpY > 0.02;
    flowers.disabled = locked || s.distance() > 2.35 || s.actor.jumpY > 0;
    kiss.disabled = !['ready', 'done'].includes(s.mode) || s.distance() > 2.35 || s.actor.jumpY > 0;
    this.get('#keyboardHelp').textContent = garden
      ? `WASD / flechas: mover · J / X: saltar${s.inventory.available ? ' · E: regalar ramo' : ''}${['ready', 'done'].includes(s.mode) ? ' · Espacio: besar' : ''} · Q / C: cámara`
      : 'WASD / flechas: mover · J / X: saltar · Q / C: cámara';
  }
  say(name: CharacterName, text: string): void {
    this.speaking = { name, until: performance.now() + 3100 };
    this.dialogue.replaceChildren();
    const label = document.createElement('strong'),
      words = document.createElement('span');
    label.textContent = name;
    words.textContent = text;
    this.dialogue.append(label, words);
    this.dialogue.classList.add('show');
  }
  update(dt: number, s: GameSession, renderer: GameRenderer): void {
    this.petalT += dt;
    if (this.petalT > 0.23) {
      this.petalT = 0;
      if (s.mode !== 'menu' && Math.random() < 0.4) this.petal();
    }
    if (!this.speaking || performance.now() > this.speaking.until || !s.player) {
      this.dialogue.classList.remove('show');
      return;
    }
    const actor = s.positions[this.speaking.name],
      point = renderer.project(actor.x, 3.4, actor.z);
    this.dialogue.style.left = Math.max(125, Math.min(innerWidth - 125, point.x)) + 'px';
    this.dialogue.style.top =
      Math.max(innerWidth < 600 ? 300 : 150, Math.min(innerHeight - 270, point.y - 45)) + 'px';
  }
  hearts(s: GameSession, renderer: GameRenderer, n = 18): void {
    if (this.reducedMotion || !s.player) return;
    const a = s.actor,
      b = s.companion,
      p = renderer.project((a.x + b.x) / 2, 2.1, (a.z + b.z) / 2);
    for (let i = 0; i < n; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.style.left = p.x + 'px';
      h.style.top = p.y + 'px';
      h.style.setProperty('--x', `${(Math.random() - 0.5) * 240}px`);
      h.style.setProperty('--y', `${-80 - Math.random() * 210}px`);
      h.style.setProperty('--r', `${(Math.random() - 0.5) * 80}deg`);
      h.style.setProperty('--s', `${0.55 + Math.random() * 0.85}`);
      h.style.setProperty('--d', `${1 + Math.random() * 0.7}s`);
      this.get('#fx').append(h);
      this.life.later(() => h.remove(), 1900);
    }
  }
  private petal(): void {
    if (this.reducedMotion) return;
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = Math.random() * innerWidth + 'px';
    p.style.top = '-20px';
    p.style.setProperty('--x', `${(Math.random() - 0.5) * 180}px`);
    p.style.setProperty('--d', `${4 + Math.random() * 3}s`);
    this.get('#fx').append(p);
    this.life.later(() => p.remove(), 7500);
  }
  private escape(value: string): string {
    const node = document.createElement('span');
    node.textContent = value;
    return node.innerHTML;
  }
  dispose(): void {
    this.life.dispose();
    this.dialogue.remove();
    this.get('#fx').replaceChildren();
  }
}
