import { books, companies, orderTemplates, pcPartsCatalog } from "../catalogs";
import { selectVisibleOrders } from "../rules";
import { normalizeGameState } from "../utils";
import type {
  ActivityTimer,
  Book,
  CareerState,
  EventLogEntry,
  GameState,
  PcComponentSlot,
  PlayerState,
  QualificationProgress,
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

const pcSlots: PcComponentSlot[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "ssd",
  "power_supply",
  "case",
  "cooling",
  "monitor",
  "keyboard",
  "mouse",
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

function createInitialPlayerState(playerName: string): PlayerState {
  return {
    id: createId("player", "1"),
    name: playerName,
    ageYears: 21,
    money: 1000,
    realEstateValue: 0,
    propertyValue: 0,
    capital: 1000,
    hunger: 20,
    health: 100,
    weight: 72,
    fitness: 45,
    mood: 65,
    education: "university",
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
  const components = Object.fromEntries(
    pcSlots.map((slot) => [slot, null]),
  ) as GameState["pc"]["components"];

  return {
    isWorkingPcReady: false,
    ratingScore: 0,
    components,
  };
}

function createInitialOrdersState(now: Date, orderPool: WorldState["orderPool"]): GameState["orders"] {
  return {
    activeOrderId: null,
    availableOrderIds: orderPool.map((order) => order.id),
    completedOrderIds: [],
    failedOrderIds: [],
    lastRefreshAt: toIsoDate(now),
    nextRefreshAt: toIsoDate(addMinutes(now, 10)),
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
    availablePcParts: [...pcPartsCatalog],
    orderPool: orderTemplates.map((template, index) => ({
      ...template,
      id: createId("order", String(index + 1)),
    })),
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
  const world = createInitialWorldState();
  const skills = createInitialSkills();
  const initialState = normalizeGameState({
    meta: {
      version: "0.1.0",
      createdAt: toIsoDate(now),
      updatedAt: toIsoDate(now),
      lastOpenedAt: toIsoDate(now),
      saveSlotId,
      isGameOver: false,
      gameOverReason: null,
    },
    player: createInitialPlayerState(options.playerName ?? "Новый герой"),
    career: createInitialCareerState(),
    skills,
    learning: createInitialLearningState(world.availableBooks),
    pc: createInitialPcState(),
    orders: createInitialOrdersState(now, world.orderPool),
    social: {
      spouse: null,
      childrenCount: 0,
      friends: [],
      pets: [],
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
