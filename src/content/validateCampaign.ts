import type { CollisionLevel } from '../physics/PhysicsWorld';

/** Fail at startup with a useful content error rather than halfway through a run. */
export function validateCampaign(levels: Record<number, CollisionLevel>, order: number[]): void {
  if (!order.length || new Set(order).size !== order.length)
    throw Error('La campaña debe tener niveles únicos.');
  const bouquetIds = new Set<string>();
  for (const [index, id] of order.entries()) {
    const level = levels[id];
    if (!level || level.id !== id) throw Error(`Falta la definición del nivel ${id}.`);
    if ((level.kind === 'garden') !== (index === order.length - 1))
      throw Error('El jardín debe cerrar la campaña.');
    if (level.kind === 'platform' && level.flowers.length !== 3)
      throw Error(`Nivel ${id}: se requieren tres ramos.`);
    for (const point of [level.start, level.goal, ...level.flowers]) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.z))
        throw Error(`Nivel ${id}: posición inválida.`);
    }
    for (const floor of level.floors) {
      if (
        ![floor.x, floor.y, floor.z, floor.w, floor.h, floor.d, floor.top].every(Number.isFinite) ||
        floor.w <= 0 ||
        floor.h <= 0 ||
        floor.d <= 0 ||
        Math.abs(floor.top - floor.y - floor.h) > 1e-8
      )
        throw Error(`Nivel ${id}: superficie inválida ${floor.id}.`);
    }
    for (const bouquet of level.flowers) {
      if (bouquetIds.has(bouquet.id)) throw Error(`Ramo duplicado: ${bouquet.id}.`);
      bouquetIds.add(bouquet.id);
    }
  }
}
