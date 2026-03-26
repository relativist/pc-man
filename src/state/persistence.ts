import { normalizeGameState } from "../domain";
import type { GameState } from "../domain";

const storageKey = "pc-man.game-state.v1";

type PersistedGameSnapshot = {
  game: GameState;
  savedAt: string;
};

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isPersistedGameSnapshot(value: unknown): value is PersistedGameSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<PersistedGameSnapshot>;
  return Boolean(snapshot.game && typeof snapshot.savedAt === "string");
}

export function loadPersistedGame(): GameState | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSnapshot = window.localStorage.getItem(storageKey);
    if (!rawSnapshot) {
      return null;
    }

    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
    if (!isPersistedGameSnapshot(parsedSnapshot)) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return normalizeGameState(parsedSnapshot.game);
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function savePersistedGame(game: GameState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const snapshot: PersistedGameSnapshot = {
    game,
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota and browser privacy errors in MVP.
  }
}

export function clearPersistedGame(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
