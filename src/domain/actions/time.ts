import { books, vacancyTemplates } from "../catalogs";
import { createActivityTimer } from "../factories";
import { normalizeGameState } from "../utils";
import type { EventLogEntry, EventLogKind, GameOverReason, GameState } from "../types";
import { completeJobSearch } from "./career";
import { completeActiveBook } from "./learning";
import { completeHealing } from "./life";
import { refreshAvailableOrders, resolveActiveOrder } from "./orders";
import { completeWalk } from "./social";

const minuteMs = 60_000;
const hungerPerMonth = 6;
const fitnessDecayPerMonth = 0.8;
const moodDecayPerMonth = 1.2;
const baseHealthDecayPerMonth = 0.25;
const agingHealthPenaltyPerMonth = 0.75;
const hungerHealthPenaltyPerMonth = 1.4;
const overweightHealthPenaltyPerMonth = 0.65;
const weightGainPerMonth = 0.22;
const underweightHealthPenaltyPerMonth = 0.4;

type AdvanceDraft = {
  game: GameState;
  logs: EventLogEntry[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createLog(kind: EventLogKind, message: string, at: Date): EventLogEntry {
  return {
    id: `log-${kind}-${at.getTime()}-${Math.floor(Math.random() * 10_000)}`,
    at: at.toISOString(),
    kind,
    message,
  };
}

function createSeededUnit(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return (hash % 10_000) / 10_000;
}

function getLastOpenedAt(gameState: GameState): Date {
  return new Date(gameState.meta.lastOpenedAt ?? gameState.meta.updatedAt);
}

function getNextDueTime(gameState: GameState): Date | null {
  const timers = Object.values(gameState.timers).filter(
    (timer): timer is NonNullable<(typeof gameState.timers)[keyof typeof gameState.timers]> => Boolean(timer),
  );

  if (timers.length === 0) {
    return null;
  }

  return timers.reduce((earliest, timer) => {
    const endsAt = new Date(timer.endsAt);
    return endsAt.getTime() < earliest.getTime() ? endsAt : earliest;
  }, new Date(timers[0].endsAt));
}

function clearAllTimers(gameState: GameState): GameState {
  return {
    ...gameState,
    timers: {
      learning: null,
      jobSearch: null,
      salaryCycle: null,
      activeOrder: null,
      walk: null,
      healing: null,
    },
  };
}

function resolveGameOverReason(gameState: GameState): GameOverReason {
  if (gameState.player.hunger >= 100) {
    return "hunger";
  }

  if (gameState.player.health <= 0) {
    return "illness";
  }

  if (gameState.player.ageYears >= 100 || (gameState.player.ageYears >= 85 && gameState.player.health <= 20)) {
    return "old_age";
  }

  return null;
}

function finalizeGameOver(gameState: GameState, reason: Exclude<GameOverReason, null>, at: Date): AdvanceDraft {
  const nextState = normalizeGameState(
    clearAllTimers({
      ...gameState,
      player: {
        ...gameState.player,
        isAlive: false,
        hunger: clamp(gameState.player.hunger, 0, 100),
        health: clamp(gameState.player.health, 0, 100),
      },
      meta: {
        ...gameState.meta,
        isGameOver: true,
        gameOverReason: reason,
      },
    }),
  );

  return {
    game: nextState,
    logs: [
      createLog(
        "game_over",
        reason === "hunger"
          ? "Герой умер от голода. Бытовая часть была полностью проигнорирована."
          : reason === "illness"
            ? "Герой умер из-за критического состояния здоровья."
            : "Герой умер от старости и износа организма.",
        at,
      ),
    ],
  };
}

function applyPassiveLifeProgress(gameState: GameState, from: Date, to: Date): AdvanceDraft {
  const elapsedMinutes = Math.max(0, (to.getTime() - from.getTime()) / minuteMs);

  if (elapsedMinutes <= 0 || gameState.meta.isGameOver || !gameState.player.isAlive) {
    return {
      game: gameState,
      logs: [],
    };
  }

  const ageYears = Number((gameState.player.ageYears + elapsedMinutes / 10).toFixed(1));
  const nextHunger = clamp(gameState.player.hunger + elapsedMinutes * hungerPerMonth, 0, 100);
  const nextFitness = clamp(gameState.player.fitness - elapsedMinutes * fitnessDecayPerMonth, 0, 100);
  const nextMood = clamp(gameState.player.mood - elapsedMinutes * moodDecayPerMonth, 0, 100);
  const nextWeight = clamp(
    gameState.player.weight + elapsedMinutes * Math.max(0.08, weightGainPerMonth - nextFitness / 300),
    40,
    180,
  );

  const healthPenalty =
    elapsedMinutes * baseHealthDecayPerMonth +
    (ageYears >= 60 ? elapsedMinutes * agingHealthPenaltyPerMonth : 0) +
    (nextHunger >= 80 ? elapsedMinutes * hungerHealthPenaltyPerMonth : 0) +
    (nextWeight >= 110 ? elapsedMinutes * overweightHealthPenaltyPerMonth : 0) +
    (nextWeight <= 50 ? elapsedMinutes * underweightHealthPenaltyPerMonth : 0);

  const progressed = normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      ageYears,
      hunger: nextHunger,
      fitness: nextFitness,
      mood: nextMood,
      weight: nextWeight,
      health: clamp(gameState.player.health - healthPenalty, 0, 100),
    },
  });

  const gameOverReason = resolveGameOverReason(progressed);
  if (gameOverReason) {
    return finalizeGameOver(progressed, gameOverReason, to);
  }

  return {
    game: progressed,
    logs: [],
  };
}

