import { createStore } from "zustand/vanilla";

import {
  buyBook,
  completeActiveBook,
  createInitialGameState,
  installPcPart,
  normalizeGameState,
  refreshAvailableOrders,
  resolveActiveOrder,
  startReadingBook,
  startOrder,
} from "../domain";
import type { EventLogEntry, GameState } from "../domain";
import type { CreateNewGameOptions } from "../domain/factories";

export type GameStoreState = {
  game: GameState;
  actions: {
    resetGame: (options?: CreateNewGameOptions) => void;
    hydrateGame: (gameState: GameState) => void;
    patchGame: (updater: (gameState: GameState) => GameState) => void;
    setPlayerName: (name: string) => void;
    appendLog: (entry: Omit<EventLogEntry, "id" | "at"> & Partial<Pick<EventLogEntry, "id" | "at">>) => void;
    buyAndInstallPcPart: (itemId: string) => void;
    refreshOrders: (now?: Date) => void;
    startOrder: (orderId: string, now?: Date) => void;
    resolveActiveOrder: (randomValue?: number) => void;
    buyBook: (bookId: string) => void;
    startReadingBook: (bookId: string, now?: Date) => void;
    completeActiveBook: () => void;
  };
};

function touchGameMeta(gameState: GameState, at: Date): GameState {
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

function createLogEntryId(kind: EventLogEntry["kind"], at: Date): string {
  return `log-${kind}-${at.getTime()}`;
}

export function createGameStore(options?: CreateNewGameOptions) {
  return createStore<GameStoreState>()((set) => ({
    game: createInitialGameState(options),
    actions: {
      resetGame: (resetOptions) => {
        set({
          game: createInitialGameState(resetOptions),
        });
      },
      hydrateGame: (gameState) => {
        set({
          game: touchGameMeta(normalizeGameState(gameState), new Date()),
        });
      },
      patchGame: (updater) => {
        set((state) => ({
          game: touchGameMeta(normalizeGameState(updater(state.game)), new Date()),
        }));
      },
      setPlayerName: (name) => {
        set((state) => ({
          game: touchGameMeta(
            normalizeGameState({
              ...state.game,
              player: {
                ...state.game.player,
                name,
              },
            }),
            new Date(),
          ),
        }));
      },
      appendLog: (entry) => {
        const now = new Date();
        const at = entry.at ?? now.toISOString();
        const id = entry.id ?? createLogEntryId(entry.kind, now);

        set((state) => ({
          game: touchGameMeta(
            {
              ...normalizeGameState(state.game),
              logs: [
                {
                  ...entry,
                  id,
                  at,
                },
                ...state.game.logs,
              ],
            },
            now,
          ),
        }));
      },
      buyAndInstallPcPart: (itemId) => {
        const now = new Date();

        set((state) => ({
          game: touchGameMeta(
            refreshAvailableOrders(installPcPart(state.game, itemId), now),
            now,
          ),
        }));
      },
      refreshOrders: (now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(refreshAvailableOrders(state.game, now), now),
        }));
      },
      startOrder: (orderId, now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startOrder(state.game, orderId, now), now),
        }));
      },
      resolveActiveOrder: (randomValue) => {
        const now = new Date();
        const roll = randomValue ?? Math.random();

        set((state) => {
          const nextGame = refreshAvailableOrders(resolveActiveOrder(state.game, roll), now);
          const resolvedOrderId = state.game.orders.activeOrderId;
          const resolvedOrder = resolvedOrderId
            ? state.game.world.orderPool.find((order) => order.id === resolvedOrderId)
            : undefined;
          const failed = resolvedOrder ? roll < resolvedOrder.failureChancePct / 100 : false;
          const logKind = failed ? "order_failed" : "order_completed";
          const message = resolvedOrder
            ? failed
              ? `Провален заказ: ${resolvedOrder.title}`
              : `Завершен заказ: ${resolvedOrder.title}`
            : "Завершено разрешение активного заказа";

          return {
            game: touchGameMeta(
              {
                ...nextGame,
                logs: [
                  {
                    id: createLogEntryId(logKind, now),
                    at: now.toISOString(),
                    kind: logKind,
                    message,
                  },
                  ...nextGame.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      buyBook: (bookId) => {
        const now = new Date();

        set((state) => ({
          game: touchGameMeta(buyBook(state.game, bookId), now),
        }));
      },
      startReadingBook: (bookId, now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startReadingBook(state.game, bookId, now), now),
        }));
      },
      completeActiveBook: () => {
        const now = new Date();

        set((state) => {
          const activeBookId = state.game.learning.activeBookId;
          const activeBook = activeBookId
            ? state.game.world.availableBooks.find((book) => book.id === activeBookId)
            : undefined;
          const nextGame = completeActiveBook(state.game);

          return {
            game: touchGameMeta(
              {
                ...nextGame,
                logs: activeBook
                  ? [
                      {
                        id: createLogEntryId("book_completed", now),
                        at: now.toISOString(),
                        kind: "book_completed",
                        message: `Прочитана книга: ${activeBook.title}`,
                      },
                      ...nextGame.logs,
                    ]
                  : nextGame.logs,
              },
              now,
            ),
          };
        });
      },
    },
  }));
}

export const gameStore = createGameStore();
