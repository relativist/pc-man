import { createActivityTimer } from "../factories";
import {
  applyQualificationPoints,
  canOrderBeTaken,
  convertGameDaysToMinutes,
  getOrderById,
  orderRefreshIntervalMinutes,
  selectVisibleOrders,
} from "../rules";
import { normalizeGameState } from "../utils";
import type { GameState } from "../types";

function removeOrderId(ids: string[], orderId: string): string[] {
  return ids.filter((id) => id !== orderId);
}

export function refreshAvailableOrders(gameState: GameState, now: Date = new Date()): GameState {
  const visibleOrders = selectVisibleOrders(gameState, now);
  const nextRefreshAt = new Date(
    now.getTime() + orderRefreshIntervalMinutes * 60_000,
  ).toISOString();

  return normalizeGameState({
    ...gameState,
    orders: {
      ...gameState.orders,
      availableOrderIds: visibleOrders.map((order) => order.id),
      lastRefreshAt: now.toISOString(),
      nextRefreshAt,
    },
  });
}

export function startOrder(
  gameState: GameState,
  orderId: string,
  now: Date = new Date(),
): GameState {
  const order = getOrderById(gameState, orderId);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (!gameState.orders.availableOrderIds.includes(orderId)) {
    throw new Error(`Order is not currently available: ${orderId}`);
  }

  if (!canOrderBeTaken(gameState, order)) {
    throw new Error(`Order cannot be taken: ${orderId}`);
  }

  return normalizeGameState({
    ...gameState,
    orders: {
      ...gameState.orders,
      activeOrderId: orderId,
      availableOrderIds: removeOrderId(gameState.orders.availableOrderIds, orderId),
    },
    timers: {
      ...gameState.timers,
      activeOrder: createActivityTimer(
        "order",
        now,
        convertGameDaysToMinutes(order.durationDays),
        orderId,
      ),
    },
  });
}

export function resolveActiveOrder(
  gameState: GameState,
  randomValue: number = Math.random(),
): GameState {
  const activeOrderId = gameState.orders.activeOrderId;

  if (!activeOrderId) {
    throw new Error("No active order to resolve");
  }

  const order = getOrderById(gameState, activeOrderId);
  if (!order) {
    throw new Error(`Active order not found: ${activeOrderId}`);
  }

  const failed = randomValue < order.failureChancePct / 100;

  if (failed) {
    return normalizeGameState({
      ...gameState,
      orders: {
        ...gameState.orders,
        activeOrderId: null,
        failedOrderIds: [...gameState.orders.failedOrderIds, activeOrderId],
      },
      timers: {
        ...gameState.timers,
        activeOrder: null,
      },
    });
  }

  const currentTrackProgress = gameState.skills.tracks[order.track];
  const updatedTrackProgress = applyQualificationPoints(
    {
      ...currentTrackProgress,
      practicalTasksCompleted: currentTrackProgress.practicalTasksCompleted + 1,
    },
    order.rewardQualificationPoints,
  );

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money + order.rewardMoney,
    },
    skills: {
      ...gameState.skills,
      tracks: {
        ...gameState.skills.tracks,
        [order.track]: updatedTrackProgress,
      },
    },
    orders: {
      ...gameState.orders,
      activeOrderId: null,
      completedOrderIds: [...gameState.orders.completedOrderIds, activeOrderId],
    },
    timers: {
      ...gameState.timers,
      activeOrder: null,
    },
  });
}
