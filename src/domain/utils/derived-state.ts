import { shopCatalogs } from "../catalogs";
import { ratedPcSlots, requiredPcSlots } from "../catalogs/pc-parts";
import type {
  Book,
  BookUnlockCondition,
  GameState,
  PcComponentCatalogItem,
  PlayerState,
  SkillState,
} from "../types";

function getOwnedShopLot(
  gameState: GameState,
  section: keyof GameState["shop"],
) {
  const currentLotId = gameState.shop[section].currentLotId;
  return currentLotId
    ? gameState.world.shopCatalogs[section].find((lot) => lot.id === currentLotId) ?? null
    : null;
}

function isUnlockConditionMet(condition: BookUnlockCondition, skills: SkillState): boolean {
  const progress = skills.tracks[condition.track];
  if (!progress) {
    return false;
  }

  if (condition.minLevel && progress.level < condition.minLevel) {
    return false;
  }

  if (condition.minPoints && progress.points < condition.minPoints) {
    return false;
  }

  return true;
}

function isBookUnlocked(book: Book, skills: SkillState): boolean {
  if (!book.unlockRequirements) {
    return true;
  }

  const { track, minLevel, minPoints, allOf, anyOf } = book.unlockRequirements;

  if (track && !isUnlockConditionMet({ track, minLevel, minPoints }, skills)) {
    return false;
  }

  if (allOf && !allOf.every((condition) => isUnlockConditionMet(condition, skills))) {
    return false;
  }

  if (anyOf && !anyOf.some((condition) => isUnlockConditionMet(condition, skills))) {
    return false;
  }

  return true;
}

export function calculateCapital(
  player: Pick<PlayerState, "money" | "realEstateValue" | "propertyValue">,
): number {
  return player.money + player.realEstateValue + player.propertyValue;
}

export function calculatePcRatingScore(components: GameState["pc"]["components"]): number {
  return ratedPcSlots.reduce((total, slot) => total + (components[slot]?.score ?? 0), 0);
}

export function isWorkingPcReady(components: GameState["pc"]["components"]): boolean {
  return requiredPcSlots.every((slot) => components[slot] !== null);
}

export function getAvailableBookIds(books: Book[], skills: SkillState): string[] {
  return books.filter((book) => isBookUnlocked(book, skills)).map((book) => book.id);
}

export function getPcPartById(
  partsCatalog: PcComponentCatalogItem[],
  itemId: string,
): PcComponentCatalogItem | undefined {
  return partsCatalog.find((item) => item.id === itemId);
}

export function normalizeGameState(gameState: GameState): GameState {
  const isLegacyShopState = !gameState.shop;
  const normalizedShop = gameState.shop ?? {
    things: { currentLotId: null, nextLotIndex: 0 },
    housing: { currentLotId: null, nextLotIndex: 0 },
    transport: { currentLotId: null, nextLotIndex: 0 },
  };
  const shopGameState = {
    ...gameState,
    shop: normalizedShop,
    world: {
      ...gameState.world,
      shopCatalogs: gameState.world.shopCatalogs ?? shopCatalogs,
    },
  };
  const currentHousing = getOwnedShopLot(shopGameState, "housing");
  const currentThing = getOwnedShopLot(shopGameState, "things");
  const currentTransport = getOwnedShopLot(shopGameState, "transport");
  const realEstateValue = currentHousing?.value ?? (isLegacyShopState ? gameState.player.realEstateValue ?? 0 : 0);
  const propertyValue =
    (currentThing?.value ?? 0) +
    (currentTransport?.value ?? 0) +
    (isLegacyShopState && !currentThing && !currentTransport ? gameState.player.propertyValue ?? 0 : 0);
  const housingStatus =
    currentHousing?.housingStatus ??
    (isLegacyShopState ? gameState.player.housingStatus : undefined) ??
    (realEstateValue > 0 ? "own_home" : "with_parents");

  return {
    ...shopGameState,
    meta: {
      ...shopGameState.meta,
      lastViewedLogAt:
        shopGameState.meta.lastViewedLogAt ??
        shopGameState.logs[0]?.at ??
        shopGameState.meta.updatedAt,
    },
    player: {
      ...shopGameState.player,
      realEstateValue,
      propertyValue,
      housingStatus,
      capital: calculateCapital({
        money: shopGameState.player.money,
        realEstateValue,
        propertyValue,
      }),
    },
    social: {
      ...shopGameState.social,
      pendingEncounters: shopGameState.social.pendingEncounters ?? [],
    },
    learning: {
      ...shopGameState.learning,
      availableBookIds: getAvailableBookIds(shopGameState.world.availableBooks, shopGameState.skills),
    },
    pc: {
      ...shopGameState.pc,
      isWorkingPcReady: isWorkingPcReady(shopGameState.pc.components),
      ratingScore: calculatePcRatingScore(shopGameState.pc.components),
    },
  };
}
