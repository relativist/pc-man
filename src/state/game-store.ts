import { createStore } from "zustand/vanilla";

import {
  acceptVacancy,
  advanceGameState,
  buyBook,
  completeHealing,
  completeActiveBook,
  completeWalk,
  createInitialGameState,
  doWorkout,
  eatMeal,
  giveSpouseGift,
  installPcPart,
  normalizeGameState,
  refreshAvailableOrders,
  resolveActiveOrder,
  acceptChildSuggestion,
  startHealing,
  startJobSearch,
  startReadingBook,
  startOrder,
  startWalk,
  completeJobSearch,
  spouseGiftPrice,
  vacancyTemplates,
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
    startJobSearch: (now?: Date) => void;
    completeJobSearch: (now?: Date) => void;
    acceptVacancy: (vacancyId: string, now?: Date) => void;
    eatMeal: () => void;
    doWorkout: () => void;
    startHealing: (now?: Date) => void;
    completeHealing: () => void;
    startWalk: (now?: Date) => void;
    completeWalk: () => void;
    giveSpouseGift: () => void;
    acceptChildSuggestion: () => void;
    settleToNow: (now?: Date) => void;
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

function settleGame(gameState: GameState, now: Date): GameState {
  return advanceGameState(gameState, now);
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
        const now = new Date();
        set({
          game: touchGameMeta(settleGame(normalizeGameState(gameState), now), now),
        });
      },
      patchGame: (updater) => {
        const now = new Date();
        set((state) => ({
          game: touchGameMeta(normalizeGameState(updater(settleGame(state.game, now))), now),
        }));
      },
      setPlayerName: (name) => {
        const now = new Date();
        set((state) => {
          const settledGame = settleGame(state.game, now);

          return {
            game: touchGameMeta(
              normalizeGameState({
                ...settledGame,
                player: {
                  ...settledGame.player,
                  name,
                },
              }),
              now,
            ),
          };
        });
      },
      appendLog: (entry) => {
        const now = new Date();
        const at = entry.at ?? now.toISOString();
        const id = entry.id ?? createLogEntryId(entry.kind, now);

        set((state) => {
          const settledGame = settleGame(state.game, now);

          return {
            game: touchGameMeta(
              {
                ...normalizeGameState(settledGame),
                logs: [
                  {
                    ...entry,
                    id,
                    at,
                  },
                  ...settledGame.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      buyAndInstallPcPart: (itemId) => {
        const now = new Date();

        set((state) => ({
          game: touchGameMeta(
            refreshAvailableOrders(installPcPart(settleGame(state.game, now), itemId), now),
            now,
          ),
        }));
      },
      refreshOrders: (now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(refreshAvailableOrders(settleGame(state.game, now), now), now),
        }));
      },
      startOrder: (orderId, now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startOrder(settleGame(state.game, now), orderId, now), now),
        }));
      },
      resolveActiveOrder: (randomValue) => {
        const now = new Date();
        const roll = randomValue ?? Math.random();

        set((state) => {
          const settledGame = settleGame(state.game, now);
          const nextGame = refreshAvailableOrders(resolveActiveOrder(settledGame, roll), now);
          const resolvedOrderId = settledGame.orders.activeOrderId;
          const resolvedOrder = resolvedOrderId
            ? settledGame.world.orderPool.find((order) => order.id === resolvedOrderId)
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
          game: touchGameMeta(buyBook(settleGame(state.game, now), bookId), now),
        }));
      },
      startReadingBook: (bookId, now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startReadingBook(settleGame(state.game, now), bookId, now), now),
        }));
      },
      completeActiveBook: () => {
        const now = new Date();

        set((state) => {
          const settledGame = settleGame(state.game, now);
          const activeBookId = settledGame.learning.activeBookId;
          const activeBook = activeBookId
            ? settledGame.world.availableBooks.find((book) => book.id === activeBookId)
            : undefined;
          const nextGame = completeActiveBook(settledGame);

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
      startJobSearch: (now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startJobSearch(settleGame(state.game, now), now), now),
        }));
      },
      completeJobSearch: (now = new Date()) => {
        set((state) => {
          const nextGame = completeJobSearch(settleGame(state.game, now), vacancyTemplates, now);

          return {
            game: touchGameMeta(
              {
                ...nextGame,
                logs: [
                  {
                    id: createLogEntryId("job_offer_received", now),
                    at: now.toISOString(),
                    kind: "job_offer_received",
                    message: `Получено вакансий: ${nextGame.career.jobSearchResultIds.length}`,
                  },
                  ...nextGame.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      acceptVacancy: (vacancyId, now = new Date()) => {
        set((state) => {
          const settledGame = settleGame(state.game, now);
          const vacancy = settledGame.world.activeVacancies.find((item) => item.id === vacancyId);
          const nextGame = acceptVacancy(settledGame, vacancyId, now);

          return {
            game: touchGameMeta(
              {
                ...nextGame,
                logs: vacancy
                  ? [
                      {
                        id: createLogEntryId("job_changed", now),
                        at: now.toISOString(),
                        kind: "job_changed",
                        message: `Принята вакансия: ${vacancy.formalTitle} в новой компании`,
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
      eatMeal: () => {
        const now = new Date();

        set((state) => {
          const settledGame = settleGame(state.game, now);

          return {
            game: touchGameMeta(
              {
                ...eatMeal(settledGame),
                logs: [
                  {
                    id: createLogEntryId("salary_paid", now),
                    at: now.toISOString(),
                    kind: "salary_paid",
                    message: "Герой поел и восстановил часть сил.",
                  },
                  ...settledGame.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      doWorkout: () => {
        const now = new Date();

        set((state) => ({
          game: touchGameMeta(doWorkout(settleGame(state.game, now)), now),
        }));
      },
      startHealing: (now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startHealing(settleGame(state.game, now), now), now),
        }));
      },
      completeHealing: () => {
        const now = new Date();

        set((state) => ({
          game: touchGameMeta(completeHealing(settleGame(state.game, now)), now),
        }));
      },
      startWalk: (now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(startWalk(settleGame(state.game, now), now), now),
        }));
      },
      completeWalk: () => {
        const now = new Date();

        set((state) => {
          const settledGame = settleGame(state.game, now);
          const resolution = completeWalk(settledGame, now);

          return {
            game: touchGameMeta(
              {
                ...resolution.game,
                logs: [
                  ...resolution.logs.map((entry, index) => ({
                    id: createLogEntryId(entry.kind, new Date(now.getTime() + index)),
                    at: new Date(now.getTime() + index).toISOString(),
                    kind: entry.kind,
                    message: entry.message,
                  })),
                  ...resolution.game.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      giveSpouseGift: () => {
        const now = new Date();

        set((state) => {
          const settledGame = settleGame(state.game, now);

          return {
            game: touchGameMeta(
              {
                ...giveSpouseGift(settledGame),
                logs: [
                  {
                    id: createLogEntryId("gift_given", now),
                    at: now.toISOString(),
                    kind: "gift_given",
                    message: `Подарок супруге куплен за $${spouseGiftPrice}. Отношения стали теплее.`,
                  },
                  ...settledGame.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      acceptChildSuggestion: () => {
        const now = new Date();

        set((state) => {
          const settledGame = settleGame(state.game, now);

          return {
            game: touchGameMeta(
              {
                ...acceptChildSuggestion(settledGame),
                logs: [
                  {
                    id: createLogEntryId("child_born", now),
                    at: now.toISOString(),
                    kind: "child_born",
                    message: "Семья решила, что пора заводить ребенка. Расходов станет больше, но и бонусы вырастут.",
                  },
                  ...settledGame.logs,
                ],
              },
              now,
            ),
          };
        });
      },
      settleToNow: (now = new Date()) => {
        set((state) => ({
          game: touchGameMeta(settleGame(state.game, now), now),
        }));
      },
    },
  }));
}

export const gameStore = createGameStore();
