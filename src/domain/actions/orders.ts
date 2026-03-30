import { createActivityTimer } from "../factories";
import {
  applyQualificationPoints,
  canOrderBeTaken,
  convertGameDaysToMinutes,
  getBestEligibleOrders,
  getOrderById,
  orderRefreshIntervalMinutes,
  selectVisibleOrders,
} from "../rules";
import { normalizeGameState } from "../utils";
import type { FriendState, GameState, Order } from "../types";

function removeOrderId(ids: string[], orderId: string): string[] {
  return ids.filter((id) => id !== orderId);
}

function isOrderCurrentlyKnown(gameState: GameState, orderId: string): boolean {
  return (
    gameState.orders.availableOrderIds.includes(orderId) ||
    gameState.orders.discoveredOrderIds.includes(orderId)
  );
}

function consumeFriendOrderSlot(gameState: GameState): GameState {
  const friends = gameState.social.friends;

  if (friends.length === 0) {
    return gameState;
  }

  const startIndex = gameState.social.friendOrderRotationIndex % friends.length;
  let selectedIndex = -1;

  for (let offset = 0; offset < friends.length; offset += 1) {
    const index = (startIndex + offset) % friends.length;
    const friend = friends[index];

    if (friend.isActive && friend.ordersGivenCount < friend.maxOrdersGiven) {
      selectedIndex = index;
      break;
    }
  }

  if (selectedIndex === -1) {
    return gameState;
  }

  const nextFriends = friends
    .map((friend, index): FriendState | null => {
      if (index !== selectedIndex) {
        return friend;
      }

      const nextOrdersGivenCount = friend.ordersGivenCount + 1;

      if (nextOrdersGivenCount >= friend.maxOrdersGiven) {
        return null;
      }

      return {
        ...friend,
        ordersGivenCount: nextOrdersGivenCount,
      };
    })
    .filter((friend): friend is FriendState => Boolean(friend));

  return normalizeGameState({
    ...gameState,
    social: {
      ...gameState.social,
      friends: nextFriends,
      friendOrderRotationIndex: nextFriends.length === 0 ? 0 : selectedIndex % nextFriends.length,
    },
  });
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

  const activeOrderSource = gameState.orders.discoveredOrderIds.includes(orderId) ? "walk" : "friend";

  const nextState = normalizeGameState({
    ...gameState,
    orders: {
      ...gameState.orders,
      activeOrderId: orderId,
      activeOrderSource,
      availableOrderIds: removeOrderId(gameState.orders.availableOrderIds, orderId),
      discoveredOrderIds: removeOrderId(gameState.orders.discoveredOrderIds, orderId),
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

  return activeOrderSource === "friend" ? consumeFriendOrderSlot(nextState) : nextState;
}

export function discoverOrderFromWalk(gameState: GameState): { game: GameState; order: Order | null } {
  const nextOrder =
    getBestEligibleOrders(gameState).find((order) => !isOrderCurrentlyKnown(gameState, order.id)) ?? null;

  if (!nextOrder) {
    return { game: gameState, order: null };
  }

  return {
    game: normalizeGameState({
      ...gameState,
      orders: {
        ...gameState.orders,
        discoveredOrderIds: [...gameState.orders.discoveredOrderIds, nextOrder.id],
      },
    }),
    order: nextOrder,
  };
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
        activeOrderSource: null,
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
      activeOrderSource: null,
      completedOrderIds: [...gameState.orders.completedOrderIds, activeOrderId],
    },
    timers: {
      ...gameState.timers,
      activeOrder: null,
    },
  });
}
