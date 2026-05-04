import { books as currentBookCatalog, orderTemplates, pcTierCatalog, shopCatalogs } from "../catalogs";
import type {
  Book,
  BookUnlockCondition,
  GameState,
  Order,
  PcTierCatalogItem,
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

function createCurrentOrderPool(): Order[] {
  return orderTemplates.map((template, index) => ({
    ...template,
    id: `order-${index + 1}`,
  }));
}

function getOrderMigrationKey(order: Pick<Order, "track" | "level" | "title" | "funnyTitle">): string {
  return `${order.track}::${order.level}::${order.title}::${order.funnyTitle}`;
}

function createOrderIdRemap(
  savedOrderPool: Order[] | undefined,
  currentOrderPool: Order[],
): Map<string, string> {
  const currentByKey = new Map(
    currentOrderPool.map((order) => [getOrderMigrationKey(order), order.id]),
  );

  return new Map(
    (savedOrderPool ?? [])
      .map((order) => {
        const nextId = currentByKey.get(getOrderMigrationKey(order));
        return nextId ? ([order.id, nextId] as const) : null;
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry)),
  );
}

function remapOrderIdList(ids: string[] | undefined, idRemap: Map<string, string>): string[] {
  const remappedIds = (ids ?? [])
    .map((id) => idRemap.get(id))
    .filter((id): id is string => Boolean(id));

  return Array.from(new Set(remappedIds));
}

function remapOrderId(id: string | null | undefined, idRemap: Map<string, string>): string | null {
  if (!id) {
    return null;
  }

  return idRemap.get(id) ?? null;
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

export function calculatePcRatingScore(build: PcTierCatalogItem | null): number {
  return build?.score ?? 0;
}

export function calculatePcLevel(build: PcTierCatalogItem | null): number {
  return build?.level ?? 0;
}

export function isWorkingPcReady(build: PcTierCatalogItem | null): boolean {
  return build !== null;
}

export function getAvailableBookIds(books: Book[], skills: SkillState): string[] {
  return books.filter((book) => isBookUnlocked(book, skills)).map((book) => book.id);
}

function getClosestPcTier(
  availablePcTiers: PcTierCatalogItem[],
  targetLevel: number,
  targetScore: number,
): PcTierCatalogItem | null {
  if (availablePcTiers.length === 0) {
    return null;
  }

  return availablePcTiers.reduce((bestTier, tier) => {
    const bestScoreDistance = Math.abs(bestTier.score - targetScore);
    const tierScoreDistance = Math.abs(tier.score - targetScore);

    if (tierScoreDistance !== bestScoreDistance) {
      return tierScoreDistance < bestScoreDistance ? tier : bestTier;
    }

    const bestLevelDistance = Math.abs(bestTier.level - targetLevel);
    const tierLevelDistance = Math.abs(tier.level - targetLevel);

    if (tierLevelDistance !== bestLevelDistance) {
      return tierLevelDistance < bestLevelDistance ? tier : bestTier;
    }

    return tier.level > bestTier.level ? tier : bestTier;
  }, availablePcTiers[0]);
}

function normalizePcState(
  rawPc: GameState["pc"] & {
    components?: Record<string, { level?: number; score?: number } | null>;
  },
  availablePcTiers: PcTierCatalogItem[],
): GameState["pc"] {
  const currentTierId = rawPc.currentTierId ?? rawPc.currentBuild?.id ?? null;
  const currentBuild =
    currentTierId
      ? availablePcTiers.find((tier) => tier.id === currentTierId) ?? null
      : null;

  if (currentBuild) {
    return {
      isWorkingPcReady: isWorkingPcReady(currentBuild),
      level: calculatePcLevel(currentBuild),
      ratingScore: calculatePcRatingScore(currentBuild),
      currentTierId: currentBuild.id,
      currentBuild,
    };
  }

  const legacyComponents = Object.values(rawPc.components ?? {});
  const legacyLevels = legacyComponents
    .map((component) => component?.level ?? 0)
    .filter((level) => level > 0);
  const legacyScoreFromComponents = legacyComponents.reduce(
    (sum, component) => sum + (component?.score ?? 0),
    0,
  );
  const legacyLevel =
    rawPc.level > 0
      ? rawPc.level
      : legacyLevels.length > 0
        ? Math.min(...legacyLevels)
        : 0;
  const legacyScore =
    rawPc.ratingScore > 0
      ? rawPc.ratingScore
      : legacyScoreFromComponents;
  const migratedBuild =
    legacyLevel > 0 || legacyScore > 0
      ? getClosestPcTier(availablePcTiers, legacyLevel, legacyScore)
      : null;

  return {
    isWorkingPcReady: isWorkingPcReady(migratedBuild),
    level: calculatePcLevel(migratedBuild),
    ratingScore: calculatePcRatingScore(migratedBuild),
    currentTierId: migratedBuild?.id ?? null,
    currentBuild: migratedBuild,
  };
}

export function normalizeGameState(gameState: GameState): GameState {
  const isLegacyShopState = !gameState.shop;
  const normalizedShop = gameState.shop ?? {
    things: { currentLotId: null, nextLotIndex: 0 },
    housing: { currentLotId: null, nextLotIndex: 0 },
    transport: { currentLotId: null, nextLotIndex: 0 },
  };
  const currentOrderPool = createCurrentOrderPool();
  const currentPcTiers = gameState.world.availablePcTiers ?? pcTierCatalog;
  const orderIdRemap = createOrderIdRemap(gameState.world.orderPool, currentOrderPool);
  const remappedActiveOrderId = remapOrderId(gameState.orders.activeOrderId, orderIdRemap);
  const remappedOrderTimer =
    gameState.timers.activeOrder && remappedActiveOrderId
      ? {
          ...gameState.timers.activeOrder,
          referenceId: remappedActiveOrderId,
        }
      : null;

  const shopGameState = {
    ...gameState,
    shop: normalizedShop,
    world: {
      ...gameState.world,
      availableBooks: [...currentBookCatalog],
      availablePcTiers: [...currentPcTiers],
      orderPool: currentOrderPool,
      shopCatalogs: gameState.world.shopCatalogs ?? shopCatalogs,
    },
    orders: {
      ...gameState.orders,
      activeOrderId: remappedActiveOrderId,
      activeOrderSource: gameState.orders.activeOrderSource ?? null,
      availableOrderIds: remapOrderIdList(gameState.orders.availableOrderIds, orderIdRemap),
      discoveredOrderIds: remapOrderIdList(gameState.orders.discoveredOrderIds, orderIdRemap),
      completedOrderIds: remapOrderIdList(gameState.orders.completedOrderIds, orderIdRemap),
      failedOrderIds: remapOrderIdList(gameState.orders.failedOrderIds, orderIdRemap),
    },
    pc: normalizePcState(
      gameState.pc as typeof gameState.pc & {
        components?: Record<string, { level?: number; score?: number } | null>;
      },
      currentPcTiers,
    ),
    timers: {
      ...gameState.timers,
      activeOrder: remappedOrderTimer,
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
      hasSeenIntro: shopGameState.meta.hasSeenIntro ?? true,
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
      friends: (shopGameState.social.friends ?? []).filter(
        (friend) => friend.isActive !== false && friend.ordersGivenCount < friend.maxOrdersGiven,
      ),
      pendingEncounters: shopGameState.social.pendingEncounters ?? [],
      friendOrderRotationIndex: shopGameState.social.friendOrderRotationIndex ?? 0,
    },
    learning: {
      ...shopGameState.learning,
      availableBookIds: getAvailableBookIds(shopGameState.world.availableBooks, shopGameState.skills),
    },
    orders: {
      ...shopGameState.orders,
      activeOrderSource: shopGameState.orders.activeOrderSource ?? null,
      discoveredOrderIds: shopGameState.orders.discoveredOrderIds ?? [],
    },
    pc: normalizePcState(
      shopGameState.pc as typeof shopGameState.pc & {
        components?: Record<string, { level?: number; score?: number } | null>;
      },
      shopGameState.world.availablePcTiers,
    ),
  };
}
