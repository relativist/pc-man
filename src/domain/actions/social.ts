import { createActivityTimer } from "../factories";
import { convertGameDaysToMinutes } from "../rules";
import { normalizeGameState } from "../utils";
import type { EventLogKind, FriendState, GameState, PetState, SpouseState } from "../types";

const walkDurationDays = 2;
export const spouseGiftPrice = 180;
export const maxFriends = 20;
export const maxPets = 5;
export const maxChildren = 4;

const friendNames = [
  "Леха из локалки",
  "Катя с митапа",
  "Борис Тикетов",
  "Галя Excelovna",
  "Миша Сервак",
  "Оля Кабельная",
  "Рома Бэкап",
  "Нина Формочка",
  "Вадим Дашбордов",
  "Света Пиксель",
];

const spouseNames = [
  "Алина",
  "Марина",
  "Олеся",
  "София",
  "Наташа",
  "Лера",
  "Катя",
  "Полина",
];

const petCatalog = [
  { species: "Кот", names: ["Патч", "Багет", "Кулер", "Пиксель", "Байт"] },
  { species: "Пес", names: ["Пинг", "Роутер", "Кеш", "Тестер", "Лог"] },
  { species: "Попугай", names: ["Спамыч", "Скрипт", "Линтер", "Чирик", "Глюк"] },
  { species: "Хомяк", names: ["Куки", "Бублик", "Шифр", "Вжух", "Порт"] },
  { species: "Ящер", names: ["Сокет", "Демон", "Стаб", "Краб", "Хеш"] },
];

const walkOutcomes = [
  {
    title: "Неудачное приключение",
    message: "Герой полез за атмосферой во двор и заодно зацепил карман о ржавую арматуру.",
    moneyDelta: -110,
    healthDelta: -10,
    moodDelta: -6,
  },
  {
    title: "Спокойная прогулка",
    message: "Свежий воздух и шагомер сделали свое дело. День прошел без драм, но с пользой.",
    moneyDelta: 0,
    healthDelta: 9,
    moodDelta: 6,
  },
  {
    title: "Случайная халтура",
    message: "На лавке подвернулась быстрая подработка из разряда 'помоги с этой страшной табличкой'.",
    moneyDelta: 135,
    healthDelta: 2,
    moodDelta: 4,
  },
  {
    title: "Полезный выходной",
    message: "Герой проветрил голову, много ходил и внезапно стал выглядеть живее, чем вчера.",
    moneyDelta: 35,
    healthDelta: 12,
    moodDelta: 10,
  },
  {
    title: "Сомнительный квест",
    message: "На прогулке пришлось спасать чужой пакет, кошелек и собственное достоинство одновременно.",
    moneyDelta: -55,
    healthDelta: 4,
    moodDelta: 2,
  },
] as const;

type SocialLogDraft = {
  kind: EventLogKind;
  message: string;
};

