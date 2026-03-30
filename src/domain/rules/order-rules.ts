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

export function hasFriendOrderMarketAccess(gameState: GameState): boolean {
  return gameState.social.friends.length > 0;
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

  return (
    meetsOrderQualificationRequirements(gameState, order) &&
    meetsOrderPcRequirements(gameState, order)
  );
}

export function isOrderVisibleToPlayer(gameState: GameState, order: Order): boolean {
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

function compareEligibleOrders(left: Order, right: Order): number {
  if (left.level !== right.level) {
    return right.level - left.level;
  }

  if (left.requirements.minQualificationLevel !== right.requirements.minQualificationLevel) {
    return right.requirements.minQualificationLevel - left.requirements.minQualificationLevel;
  }

  if (left.requirements.minPcScore !== right.requirements.minPcScore) {
    return right.requirements.minPcScore - left.requirements.minPcScore;
  }

  if (left.rewardMoney !== right.rewardMoney) {
    return right.rewardMoney - left.rewardMoney;
  }

  if (left.rewardQualificationPoints !== right.rewardQualificationPoints) {
    return right.rewardQualificationPoints - left.rewardQualificationPoints;
  }

  return left.id.localeCompare(right.id);
}

export function getBestEligibleOrders(gameState: GameState): Order[] {
  return gameState.world.orderPool
    .filter((order) => isOrderVisibleToPlayer(gameState, order))
    .sort(compareEligibleOrders);
}

export function selectVisibleOrders(gameState: GameState, now: Date): Order[] {
  const eligibleOrders = getBestEligibleOrders(gameState);
  const discoveredIds = new Set(gameState.orders.discoveredOrderIds);
  const discoveredOrders = eligibleOrders.filter((order) => discoveredIds.has(order.id));

  if (!hasFriendOrderMarketAccess(gameState)) {
    return discoveredOrders.slice(0, maxVisibleOrders);
  }

  const marketOrders = eligibleOrders.filter((order) => !discoveredIds.has(order.id));
  const combinedOrders = [...discoveredOrders, ...marketOrders];

  return combinedOrders.slice(0, maxVisibleOrders);
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
