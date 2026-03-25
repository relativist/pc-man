import { useStore } from "zustand";

import { gameStore } from "../state";
import type { GameStoreState } from "../state";

export function useGameStore<T>(selector: (state: GameStoreState) => T): T {
  return useStore(gameStore, selector);
}
