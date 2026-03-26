import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { advanceGameState, normalizeGameState } from "./domain";
import type { GameState } from "./domain";
import { gameStore } from "./state";
import { loadPersistedGame, savePersistedGame } from "./state/persistence";
import { appRouter } from "./ui/router";
import "./ui/styles.css";

function touchLoadedGame(gameState: GameState, at: Date): GameState {
  const atIso = at.toISOString();

  return {
    ...gameState,
    meta: {
      ...gameState.meta,
      updatedAt: atIso,
      lastOpenedAt: atIso,
    },
  };
}

const persistedGame = loadPersistedGame();

if (persistedGame) {
  const now = new Date();
  const restoredGame = touchLoadedGame(advanceGameState(normalizeGameState(persistedGame), now), now);

  gameStore.setState((state) => ({
    ...state,
    game: restoredGame,
  }));
}

savePersistedGame(gameStore.getState().game);
gameStore.subscribe((state, previousState) => {
  if (state.game !== previousState.game) {
    savePersistedGame(state.game);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={appRouter} />
  </React.StrictMode>,
);
