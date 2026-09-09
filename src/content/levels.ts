import type { Floor } from '../core/types';
import type { CollisionLevel } from '../physics/PhysicsWorld';
const gardenFloors: Floor[] = [];
const add = (
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
) => gardenFloors.push({ id, x, y, z, w, h, d, color, top: y + h });
// The original garden is level 3. Its exact support map stays intact.
add('grass', 0, -0.12, 0, 20, 0.15, 21.7, '#96b77a');
for (let j = 0; j < 17; j++)
  add(
    'path' + j,
    j % 2 ? -0.06 : 0.06,
    0.035,
    8.8 - j * 1.03,
    2.55,
    0.07,
    0.99,
    j % 3 === 0 ? '#e7c895' : '#efd8ac',
  );
add('terrace-base', 0, 0, -7.7, 7.5, 0.38, 4.3, '#d4b37c');
add('terrace', 0, 0.38, -7.7, 7.65, 0.1, 4.45, '#f3deb2');
add('step-lower', 0, 0, -5.15, 3.6, 0.14, 0.6, '#d3b384');
add('step-upper', 0, 0.14, -5.65, 3.6, 0.16, 0.6, '#e5c995');
for (let i = 0; i < 11; i++)
  add(
    'bridge' + i,
    -5,
    0.2 + Math.sin((i / 10) * Math.PI) * 0.2,
    -2 + i * 0.4,
    1.45,
    0.16,
    0.36,
    '#bc9669',
  );
for (const side of [-1, 1])
  add('bridge-entry' + side, -5, 0.03, side * 2.35, 1.45, 0.15, 0.36, '#bc9669');

const floor = (
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
) => ({ id, x, y, z, w, h, d, color, top: y + h });
const LEVELS: Record<number, CollisionLevel> = {
  3: {
    id: 3,
    kind: 'garden',
    theme: 'joy',
    intro: '¡{partner}! Por fin estamos juntos.',
    name: 'El jardín de los encuentros',
    chapter: 'CAPÍTULO 03 · FINAL',
    start: { x: -0.8, z: 3 },
    goal: { x: 1, z: -5.7 },
    floors: gardenFloors,
    gaps: [],
    obstacles: [],
    hazards: [],
    mobs: [],
    flowers: [],
    giftSpots: [
      { x: -2.8, z: 4.8 },
      { x: 2.2, z: 3.8 },
      { x: 4.7, z: -1.2 },
    ],
  },
};
// Floating stepping stones: no invisible walkable meadow under the route.
const routes: Record<number, number[][]> = {
  1: [
    [-3, 7],
    [-4, 4.5],
    [-2, 2],
    [0, -0.5],
    [2, -3],
    [4, -5.5],
    [3, -8],
  ],
  2: [
    [-3, 7],
    [-1, 4.5],
    [1, 2],
    [-1, -0.5],
    [1, -3],
    [3, -5.5],
    [3, -8],
  ],
};
for (const id of [1, 2]) {
  const route = routes[id],
    dark = id === 1;
  const platforms = route.map(([x, z], i) =>
    floor(
      `l${id}-island-${i}`,
      x,
      -0.35 + (i % 2) * 0.12,
      z,
      i === 0 || i === 6 ? 3.4 : id === 1 ? 3 : 2.7,
      0.5,
      i === 0 || i === 6 ? 2.1 : 1.65,
      dark ? '#687788' : '#8b9988',
    ),
  );
  LEVELS[id] = {
    id,
    kind: 'platform',
    theme: dark ? 'night' : 'dawn',
    intro: dark
      ? '{partner}… está oscuro, pero voy a encontrarte.'
      : 'Ya entra un poquito de luz. Estoy más cerca.',
    name: dark ? 'El valle de las cartas perdidas' : 'El bosque del primer amanecer',
    chapter: `CAPÍTULO 0${id}`,
    start: { x: route[0][0], z: route[0][1] },
    goal: { x: route[6][0], z: route[6][1] },
    floors: platforms,
    gaps: route
      .slice(0, -1)
      .map(([, z], i) => ({ id: `abyss-${i}`, x: 0, z: z - 1.25, w: 20, d: 0.6 })),
    obstacles: [
      {
        id: `l${id}-fallen-log`,
        x: route[2][0] + 0.7,
        z: route[2][1],
        w: 0.5,
        d: 1.1,
        y: 0.15,
        h: 0.65,
        color: dark ? '#454659' : '#6a645f',
        kind: 'log',
      },
    ],
    hazards: [
      { id: 'brambles-a', x: route[3][0] - 0.95, z: route[3][1], w: 0.45, d: 1.2 },
      { id: 'brambles-b', x: route[5][0] + 0.95, z: route[5][1], w: 0.45, d: 1.2 },
    ],
    flowers: [1, 3, 5].map((i, k) => ({
      id: `l${id}-flower-${k}`,
      x: route[i][0],
      z: route[i][1] - 0.2,
    })),
    mobs: [2, 4, 5].map((i, k) => ({
      id: `l${id}-warden-${k}`,
      x: route[i][0] - 0.5,
      z: route[i][1],
      axis: 'x',
      range: 0.65,
      speed: dark ? 1.5 : 2,
      arena: platforms[i],
      windup: dark ? 0.85 : 0.6,
      recovery: dark ? 1.5 : 1.1,
    })),
    route,
  };
}

export { LEVELS };
export const CAMPAIGN = [1, 2, 3];
