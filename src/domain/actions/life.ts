import { createActivityTimer } from "../factories";
import { convertGameDaysToMinutes } from "../rules";
import { normalizeGameState } from "../utils";
import type { GameState } from "../types";

const mealPrice = 35;
const workoutMoodCost = 4;
const healingPrice = 650;
const healingDurationDays = 7;
const rejuvenationYears = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function eatMeal(gameState: GameState): GameState {
  if (gameState.player.money < mealPrice) {
    throw new Error("Not enough money for food");
  }

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money - mealPrice,
      hunger: clamp(gameState.player.hunger - 28, 0, 100),
      health: clamp(gameState.player.health + 4, 0, 100),
      mood: clamp(gameState.player.mood + 3, 0, 100),
      weight: clamp(gameState.player.weight + 1, 40, 180),
    },
  });
}

export function doWorkout(gameState: GameState): GameState {
  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      fitness: clamp(gameState.player.fitness + 10, 0, 100),
      health: clamp(gameState.player.health + 6, 0, 100),
      hunger: clamp(gameState.player.hunger + 10, 0, 100),
      mood: clamp(gameState.player.mood - workoutMoodCost + 8, 0, 100),
      weight: clamp(gameState.player.weight - 1, 40, 180),
    },
  });
}

export function startHealing(gameState: GameState, now: Date = new Date()): GameState {
  if (gameState.player.money < healingPrice) {
    throw new Error("Not enough money for healing");
  }

  if (gameState.timers.healing) {
    throw new Error("Healing already in progress");
  }

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money - healingPrice,
    },
    timers: {
      ...gameState.timers,
      healing: createActivityTimer(
        "healing",
        now,
        convertGameDaysToMinutes(healingDurationDays),
        "healing-course",
      ),
    },
  });
}

export function completeHealing(gameState: GameState): GameState {
  if (!gameState.timers.healing) {
    throw new Error("No healing in progress");
  }

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      health: clamp(gameState.player.health + 30, 0, 100),
      mood: clamp(gameState.player.mood + 10, 0, 100),
      fitness: clamp(gameState.player.fitness + 4, 0, 100),
      ageYears: clamp(gameState.player.ageYears - rejuvenationYears, 18, 120),
    },
    timers: {
      ...gameState.timers,
      healing: null,
    },
  });
}
