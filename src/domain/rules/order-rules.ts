import type { GameState, Order, QualificationProgress, SkillTrackId } from "../types";

export const maxVisibleOrders = 10;
export const orderRefreshIntervalMinutes = 10;
export const maxConcurrentOrders = 1;
export const gameDaysPerMonth = 30;

function getTrackProgress(gameState: GameState, track: SkillTrackId): QualificationProgress {
  return gameState.skills.tracks[track];
}

export function convertGameDaysToMinutes(durationDays: number): number {
  return durationDays / gameDaysPerMonth;
}

export function isOrderAlreadyResolved(gameState: GameState, orderId: string): boolean {
  return (
    gameState.orders.completedOrderIds.includes(orderId) ||
    gameState.orders.failedOrderIds.includes(orderId)
  );
}

export function meetsOrderQualificationRequirements(
  gameState: GameState,
  order: Order,
): boolean {
  const progress = getTrackProgress(gameState, order.track);

  if (progress.level < order.requirements.minQualificationLevel) {
    return false;
  }

  if (
    order.requirements.minQualificationPoints !== undefined &&
    progress.points < order.requirements.minQualificationPoints
  ) {
    return false;
  }

  return true;
}

export function meetsOrderPcRequirements(gameState: GameState, order: Order): boolean {
  if (order.requirements.requiresWorkingPc && !gameState.pc.isWorkingPcReady) {
    return false;
  }

  if (gameState.pc.ratingScore < order.requirements.minPcScore) {
    return false;
  }

  if (
    order.requirements.maxPcScore !== undefined &&
    gameState.pc.ratingScore > order.requirements.maxPcScore
  ) {
    return false;
  }

  return true;
}

export function canOrderBeTaken(gameState: GameState, order: Order): boolean {
  if (gameState.orders.activeOrderId !== null && maxConcurrentOrders <= 1) {
    return false;
  }

  if (isOrderAlreadyResolved(gameState, order.id)) {
    return false;
  }

  return (
    meetsOrderQualificationRequirements(gameState, order) &&
    meetsOrderPcRequirements(gameState, order)
  );
}

export function isOrderVisibleToPlayer(gameState: GameState, order: Order): boolean {
  if (isOrderAlreadyResolved(gameState, order.id)) {
    return false;
  }

  if (gameState.orders.activeOrderId === order.id) {
    return false;
  }

  return (
    meetsOrderQualificationRequirements(gameState, order) &&
    meetsOrderPcRequirements(gameState, order)
  );
}

export function getEligibleOrders(gameState: GameState): Order[] {
  return gameState.world.orderPool.filter((order) => canOrderBeTaken(gameState, order));
}

export function selectVisibleOrders(gameState: GameState, now: Date): Order[] {
  const eligibleOrders = gameState.world.orderPool
    .filter((order) => isOrderVisibleToPlayer(gameState, order))
    .sort((left, right) => left.id.localeCompare(right.id));

  if (eligibleOrders.length <= maxVisibleOrders) {
    return eligibleOrders;
  }

  const bucket = Math.floor(now.getTime() / (orderRefreshIntervalMinutes * 60_000));
  const offset = bucket % eligibleOrders.length;
  const rotated = eligibleOrders
    .slice(offset)
    .concat(eligibleOrders.slice(0, offset));

  return rotated.slice(0, maxVisibleOrders);
}

export function shouldRefreshOrders(gameState: GameState, now: Date): boolean {
  if (!gameState.orders.nextRefreshAt) {
    return true;
  }

  return now.getTime() >= new Date(gameState.orders.nextRefreshAt).getTime();
}

export function getOrderById(gameState: GameState, orderId: string): Order | undefined {
  return gameState.world.orderPool.find((order) => order.id === orderId);
}
