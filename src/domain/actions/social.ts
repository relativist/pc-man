import { createActivityTimer } from "../factories";
import { convertGameDaysToMinutes } from "../rules";
import { normalizeGameState } from "../utils";
import { discoverOrderFromWalk } from "./orders";
import type {
  EventLogKind,
  FriendState,
  GameState,
  PendingFriendEncounter,
  PendingPetEncounter,
  PendingSocialEncounter,
  PendingSpouseEncounter,
  PetState,
  SpouseState,
} from "../types";

const walkDurationDays = 2;
export const spouseGiftPrice = 180;
export const maxFriends = 20;
export const maxPets = 5;
export const maxChildren = 4;
const walkSocialEncounterChance = 0.65;
const friendEncounterWeight = 1;
const spouseEncounterWeight = 1;
const petEncounterWeight = 1;
const firstPetEncounterWeight = 2.4;

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

const jealousyDivorceStories = [
  "Супруга увидела, как новый друг сходу занял ее любимую кружку, и объявила, что этот дом слишком мал для такой драмы.",
  "После появления питомца супруга заявила, что в семье уже достаточно существ, которые игнорируют ее просьбы.",
  "Новый знакомый слишком громко рассказывал про пассивный доход, и семейный чат сразу превратился в судебную хронику.",
  "Питомец мгновенно лег на ее подушку, и это оказалось последней геополитической каплей.",
  "Друг принес настолку на шесть часов, и супруга решила, что проще забрать имущество, чем переживать еще одну партию.",
  "Питомец переел ее дизайнерскую зелень, после чего семейный бюджет и брак одновременно перестали быть общими.",
  "Новый друг назвал роутер 'просто коробочкой', и супруга отказалась жить в такой атмосфере невежества.",
  "Питомец занял ее сторону кровати увереннее, чем герой когда-либо занимал карьерную позицию.",
  "Друг сходу предложил сделать барбекю на балконе, и супруга выбрала стратегию 'развод и конфискация'.",
  "Питомец слишком быстро стал любимцем квартиры, и ревность оформилась в имущественный спор.",
  "Новый знакомый предложил жить 'по кайфу и без таблиц', а супруга сочла это опасным культом.",
  "Питомец однажды моргнул так осуждающе, что супруга предпочла выйти из проекта целиком.",
  "Друг начал звать героя в спонтанные поездки, и семейный календарь сказал последнее слово через нотариуса.",
  "Питомец ловко выбрал именно ее свитер для ежедневной линьки, и романтика умерла первой.",
  "Новый знакомый слишком шутил про семейный бюджет, и бюджет неожиданно действительно разделили.",
  "Питомец упорно слушался только героя, а супруга решила, что так жить унизительно даже для MVP.",
  "Друг однажды произнес 'да зачем вам столько квадратных метров', и вопрос квадратных метров быстро сняли в суде.",
  "Питомец освоил пассивно-агрессивное мяуканье ровно в интонации супружеских претензий.",
  "Новый знакомый задержался на кухне до ночи с разговорами про стартап, и это было признано угрозой стабильности.",
  "Питомец неожиданно стал получать больше тепла, чем семейный диалог, и развязка наступила мгновенно.",
] as const;

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

const walkMoneyFindStories = [
  "Герой нашел купюры в кармане старой ветровки и понял, что иногда лучший инвестор это забывчивость.",
  "Из автомата выпал лишний кэшбэк наличкой, будто районный бог экономики моргнул именно в эту минуту.",
  "Под скамейкой лежала смятая заначка, которую явно потерял человек с менее развитой внимательностью.",
  "Сосед вернул древний долг за 'пять минут настроить Wi-Fi', хотя прошло примерно три сезона и одна эпоха.",
  "В куртке обнаружился аварийный резерв, спрятанный героем так надежно, что он сам его не мог найти.",
] as const;

const walkMoneyLossStories = [
  "Герой взял кофе на прогулке, потом булочку, потом еще какую-то 'полезную мелочь', и бюджет ушел в закат.",
  "Уличный музыкант играл так убедительно, что кошелек задонатил раньше мозга.",
  "В киоске внезапно продали лимонад, снеки и чувство финансовой безответственности одним чеком.",
  "Герой решил, что магнитик 'я просто вышел подышать' жизненно необходим, и деньги это решение не пережили.",
  "По пути случилась спонтанная покупка уровня 'ну смешная же штука', и наличка выбрала свободу.",
] as const;

