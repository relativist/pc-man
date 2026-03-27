import { createActivityTimer } from "../factories";
import { convertGameDaysToMinutes } from "../rules";
import { applyQualificationPoints } from "../rules/qualification-rules";
import { normalizeGameState } from "../utils";
import type { Book, GameState, SkillTrackId } from "../types";

function getBookById(gameState: GameState, bookId: string): Book | undefined {
  return gameState.world.availableBooks.find((book) => book.id === bookId);
}

function getOwnedUnreadBookIds(gameState: GameState): string[] {
  return gameState.learning.ownedBookIds.filter(
    (ownedBookId) => !gameState.learning.completedBookIds.includes(ownedBookId),
  );
}

function resolveUniversalBookRewardTrack(gameState: GameState): SkillTrackId {
  if (gameState.career.currentTrack && gameState.career.currentTrack !== "cto") {
    return gameState.career.currentTrack;
  }

  const strongestTrack = Object.values(gameState.skills.tracks).sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.level !== left.level) {
      return right.level - left.level;
    }

    return left.track.localeCompare(right.track);
  })[0];

  return strongestTrack?.track ?? "qa";
}

function resolveBookRewardTrack(gameState: GameState, book: Book): SkillTrackId | null {
  if (book.track === "universal") {
    return resolveUniversalBookRewardTrack(gameState);
  }

  if (book.track === "cto") {
    return null;
  }

  return book.track;
}

export function canAffordBook(gameState: GameState, bookId: string): boolean {
  const book = getBookById(gameState, bookId);
  const hasPendingBook = getOwnedUnreadBookIds(gameState).length > 0;

  return Boolean(book && gameState.player.money >= book.price && !hasPendingBook);
}

export function buyBook(gameState: GameState, bookId: string, now: Date = new Date()): GameState {
  const book = getBookById(gameState, bookId);

  if (!book) {
    throw new Error(`Book not found: ${bookId}`);
  }

  if (!gameState.learning.availableBookIds.includes(bookId)) {
    throw new Error(`Book is not available yet: ${bookId}`);
  }

  if (gameState.learning.ownedBookIds.includes(bookId)) {
    return gameState;
  }

  if (getOwnedUnreadBookIds(gameState).length > 0) {
    throw new Error("Finish the current book before buying another one");
  }

  if (gameState.player.money < book.price) {
    throw new Error(`Not enough money to buy book: ${bookId}`);
  }

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money - book.price,
    },
    learning: {
      ...gameState.learning,
      ownedBookIds: [...gameState.learning.ownedBookIds, bookId],
      activeBookId: bookId,
    },
    timers: {
      ...gameState.timers,
      learning: createActivityTimer(
        "learning",
        now,
        convertGameDaysToMinutes(book.durationDays),
        bookId,
      ),
    },
  });
}

export function startReadingBook(
  gameState: GameState,
  bookId: string,
  now: Date = new Date(),
): GameState {
  const book = getBookById(gameState, bookId);

  if (!book) {
    throw new Error(`Book not found: ${bookId}`);
  }

  if (!gameState.learning.ownedBookIds.includes(bookId)) {
    throw new Error(`Book must be purchased before reading: ${bookId}`);
  }

  if (gameState.learning.completedBookIds.includes(bookId)) {
    throw new Error(`Book already completed: ${bookId}`);
  }

  if (gameState.learning.activeBookId) {
    throw new Error("Another book is already being read");
  }

  return normalizeGameState({
    ...gameState,
    learning: {
      ...gameState.learning,
      activeBookId: bookId,
    },
    timers: {
      ...gameState.timers,
      learning: createActivityTimer(
        "learning",
        now,
        convertGameDaysToMinutes(book.durationDays),
        bookId,
      ),
    },
  });
}

export function completeActiveBook(gameState: GameState): GameState {
  const activeBookId = gameState.learning.activeBookId;

  if (!activeBookId) {
    throw new Error("No active book to complete");
  }

  const book = getBookById(gameState, activeBookId);
  if (!book) {
    throw new Error(`Active book not found: ${activeBookId}`);
  }

  const rewardTrack = resolveBookRewardTrack(gameState, book);

  const nextSkills =
    rewardTrack === null
      ? gameState.skills
      : {
          ...gameState.skills,
          tracks: {
            ...gameState.skills.tracks,
            [rewardTrack]: applyQualificationPoints(
              {
                ...gameState.skills.tracks[rewardTrack],
                booksCompleted: [
                  ...gameState.skills.tracks[rewardTrack].booksCompleted,
                  activeBookId,
                ],
              },
              book.qualificationPoints,
            ),
          },
        };

  return normalizeGameState({
    ...gameState,
    skills: nextSkills,
    learning: {
      ...gameState.learning,
      activeBookId: null,
      completedBookIds: gameState.learning.completedBookIds.includes(activeBookId)
        ? gameState.learning.completedBookIds
        : [...gameState.learning.completedBookIds, activeBookId],
    },
    timers: {
      ...gameState.timers,
      learning: null,
    },
  });
}
