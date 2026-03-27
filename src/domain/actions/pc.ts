import { refreshAvailableOrders } from "./orders";
import { normalizeGameState } from "../utils";
import type { GameState, PcTierCatalogItem } from "../types";

export function getCurrentPcTier(gameState: GameState): PcTierCatalogItem | null {
  if (gameState.pc.currentBuild) {
    return gameState.pc.currentBuild;
  }

  if (!gameState.pc.currentTierId) {
    return null;
  }

  return gameState.world.availablePcTiers.find((tier) => tier.id === gameState.pc.currentTierId) ?? null;
}

export function getNextPcTier(gameState: GameState): PcTierCatalogItem | null {
  const currentTier = getCurrentPcTier(gameState);

  if (!currentTier) {
    return gameState.world.availablePcTiers[0] ?? null;
  }

  return (
    gameState.world.availablePcTiers.find((tier) => tier.level === currentTier.level + 1) ?? null
  );
}

export function canAffordNextPcTier(gameState: GameState): boolean {
  const nextTier = getNextPcTier(gameState);
  return Boolean(nextTier && gameState.player.money >= nextTier.price);
}

export function upgradePcTier(
  gameState: GameState,
  now: Date = new Date(),
): GameState {
  const nextTier = getNextPcTier(gameState);

  if (!nextTier) {
    throw new Error("No next PC tier available");
  }

  if (gameState.player.money < nextTier.price) {
    throw new Error(`Not enough money to buy PC tier: ${nextTier.id}`);
  }

  return refreshAvailableOrders(
    normalizeGameState({
      ...gameState,
      player: {
        ...gameState.player,
        money: gameState.player.money - nextTier.price,
      },
      pc: {
        ...gameState.pc,
        currentTierId: nextTier.id,
        currentBuild: nextTier,
      },
    }),
    now,
  );
}
