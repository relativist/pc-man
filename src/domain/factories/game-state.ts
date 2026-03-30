import { books, companies, orderTemplates, pcTierCatalog, shopCatalogs } from "../catalogs";
import { selectVisibleOrders } from "../rules";
import { normalizeGameState } from "../utils";
import type {
  ActivityTimer,
  Book,
  CareerState,
  EventLogEntry,
  GameState,
  PlayerState,
  QualificationProgress,
  ShopState,
  SkillState,
  SkillTrackId,
  TimerState,
  WorldState,
} from "../types";

export type CreateNewGameOptions = {
  now?: Date;
  playerName?: string;
  saveSlotId?: string;
};

const firstNames = [
  "Артемий",
  "Леонид",
  "Марк",
  "Виталя",
  "Гриша",
  "Костя",
  "Роман",
  "Тимур",
  "Семен",
  "Денис",
  "Игорь",
  "Павел",
];

const lastNames = [
  "Логов",
  "Багоделов",
  "Тестирович",
  "Спринтов",
  "Кодобоев",
  "Релизов",
  "Фичин",
  "Дедлайнов",
  "Деплойкин",
  "Кабелян",
  "Мониторцев",
  "Рефакторский",
];

const educationLabels = [
  "Академия грустных релизов",
  "Университет прикладного героизма в Excel",
  "Институт кабелей, кофе и дедлайнов",
  "Высшая школа сурового фронтенда",
  "Колледж тревожного DevOps",
  "Техникум внезапных продакшен-фиксов",
  "Факультет тестирования всего живого",
  "Университет случайных архитектурных решений",
  "Институт мягких навыков и жестких багов",
  "Школа системного волшебства имени сервера №7",
];

function toIsoDate(date: Date): string {
  return date.toISOString();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function createId(prefix: string, value: string): string {
  return `${prefix}-${value}`;
}

function createSeededUnit(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }

  return (hash % 10_000) / 10_000;
}

function pickBySeed<T>(items: readonly T[], seed: string): T {
  const roll = createSeededUnit(seed);
  return items[Math.min(items.length - 1, Math.floor(roll * items.length))];
}

function createQualificationProgress(track: SkillTrackId): QualificationProgress {
  return {
    track,
    level: 1,
    points: 0,
    booksCompleted: [],
    practicalTasksCompleted: 0,
  };
}

function createInitialSkills(): SkillState {
  return {
    tracks: {
      qa: createQualificationProgress("qa"),
      backend: createQualificationProgress("backend"),
      frontend: createQualificationProgress("frontend"),
      pm: createQualificationProgress("pm"),
      pentester: createQualificationProgress("pentester"),
      analyst: createQualificationProgress("analyst"),
    },
  };
}

function createInitialPlayerState(playerName: string | undefined, seed: string): PlayerState {
  const generatedName = `${pickBySeed(firstNames, `${seed}-first`)} ${pickBySeed(lastNames, `${seed}-last`)}`;

  return {
    id: createId("player", "1"),
    name: playerName ?? generatedName,
    ageYears: 21,
    money: 100000,
    realEstateValue: 0,
    propertyValue: 0,
    capital: 1000,
    hunger: 20,
    health: 100,
    weight: 72,
    fitness: 45,
    mood: 65,
    education: pickBySeed(educationLabels, `${seed}-education`),
    housingStatus: "with_parents",
    isAlive: true,
  };
}

function createInitialCareerState(): CareerState {
  return {
    employmentStatus: "unemployed",
    currentJobId: null,
    currentCompanyId: null,
    currentTrack: null,
    currentCareerLevel: null,
    monthlySalaryBase: null,
    monthlySalaryActual: null,
    promotionAvailable: false,
    lastPromotionRequestAt: null,
    jobSearchInProgress: false,
    jobSearchResultIds: [],
    previousJobHistory: [],
  };
}

function createInitialLearningState(availableBooks: Book[]): GameState["learning"] {
  return {
    activeBookId: null,
    ownedBookIds: [],
    completedBookIds: [],
    availableBookIds: availableBooks.map((book) => book.id),
  };
}

function createInitialPcState(): GameState["pc"] {
  return {
    isWorkingPcReady: false,
    level: 0,
    ratingScore: 0,
    currentTierId: null,
    currentBuild: null,
  };
}

function createInitialOrdersState(now: Date, orderPool: WorldState["orderPool"]): GameState["orders"] {
  return {
    activeOrderId: null,
    activeOrderSource: null,
    availableOrderIds: [],
    discoveredOrderIds: [],
    completedOrderIds: [],
    failedOrderIds: [],
    lastRefreshAt: toIsoDate(now),
    nextRefreshAt: toIsoDate(addMinutes(now, 10)),
  };
}

function createInitialShopState(): ShopState {
  return {
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
  };
}

function createInitialTimers(): TimerState {
  return {
    learning: null,
    jobSearch: null,
    salaryCycle: null,
    activeOrder: null,
    walk: null,
    healing: null,
  };
}

function createInitialWorldState(): WorldState {
  return {
    companies: [...companies],
    activeVacancies: [],
    availableBooks: [...books],
    availablePcTiers: [...pcTierCatalog],
    orderPool: orderTemplates.map((template, index) => ({
      ...template,
      id: createId("order", String(index + 1)),
    })),
    shopCatalogs: {
      things: [...shopCatalogs.things],
      housing: [...shopCatalogs.housing],
      transport: [...shopCatalogs.transport],
    },
  };
}

function createInitialLogs(): EventLogEntry[] {
  return [];
}

export function createActivityTimer(
  kind: ActivityTimer["kind"],
  startedAt: Date,
  durationMinutes: number,
  referenceId: string | null = null,
): ActivityTimer {
  return {
    id: createId("timer", `${kind}-${startedAt.getTime()}`),
    kind,
    startedAt: toIsoDate(startedAt),
    endsAt: toIsoDate(addMinutes(startedAt, durationMinutes)),
    referenceId,
  };
}

export function createInitialGameState(options: CreateNewGameOptions = {}): GameState {
  const now = options.now ?? new Date();
  const saveSlotId = options.saveSlotId ?? "slot-1";
  const identitySeed = `${saveSlotId}-${toIsoDate(now)}`;
  const world = createInitialWorldState();
  const skills = createInitialSkills();
  const initialState = normalizeGameState({
    meta: {
      version: __APP_VERSION__,
      createdAt: toIsoDate(now),
      updatedAt: toIsoDate(now),
      lastOpenedAt: toIsoDate(now),
      lastViewedLogAt: toIsoDate(now),
      saveSlotId,
      isGameOver: false,
      gameOverReason: null,
    },
    player: createInitialPlayerState(options.playerName, identitySeed),
    career: createInitialCareerState(),
    skills,
    learning: createInitialLearningState(world.availableBooks),
    pc: createInitialPcState(),
    orders: createInitialOrdersState(now, world.orderPool),
    shop: createInitialShopState(),
    social: {
      spouse: null,
      childrenCount: 0,
      friends: [],
      pets: [],
      pendingEncounters: [],
      friendOrderRotationIndex: 0,
    },
    world,
    timers: createInitialTimers(),
    logs: createInitialLogs(),
  });

  const visibleOrders = selectVisibleOrders(initialState, now);

  return {
    ...initialState,
    orders: {
      ...initialState.orders,
      availableOrderIds: visibleOrders.map((order) => order.id),
    },
  };
}
