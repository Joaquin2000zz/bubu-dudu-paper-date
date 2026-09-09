import { Lifetime } from '../core/Lifetime';
import type { CharacterName, LevelDefinition } from '../core/types';
import type { GameSession } from '../gameplay/GameSession';
import type { GameRenderer } from './GameRenderer';

export class HudView {
  private life = new Lifetime();
  private speaking: { name: CharacterName; until: number } | null = null;
  private dialogue = document.createElement('div');
  private petalT = 0;
  constructor(
    readonly root: HTMLElement,
    private reducedMotion: boolean,
  ) {
    this.dialogue.className = 'dialogue';
    this.dialogue.setAttribute('role', 'status');
    this.dialogue.setAttribute('aria-live', 'polite');
    root.append(this.dialogue);
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
  quest(active: 'approach' | 'flowers' | 'kiss'): void {
    const order = { approach: 0, flowers: 1, kiss: 2 };
    this.get('#quest')
      .querySelectorAll<HTMLElement>('.q')
      .forEach((q) => {
        const key = q.dataset.q as keyof typeof order;
        q.className = 'q';
        if (order[key] < order[active]) q.classList.add('done');
        else if (key === active) q.classList.add('on');
      });
  }
  showLevel(level: LevelDefinition, s: GameSession): void {
    document.body.dataset.chapter = String(
      level.theme === 'night' ? 1 : level.theme === 'dawn' ? 2 : 3,
    );
    document.body.classList.add('playing');
    this.get('#menu').style.display = 'none';
    this.get('#hud').style.display = 'block';
    this.get('#prompt').style.display = 'block';
    this.get('#quest').style.display = 'flex';
    this.get('#chapter').textContent = level.chapter;
    const title = document.createElement('b');
    title.textContent = level.name;
    this.get('#chapter').append(title);
    this.get('#quest').innerHTML =
      level.kind === 'garden'
        ? '<span class="q on" data-q="approach">1 · ACERCATE</span><span class="q" data-q="flowers">2 · FLORES</span><span class="q" data-q="kiss">3 · BESO</span>'
        : `<span class="q on">NIVEL ${s.chapterIndex}/${s.totalLevels}</span><span class="q">RAMOS 0/${level.flowers.length}</span><span class="q">META</span>`;
    this.get('#travel').textContent =
      level.kind === 'garden' ? 'Seguir el caminito →' : `Entrar al nivel ${s.chapterIndex + 1} →`;
  }
  showMenu(): void {
    this.speaking = null;
    this.dialogue.classList.remove('show');
    delete document.body.dataset.chapter;
    document.body.classList.remove('playing');
    this.get('#menu').style.display = 'flex';
    for (const id of ['#hud', '#quest', '#prompt', '#travel']) this.get(id).style.display = 'none';
  }
  travel(visible: boolean): void {
    this.get('#travel').style.display = visible ? 'block' : 'none';
  }
  status(s: GameSession, level: LevelDefinition): void {
    const dedication = this.escape(s.dedication),
      count = level.flowers.filter((f) => s.inventory.has(f.id)).length;
    const html =
      level.kind === 'garden'
        ? `<strong>Nivel ${s.chapterIndex}/${s.totalLevels} · ${s.chosen}</strong> · Ramos ${s.inventory.available}/${s.flowers}<br>${dedication}<br>WASD/flechas · E ramo · Espacio beso · Besos: <strong>${s.kisses}</strong> 💋`
        : `<strong>Nivel ${s.chapterIndex}/${s.totalLevels}</strong> · Ramos: ${count}/${level.flowers.length} · Total: ${s.flowers}<br><strong>${s.chosen}</strong> · ${dedication}`;
    if (this.get('#hud').innerHTML !== html) this.get('#hud').innerHTML = html;
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
      Math.max(innerWidth < 600 ? 220 : 150, Math.min(innerHeight - 270, point.y - 45)) + 'px';
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