function processSalaryCycle(gameState: GameState, at: Date): AdvanceDraft {
  if (
    !gameState.timers.salaryCycle ||
    gameState.career.employmentStatus !== "employed" ||
    !gameState.career.monthlySalaryActual
  ) {
    return {
      game: gameState,
      logs: [],
    };
  }

  const nextState = normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money + gameState.career.monthlySalaryActual,
    },
    timers: {
      ...gameState.timers,
      salaryCycle: createActivityTimer(
        "salary_cycle",
        at,
        1,
        gameState.career.currentJobId,
      ),
    },
  });

  const currentVacancy = gameState.career.currentJobId
    ? gameState.world.activeVacancies.find((vacancy) => vacancy.id === gameState.career.currentJobId)
    : null;

  return {
    game: nextState,
    logs: [
      createLog(
        "salary_paid",
        currentVacancy
          ? `Начислена зарплата за месяц: $${gameState.career.monthlySalaryActual} за должность ${currentVacancy.formalTitle}.`
          : `Начислена зарплата за месяц: $${gameState.career.monthlySalaryActual}.`,
        at,
      ),
    ],
  };
}

function processLearning(gameState: GameState, at: Date): AdvanceDraft {
  if (!gameState.timers.learning || !gameState.learning.activeBookId) {
    return { game: gameState, logs: [] };
  }

  const book = books.find((item) => item.id === gameState.learning.activeBookId);
  const nextState = completeActiveBook(gameState);

  return {
    game: nextState,
    logs: book
      ? [createLog("book_completed", `Прочитана книга: ${book.title}`, at)]
      : [],
  };
}

function processJobSearch(gameState: GameState, at: Date): AdvanceDraft {
  if (!gameState.timers.jobSearch || !gameState.career.jobSearchInProgress) {
    return { game: gameState, logs: [] };
  }

  const nextState = completeJobSearch(gameState, vacancyTemplates, at);

  return {
    game: nextState,
    logs: [
      createLog(
        "job_offer_received",
        `Поиск завершен. Получено вакансий: ${nextState.career.jobSearchResultIds.length}.`,
        at,
      ),
    ],
  };
}

function processActiveOrder(gameState: GameState, at: Date): AdvanceDraft {
  if (!gameState.timers.activeOrder || !gameState.orders.activeOrderId) {
    return { game: gameState, logs: [] };
  }

  const order = gameState.world.orderPool.find((item) => item.id === gameState.orders.activeOrderId);
  const roll = createSeededUnit(`${gameState.orders.activeOrderId}-${at.toISOString()}`);
  const failed = order ? roll < order.failureChancePct / 100 : false;
  const nextState = resolveActiveOrder(gameState, roll);

  return {
    game: nextState,
    logs: order
      ? [
          createLog(
            failed ? "order_failed" : "order_completed",
            failed ? `Провален заказ: ${order.title}` : `Завершен заказ: ${order.title}`,
            at,
          ),
        ]
      : [],
  };
}

