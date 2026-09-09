import { Game } from './core/Game';
import { CAMPAIGN, LEVELS } from './content/levels';
import { validateCampaign } from './content/validateCampaign';
function boot(): void {
  validateCampaign(LEVELS, CAMPAIGN);
  const game = new Game(document.querySelector<HTMLElement>('#app')!);
  const api = {
    start: game.start,
    reset: game.reset,
    menu: game.menu,
    giveFlowers: game.giveFlowers,
    kiss: game.kiss,
    state: game.session,
    debugNear: game.debugNear,
  };
  if (new URLSearchParams(location.search).has('test'))
    Object.assign(api, {
      loadLevel: game.loadLevel,
      positions: game.session.positions,
      jump: game.jump,
    });
  Object.assign(window, { __BUBU_DUDU_PAPER_DATE__: api });
  if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
}
try {
  boot();
} catch (error) {
  const status = document.querySelector<HTMLElement>('#renderStatus');
  if (status) {
    status.hidden = false;
    status.textContent = error instanceof Error ? error.message : String(error);
  }
  console.error(error);
}