export type WalkResolution = {
  game: GameState;
  logs: SocialLogDraft[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildId(prefix: string, now: Date, suffix: string): string {
  return `${prefix}-${now.getTime()}-${suffix}`;
}

function pickByRoll<T>(items: readonly T[], roll: number): T {
  const index = Math.min(items.length - 1, Math.floor(roll * items.length));
  return items[index];
}

function getGameYearsSince(isoDate: string, now: Date): number {
  const elapsedMinutes = Math.max(0, now.getTime() - new Date(isoDate).getTime()) / 60_000;
  return elapsedMinutes / 10;
}

function createFriend(now: Date, roll: number): FriendState {
  return {
    id: buildId("friend", now, String(Math.floor(roll * 10_000))),
    name: pickByRoll(friendNames, roll),
    ordersGivenCount: 0,
    maxOrdersGiven: 3,
    isActive: true,
  };
}

function createSpouse(now: Date, roll: number): SpouseState {
  return {
    id: buildId("spouse", now, String(Math.floor(roll * 10_000))),
    name: pickByRoll(spouseNames, roll),
    relationshipLevel: 35,
    giftCount: 0,
    canSuggestChild: false,
  };
}

function createPet(now: Date, roll: number): PetState {
  const template = pickByRoll(petCatalog, roll);
  const petName = pickByRoll(template.names, 1 - roll);

  return {
    id: buildId("pet", now, String(Math.floor(roll * 10_000))),
    name: petName,
    species: template.species,
    acquiredAt: now.toISOString(),
    expectedLifeYears: roll >= 0.5 ? 3 : 2,
    isAlive: true,
  };
}

function resolvePetStatus(
  pets: PetState[],
  now: Date,
  takeRoll: () => number,
): { pets: PetState[]; deceasedPets: PetState[] } {
  const deceasedPets: PetState[] = [];

  const nextPets = pets.map((pet) => {
    if (!pet.isAlive) {
      return pet;
    }

    const ageInGameYears = getGameYearsSince(pet.acquiredAt, now);
    const nearEndOfLife = ageInGameYears >= pet.expectedLifeYears - 0.5;
    const pastExpectedLife = ageInGameYears >= pet.expectedLifeYears;

    if (!nearEndOfLife) {
      return pet;
    }

    const deathChance = pastExpectedLife ? 0.55 : 0.16;

    if (takeRoll() >= deathChance) {
      return pet;
    }

    const deceasedPet = {
      ...pet,
      isAlive: false,
    };
    deceasedPets.push(deceasedPet);

    return deceasedPet;
  });

  return {
    pets: nextPets,
    deceasedPets,
  };
}

function createRollReader(rolls: number[] = []): () => number {
  let index = 0;

  return () => {
    const nextValue = rolls[index];
    index += 1;
    return nextValue ?? Math.random();
  };
}

export function startWalk(gameState: GameState, now: Date = new Date()): GameState {
  if (gameState.timers.walk) {
    throw new Error("Walk already in progress");
  }

  return normalizeGameState({
    ...gameState,
    timers: {
      ...gameState.timers,
      walk: createActivityTimer("walk", now, convertGameDaysToMinutes(walkDurationDays), "walk"),
    },
  });
}

export function completeWalk(
  gameState: GameState,
  now: Date = new Date(),
  rolls: number[] = [],
): WalkResolution {
  if (!gameState.timers.walk) {
    throw new Error("No walk in progress");
  }

  const takeRoll = createRollReader(rolls);
  const outcome = pickByRoll(walkOutcomes, takeRoll());
  const friendRoll = takeRoll();
  const spouseRoll = takeRoll();
  const petRoll = takeRoll();

  const nextFriend =
    gameState.social.friends.length < maxFriends && friendRoll < 0.32
      ? createFriend(now, friendRoll)
      : null;

  const nextSpouse =
    gameState.social.spouse === null && spouseRoll < 0.15
      ? createSpouse(now, spouseRoll)
      : null;

  const nextPet =
    gameState.social.pets.filter((pet) => pet.isAlive).length < maxPets && petRoll < 0.22
      ? createPet(now, petRoll)
      : null;

  const petsWithNewArrival = nextPet ? [...gameState.social.pets, nextPet] : gameState.social.pets;
  const { pets: resolvedPets, deceasedPets } = resolvePetStatus(petsWithNewArrival, now, takeRoll);

  const nextMoney = clamp(gameState.player.money + outcome.moneyDelta, 0, 1_000_000);
  const nextHealth = clamp(gameState.player.health + outcome.healthDelta, 0, 100);
  const nextMood = clamp(
    gameState.player.mood + outcome.moodDelta + (nextFriend ? 4 : 0) + (nextSpouse ? 6 : 0) + (nextPet ? 5 : 0) - deceasedPets.length * 10,
    0,
    100,
  );

  const nextState = normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: nextMoney,
      health: nextHealth,
      mood: nextMood,
      hunger: clamp(gameState.player.hunger + 8, 0, 100),
      fitness: clamp(gameState.player.fitness + 6, 0, 100),
      weight: clamp(gameState.player.weight - 1, 40, 180),
    },
    social: {
      ...gameState.social,
      spouse: nextSpouse ?? gameState.social.spouse,
      friends: nextFriend ? [...gameState.social.friends, nextFriend] : gameState.social.friends,
      pets: resolvedPets,
    },
    timers: {
      ...gameState.timers,
      walk: null,
    },
  });

  const logs: SocialLogDraft[] = [
    {
      kind: "walk_completed",
      message: `${outcome.title}: ${outcome.message}`,
    },
  ];

  if (nextFriend) {
    logs.push({
      kind: "friend_found",
      message: `На прогулке появился новый знакомый: ${nextFriend.name}. Он сможет подкинуть до 3 заказов.`,
    });
  }

  if (nextSpouse) {
    logs.push({
      kind: "spouse_found",
      message: `Герой познакомился с ${nextSpouse.name}. Похоже, социальная ветка начинает приносить дивиденды.`,
    });
  }

  if (nextPet) {
    logs.push({
      kind: "pet_found",
      message: `Домой напросился новый питомец: ${nextPet.species} по имени ${nextPet.name}.`,
    });
  }

  deceasedPets.forEach((pet) => {
    logs.push({
      kind: "pet_died",
      message: `${pet.species} ${pet.name} прожил свою яркую жизнь и ушел на радугу.`,
    });
  });

  return {
    game: nextState,
    logs,
  };
}

export function giveSpouseGift(gameState: GameState): GameState {
  if (!gameState.social.spouse) {
    throw new Error("No spouse found");
  }

  if (gameState.player.money < spouseGiftPrice) {
    throw new Error("Not enough money for a gift");
  }

  const nextGiftCount = gameState.social.spouse.giftCount + 1;
  const nextRelationshipLevel = clamp(gameState.social.spouse.relationshipLevel + 14, 0, 100);

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      money: gameState.player.money - spouseGiftPrice,
      mood: clamp(gameState.player.mood + 5, 0, 100),
    },
    social: {
      ...gameState.social,
      spouse: {
        ...gameState.social.spouse,
        giftCount: nextGiftCount,
        relationshipLevel: nextRelationshipLevel,
        canSuggestChild:
          gameState.social.childrenCount < maxChildren &&
          nextGiftCount >= 2 &&
          nextRelationshipLevel >= 55,
      },
    },
  });
}

export function acceptChildSuggestion(gameState: GameState): GameState {
  if (!gameState.social.spouse?.canSuggestChild) {
    throw new Error("No child suggestion is available");
  }

  return normalizeGameState({
    ...gameState,
    player: {
      ...gameState.player,
      mood: clamp(gameState.player.mood + 8, 0, 100),
    },
    social: {
      ...gameState.social,
      childrenCount: gameState.social.childrenCount + 1,
      spouse: {
        ...gameState.social.spouse,
        canSuggestChild: false,
        relationshipLevel: clamp(gameState.social.spouse.relationshipLevel + 6, 0, 100),
      },
    },
  });
}