function processWalk(gameState: GameState, at: Date): AdvanceDraft {
  if (!gameState.timers.walk) {
    return { game: gameState, logs: [] };
  }

  const baseSeed = `${gameState.timers.walk.id}-${at.toISOString()}`;
  const rolls = [0, 1, 2, 3, 4, 5].map((offset) =>
    createSeededUnit(`${baseSeed}-${offset}`),
  );
  const resolution = completeWalk(gameState, at, rolls);

  return {
    game: resolution.game,
    logs: resolution.logs.map((entry, index) =>
      createLog(entry.kind, entry.message, new Date(at.getTime() + index)),
    ),
  };
}

function processHealing(gameState: GameState, at: Date): AdvanceDraft {
  if (!gameState.timers.healing) {
    return { game: gameState, logs: [] };
  }

  return {
    game: completeHealing(gameState),
    logs: [],
  };
}

function appendLogs(gameState: GameState, logs: EventLogEntry[]): GameState {
  if (logs.length === 0) {
    return gameState;
  }

  const nextLogs = [...logs, ...gameState.logs].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );

  return {
    ...gameState,
    logs: nextLogs,
  };
}

function processDueTimers(gameState: GameState, at: Date): AdvanceDraft {
  let nextGame = gameState;
  const logs: EventLogEntry[] = [];

  if (nextGame.timers.salaryCycle && new Date(nextGame.timers.salaryCycle.endsAt).getTime() <= at.getTime()) {
    const salaryResult = processSalaryCycle(nextGame, at);
    nextGame = salaryResult.game;
    logs.push(...salaryResult.logs);
  }

  if (nextGame.timers.jobSearch && new Date(nextGame.timers.jobSearch.endsAt).getTime() <= at.getTime()) {
    const searchResult = processJobSearch(nextGame, at);
    nextGame = searchResult.game;
    logs.push(...searchResult.logs);
  }

  if (nextGame.timers.learning && new Date(nextGame.timers.learning.endsAt).getTime() <= at.getTime()) {
    const learningResult = processLearning(nextGame, at);
    nextGame = learningResult.game;
    logs.push(...learningResult.logs);
  }

  if (nextGame.timers.activeOrder && new Date(nextGame.timers.activeOrder.endsAt).getTime() <= at.getTime()) {
    const orderResult = processActiveOrder(nextGame, at);
    nextGame = orderResult.game;
    logs.push(...orderResult.logs);
  }

  if (nextGame.timers.walk && new Date(nextGame.timers.walk.endsAt).getTime() <= at.getTime()) {
    const walkResult = processWalk(nextGame, at);
    nextGame = walkResult.game;
    logs.push(...walkResult.logs);
  }

  if (nextGame.timers.healing && new Date(nextGame.timers.healing.endsAt).getTime() <= at.getTime()) {
    const healingResult = processHealing(nextGame, at);
    nextGame = healingResult.game;
    logs.push(...healingResult.logs);
  }

  return {
    game: appendLogs(nextGame, logs),
    logs: [],
  };
}

export function advanceGameState(gameState: GameState, now: Date = new Date()): GameState {
  if (gameState.meta.isGameOver || !gameState.player.isAlive) {
    return normalizeGameState(gameState);
  }

  let cursor = getLastOpenedAt(gameState);
  let nextGame = normalizeGameState(gameState);

  if (cursor.getTime() > now.getTime()) {
    return nextGame;
  }

  while (true) {
    const nextDueTime = getNextDueTime(nextGame);

    if (!nextDueTime || nextDueTime.getTime() > now.getTime()) {
      break;
    }

    const passiveResult = applyPassiveLifeProgress(nextGame, cursor, nextDueTime);
    nextGame = appendLogs(passiveResult.game, passiveResult.logs);

    if (nextGame.meta.isGameOver || !nextGame.player.isAlive) {
      return refreshAvailableOrders(nextGame, nextDueTime);
    }

    const dueResult = processDueTimers(nextGame, nextDueTime);
    nextGame = dueResult.game;
    cursor = nextDueTime;
  }

  const finalPassive = applyPassiveLifeProgress(nextGame, cursor, now);
  nextGame = appendLogs(finalPassive.game, finalPassive.logs);

  return refreshAvailableOrders(nextGame, now);
}
