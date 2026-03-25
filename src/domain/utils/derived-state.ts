import { ratedPcSlots, requiredPcSlots } from "../catalogs/pc-parts";
import type {
  Book,
  GameState,
  PcComponentCatalogItem,
  PlayerState,
  SkillState,
} from "../types";

function isBookUnlocked(book: Book, skills: SkillState): boolean {
  if (!book.unlockRequirements) {
    return true;
  }

  const { track, minLevel, minPoints } = book.unlockRequirements;

  if (!track) {
    return true;
  }

  const progress = skills.tracks[track];
  if (!progress) {
    return false;
  }

  if (minLevel && progress.level < minLevel) {
    return false;
  }

  if (minPoints && progress.points < minPoints) {
    return false;
  }

  return true;
}

export function calculateCapital(player: Pick<PlayerState, "money" | "realEstateValue">): number {
  return player.money + player.realEstateValue;
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
  return {
    ...gameState,
    player: {
      ...gameState.player,
      capital: calculateCapital(gameState.player),
    },
    learning: {
      ...gameState.learning,
      availableBookIds: getAvailableBookIds(gameState.world.availableBooks, gameState.skills),
    },
    pc: {
      ...gameState.pc,
      isWorkingPcReady: isWorkingPcReady(gameState.pc.components),
      ratingScore: calculatePcRatingScore(gameState.pc.components),
    },
  };
}
