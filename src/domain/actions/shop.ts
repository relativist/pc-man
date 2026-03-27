import { normalizeGameState } from "../utils";
import type { GameState, ShopLot, ShopSectionId } from "../types";

export function getCurrentShopLot(
  gameState: GameState,
  section: ShopSectionId,
): ShopLot | null {
  const currentLotId = gameState.shop[section].currentLotId;
  return currentLotId
    ? gameState.world.shopCatalogs[section].find((lot) => lot.id === currentLotId) ?? null
    : null;
}

export function getNextShopLot(
  gameState: GameState,
  section: ShopSectionId,
): ShopLot | null {
  return gameState.world.shopCatalogs[section][gameState.shop[section].nextLotIndex] ?? null;
}

export function buyNextShopLot(
  gameState: GameState,
  section: ShopSectionId,
): GameState {
  const nextLot = getNextShopLot(gameState, section);

  if (!nextLot) {
    throw new Error(`No next shop lot available for section: ${section}`);
  }

  if (gameState.player.money < nextLot.price) {
    throw new Error(`Not enough money to buy lot: ${nextLot.id}`);
  }

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money - nextLot.price,
    },
    shop: {
      ...gameState.shop,
      [section]: {
        currentLotId: nextLot.id,
        nextLotIndex: gameState.shop[section].nextLotIndex + 1,
      },
    },
  });
}
