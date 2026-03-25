import { normalizeGameState } from "../utils";
import type { GameState, InstalledComponent, PcComponentCatalogItem } from "../types";

export function getPcPartCatalogItem(
  gameState: GameState,
  itemId: string,
): PcComponentCatalogItem | undefined {
  return gameState.world.availablePcParts.find((part) => part.id === itemId);
}

export function canAffordPcPart(gameState: GameState, itemId: string): boolean {
  const part = getPcPartCatalogItem(gameState, itemId);
  return Boolean(part && gameState.player.money >= part.price);
}

export function installPcPart(
  gameState: GameState,
  itemId: string,
): GameState {
  const part = getPcPartCatalogItem(gameState, itemId);

  if (!part) {
    throw new Error(`PC part not found: ${itemId}`);
  }

  if (gameState.player.money < part.price) {
    throw new Error(`Not enough money to buy PC part: ${itemId}`);
  }

  const installedComponent: InstalledComponent = {
    itemId: part.id,
    slot: part.slot,
    level: part.level,
    score: part.score,
    purchasePrice: part.price,
  };

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money - part.price,
    },
    pc: {
      ...gameState.pc,
      components: {
        ...gameState.pc.components,
        [part.slot]: installedComponent,
      },
    },
  });
}