type SocialLogDraft = {
  kind: EventLogKind;
  message: string;
};

export type WalkResolution = {
  game: GameState;
  logs: SocialLogDraft[];
};

export type AcceptPendingSocialEncounterResult = {
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

function createWalkMoneyIncident(
  currentMoney: number,
  takeRoll: () => number,
): { moneyDelta: number; message: string } | null {
  if (takeRoll() >= 0.42) {
    return null;
  }

  const isGain = takeRoll() < 0.5;
  const amount = 100 + Math.floor(takeRoll() * 101);

  if (isGain) {
    const story = pickByRoll(walkMoneyFindStories, takeRoll());

    return {
      moneyDelta: amount,
      message: `${story} Найдено $${amount}.`,
    };
  }

  const actualLoss = Math.min(amount, currentMoney);
  if (actualLoss <= 0) {
    return null;
  }

  const story = pickByRoll(walkMoneyLossStories, takeRoll());

  return {
    moneyDelta: -actualLoss,
    message: `${story} Потеряно $${actualLoss}.`,
  };
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

function createFriendEncounter(now: Date, roll: number): PendingFriendEncounter {
  const friend = createFriend(now, roll);

  return {
    id: buildId("friend-encounter", now, friend.id),
    kind: "friend",
    createdAt: now.toISOString(),
    title: "Новое знакомство",
    story: `${friend.name} заметил на лавке твой задумчивый взгляд в монитор без монитора и предложил дружить по интересам, багам и случайным подработкам.`,
    friend,
  };
}

function createSpouseEncounter(now: Date, roll: number): PendingSpouseEncounter {
  const spouse = createSpouse(now, roll);

  return {
    id: buildId("spouse-encounter", now, spouse.id),
    kind: "spouse",
    createdAt: now.toISOString(),
    title: "Судьбоносное знакомство",
    story: `${spouse.name} засмеялась над шуткой про Excel, сервера и ипотеку. Похоже, это подозрительно хороший старт для семейной ветки.`,
    spouse,
  };
}

function createPetEncounter(now: Date, roll: number): PendingPetEncounter {
  const pet = createPet(now, roll);

  return {
    id: buildId("pet-encounter", now, pet.id),
    kind: "pet",
    createdAt: now.toISOString(),
    title: "Новый питомец",
    story: `${pet.species} ${pet.name} смотрит так, будто уже решил переехать к тебе и захватить половину дивана, миску и душевное равновесие.`,
    pet,
  };
}

function resolvePetStatus(
  pets: PetState[],
  now: Date,
  takeRoll: () => number,
): { pets: PetState[]; deceasedPet: PetState | null } {
  let deceasedPet: PetState | null = null;

  const nextPets = pets.map((pet) => {
    if (!pet.isAlive || deceasedPet) {
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

    deceasedPet = {
      ...pet,
      isAlive: false,
    };

    return deceasedPet;
  });

  return {
    pets: nextPets,
    deceasedPet,
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

function pickWeightedEncounter<T>(
  items: Array<{ item: T; weight: number }>,
  roll: number,
): T | null {
  const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let cursor = roll * totalWeight;

  for (const entry of items) {
    cursor -= entry.weight;

    if (cursor <= 0) {
      return entry.item;
    }
  }

  return items[items.length - 1]?.item ?? null;
}

function createSeededUnit(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return (hash % 10_000) / 10_000;
}

function countPendingEncounters(
  encounters: PendingSocialEncounter[],
  kind: PendingSocialEncounter["kind"],
): number {
  return encounters.filter((encounter) => encounter.kind === kind).length;
}

function createAcceptedEncounterLog(encounter: PendingSocialEncounter): SocialLogDraft {
  if (encounter.kind === "friend") {
    return {
      kind: "friend_found",
      message: `Герой принял знакомство с ${encounter.friend.name}. Теперь это друг с потенциалом до 3 заказов.`,
    };
  }

  if (encounter.kind === "spouse") {
    return {
      kind: "spouse_found",
      message: `Герой решил продолжить историю с ${encounter.spouse.name}. Семейная ветка официально началась.`,
    };
  }

  return {
    kind: "pet_found",
    message: `${encounter.pet.species} ${encounter.pet.name} теперь живет с героем на постоянной основе.`,
  };
}

function getDivorceStory(seed: string): string {
  const roll = createSeededUnit(seed);
  return jealousyDivorceStories[Math.min(jealousyDivorceStories.length - 1, Math.floor(roll * jealousyDivorceStories.length))];
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
  const friendRoll = takeRoll();
  const spouseRoll = takeRoll();
  const petRoll = takeRoll();
  const encounterRoll = takeRoll();
  const encounterTypeRoll = takeRoll();

  const canMeetFriend =
    gameState.social.friends.length + countPendingEncounters(gameState.social.pendingEncounters, "friend") <
    maxFriends;
  const canMeetSpouse =
    gameState.social.spouse === null &&
    countPendingEncounters(gameState.social.pendingEncounters, "spouse") === 0;
  const livingPetCount = gameState.social.pets.filter((pet) => pet.isAlive).length;
  const pendingPetCount = countPendingEncounters(gameState.social.pendingEncounters, "pet");
  const canMeetPet =
    livingPetCount + pendingPetCount < maxPets;

  const selectedEncounterKind =
    encounterRoll < walkSocialEncounterChance
      ? pickWeightedEncounter(
          [
            canMeetFriend
              ? {
                  item: "friend" as const,
                  weight: friendEncounterWeight,
                }
              : null,
            canMeetSpouse
              ? {
                  item: "spouse" as const,
                  weight: spouseEncounterWeight,
                }
              : null,
            canMeetPet
              ? {
                  item: "pet" as const,
                  weight:
                    livingPetCount === 0 && pendingPetCount === 0
                      ? firstPetEncounterWeight
                      : petEncounterWeight,
                }
              : null,
          ].filter((entry): entry is { item: "friend" | "spouse" | "pet"; weight: number } => Boolean(entry)),
          encounterTypeRoll,
        )
      : null;

  const nextFriend =
    selectedEncounterKind === "friend" ? createFriendEncounter(now, friendRoll) : null;

  const nextSpouse =
    selectedEncounterKind === "spouse" ? createSpouseEncounter(now, spouseRoll) : null;

  const nextPet =
    selectedEncounterKind === "pet" ? createPetEncounter(now, petRoll) : null;

  const { pets: resolvedPets, deceasedPet } = resolvePetStatus(gameState.social.pets, now, takeRoll);
  const encounterCandidates = [
    nextFriend
      ? {
          kind: "friend" as const,
          encounter: nextFriend,
          moodDelta: 4,
        }
      : null,
    nextSpouse
      ? {
          kind: "spouse" as const,
          encounter: nextSpouse,
          moodDelta: 6,
        }
      : null,
    nextPet
      ? {
          kind: "pet" as const,
          encounter: nextPet,
          moodDelta: 5,
        }
      : null,
  ].filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  const selectedEncounter =
    deceasedPet || encounterCandidates.length === 0
      ? null
      : encounterCandidates[0] ?? null;
  const selectedWalkOutcome =
    deceasedPet || selectedEncounter ? null : pickByRoll(walkOutcomes, takeRoll());
  const moneyAfterWalkOutcome = clamp(
    gameState.player.money + (selectedWalkOutcome?.moneyDelta ?? 0),
    0,
    1_000_000,
  );
  const walkMoneyIncident = createWalkMoneyIncident(moneyAfterWalkOutcome, takeRoll);
  const nextMoney = clamp(moneyAfterWalkOutcome + (walkMoneyIncident?.moneyDelta ?? 0), 0, 1_000_000);
  const nextHealth = clamp(
    gameState.player.health + (selectedWalkOutcome?.healthDelta ?? 0),
    0,
    100,
  );
  const nextMood = clamp(
    gameState.player.mood +
      (selectedWalkOutcome?.moodDelta ?? 0) +
      (selectedEncounter?.moodDelta ?? 0) -
      (deceasedPet ? 10 : 0),
    0,
    100,
  );

  const baseNextState = normalizeGameState({
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
      pets: resolvedPets,
      pendingEncounters: selectedEncounter
        ? [...gameState.social.pendingEncounters, selectedEncounter.encounter]
        : gameState.social.pendingEncounters,
    },
    timers: {
      ...gameState.timers,
      walk: null,
    },
  });
  const shouldDiscoverOrder = takeRoll() < 0.35;
  const orderDiscovery = shouldDiscoverOrder
    ? discoverOrderFromWalk(baseNextState)
    : { game: baseNextState, order: null };
  const nextState = orderDiscovery.game;

  const primaryLog: SocialLogDraft | null = deceasedPet
    ? {
        kind: "pet_died",
        message: `${deceasedPet.species} ${deceasedPet.name} прожил свою яркую жизнь и ушел на радугу.`,
      }
    : selectedEncounter?.kind === "friend"
      ? {
          kind: "friend_found",
          message: `На прогулке появился новый знакомый: ${selectedEncounter.encounter.friend.name}. Знакомство ждет подтверждения.`,
        }
      : selectedEncounter?.kind === "spouse"
        ? {
            kind: "spouse_found",
            message: `Герой познакомился с ${selectedEncounter.encounter.spouse.name}. Реши, продолжать ли эту социальную историю.`,
          }
        : selectedEncounter?.kind === "pet"
          ? {
              kind: "pet_found",
              message: `Домой напрашивается ${selectedEncounter.encounter.pet.species} по имени ${selectedEncounter.encounter.pet.name}. Нужно принять решение.`,
            }
          : selectedWalkOutcome
            ? {
                kind: "walk_completed",
                message: `${selectedWalkOutcome.title}: ${selectedWalkOutcome.message}`,
              }
            : null;
  const extraMessages = [
    orderDiscovery.order
      ? `На прогулке подвернулся заказ: ${orderDiscovery.order.title}. Он добавлен в список доступных.`
      : null,
    walkMoneyIncident?.message ?? null,
  ].filter((message): message is string => Boolean(message));
  const logs =
    primaryLog === null
      ? []
      : [
          {
            ...primaryLog,
            message:
              extraMessages.length > 0
                ? `${primaryLog.message} ${extraMessages.join(" ")}`
                : primaryLog.message,
          },
        ];

  return {
    game: nextState,
    logs,
  };
}

export function acceptPendingSocialEncounter(
  gameState: GameState,
  encounterId: string,
  randomValue: number = Math.random(),
): AcceptPendingSocialEncounterResult {
  const encounter = gameState.social.pendingEncounters.find((item) => item.id === encounterId);

  if (!encounter) {
    throw new Error(`Pending encounter not found: ${encounterId}`);
  }

  const pendingEncounters = gameState.social.pendingEncounters.filter(
    (item) => item.id !== encounterId,
  );
  const hadSpouse = Boolean(gameState.social.spouse);
  const acceptedLog = createAcceptedEncounterLog(encounter);
  let nextState: GameState;

  if (encounter.kind === "friend") {
    nextState = normalizeGameState({
      ...gameState,
      social: {
        ...gameState.social,
        friends: [...gameState.social.friends, encounter.friend],
        pendingEncounters,
      },
    });
  } else if (encounter.kind === "spouse") {
    if (gameState.social.spouse) {
      throw new Error("Spouse already exists");
    }

    nextState = normalizeGameState({
      ...gameState,
      social: {
        ...gameState.social,
        spouse: encounter.spouse,
        pendingEncounters,
      },
    });
  } else {
    nextState = normalizeGameState({
      ...gameState,
      social: {
        ...gameState.social,
        pets: [...gameState.social.pets, encounter.pet],
        pendingEncounters,
      },
    });
  }

  if (!hadSpouse || encounter.kind === "spouse" || randomValue >= 0.05) {
    return {
      game: nextState,
      logs: [acceptedLog],
    };
  }

  const story = getDivorceStory(`${encounter.id}-${gameState.social.spouse?.id ?? "none"}`);
  const divorceState = normalizeGameState({
    ...nextState,
    player: {
      ...nextState.player,
      money: Math.floor(nextState.player.money / 2),
    },
    shop: {
      things: {
        currentLotId: null,
        nextLotIndex: 0,
      },
      housing: {
        currentLotId: null,
        nextLotIndex: 0,
      },
      transport: {
        currentLotId: null,
        nextLotIndex: 0,
      },
    },
    social: {
      ...nextState.social,
      spouse: null,
    },
  });

  return {
    game: divorceState,
    logs: [
      acceptedLog,
      {
        kind: "divorce",
        message: `${story} Супруга ушла, забрав все жилье, транспорт, крутые вещи и половину наличных денег.`,
      },
    ],
  };
}

export function rejectPendingSocialEncounter(
  gameState: GameState,
  encounterId: string,
): GameState {
  const encounter = gameState.social.pendingEncounters.find((item) => item.id === encounterId);

  if (!encounter) {
    throw new Error(`Pending encounter not found: ${encounterId}`);
  }

  return normalizeGameState({
    ...gameState,
    social: {
      ...gameState.social,
      pendingEncounters: gameState.social.pendingEncounters.filter(
        (item) => item.id !== encounterId,
      ),
    },
  });
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
