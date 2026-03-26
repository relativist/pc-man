import { createActivityTimer } from "../factories";
import { convertGameDaysToMinutes } from "../rules";
import { normalizeGameState } from "../utils";
import type { CareerHistoryEntry, Company, GameState, Vacancy, VacancyTemplate } from "../types";

const minimumJobSearchDays = 1;
const maximumJobSearchDays = 3;
const minimumVacancyCount = 1;
const maximumVacancyCount = 3;

function buildVacancyId(index: number, at: Date): string {
  return `vacancy-${at.getTime()}-${index + 1}`;
}

function getActiveTrackKeys(gameState: GameState): string[] {
  return Object.values(gameState.skills.tracks)
    .filter((track) => track.points > 0 || track.track === "qa")
    .map((track) => track.track);
}

function getCurrentTitle(gameState: GameState): string | null {
  if (!gameState.career.currentJobId) {
    return null;
  }

  const currentVacancy = gameState.world.activeVacancies.find(
    (vacancy) => vacancy.id === gameState.career.currentJobId,
  );

  return currentVacancy?.formalTitle ?? null;
}

function meetsVacancyRequirements(gameState: GameState, template: VacancyTemplate): boolean {
  if (template.track === "cto") {
    return false;
  }

  const progress = gameState.skills.tracks[template.track];

  if (progress.level < template.requirements.requiredQualificationLevel) {
    return false;
  }

  if (
    template.requirements.requiredQualificationPoints !== undefined &&
    progress.points < template.requirements.requiredQualificationPoints
  ) {
    return false;
  }

  if (template.requirements.requiredPreviousTrack?.length) {
    const historyTracks = new Set(
      gameState.career.previousJobHistory.map((entry) => entry.track).concat(
        gameState.career.currentTrack ? [gameState.career.currentTrack] : [],
      ),
    );

    const hasMatchingTrack = template.requirements.requiredPreviousTrack.some((track) =>
      historyTracks.has(track),
    );

    if (!hasMatchingTrack) {
      return false;
    }
  }

  if (template.requirements.requiredPreviousTitle?.length) {
    const currentTitle = getCurrentTitle(gameState);
    const historyTitles = new Set(
      gameState.career.previousJobHistory.map((entry) => entry.title).concat(
        currentTitle ? [currentTitle] : [],
      ),
    );

    const hasMatchingTitle = template.requirements.requiredPreviousTitle.some((title) =>
      historyTitles.has(title),
    );

    if (!hasMatchingTitle) {
      return false;
    }
  }

  return true;
}

function buildVacancy(
  template: VacancyTemplate,
  company: Company,
  index: number,
  now: Date,
): Vacancy {
  const companyModifierPct = template.companyModifierPct + company.salaryModifierPct;
  const finalSalary = Math.round(template.baseSalary * (1 + companyModifierPct / 100));

  return {
    id: buildVacancyId(index, now),
    companyId: company.id,
    track: template.track,
    formalTitle: template.formalTitle,
    funnyTitle: template.funnyTitle,
    careerLevel: template.careerLevel,
    baseSalary: template.baseSalary,
    companyModifierPct,
    finalSalary,
    isGolden: template.isGolden,
    requirements: template.requirements,
    validUntil: new Date(now.getTime() + 10 * 60_000).toISOString(),
  };
}

function buildCareerHistoryEntry(gameState: GameState, endedAt: Date): CareerHistoryEntry | null {
  if (
    !gameState.career.currentJobId ||
    !gameState.career.currentCompanyId ||
    !gameState.career.currentTrack ||
    !gameState.career.currentCareerLevel
  ) {
    return null;
  }

  const currentVacancy = gameState.world.activeVacancies.find(
    (vacancy) => vacancy.id === gameState.career.currentJobId,
  );

  if (!currentVacancy) {
    return null;
  }

  return {
    id: `history-${currentVacancy.id}`,
    companyId: gameState.career.currentCompanyId,
    title: currentVacancy.formalTitle,
    track: gameState.career.currentTrack,
    level: gameState.career.currentCareerLevel,
    startedAt: gameState.meta.createdAt,
    endedAt: endedAt.toISOString(),
  };
}

export function startJobSearch(gameState: GameState, now: Date = new Date()): GameState {
  const bucket = Math.floor(now.getTime() / 60_000);
  const durationDays = minimumJobSearchDays + (bucket % maximumJobSearchDays);

  return normalizeGameState({
    ...gameState,
    career: {
      ...gameState.career,
      jobSearchInProgress: true,
      jobSearchResultIds: [],
    },
    timers: {
      ...gameState.timers,
      jobSearch: createActivityTimer(
        "job_search",
        now,
        convertGameDaysToMinutes(durationDays),
        "job-search",
      ),
    },
  });
}

export function completeJobSearch(
  gameState: GameState,
  vacancyTemplates: VacancyTemplate[],
  now: Date = new Date(),
): GameState {
  const activeTracks = new Set(getActiveTrackKeys(gameState));
  const eligibleTemplates = vacancyTemplates.filter(
    (template) =>
      activeTracks.has(template.track) &&
      meetsVacancyRequirements(gameState, template),
  );

  const orderedTemplates = eligibleTemplates.sort((left, right) =>
    `${left.track}-${left.formalTitle}-${left.funnyTitle}`.localeCompare(
      `${right.track}-${right.formalTitle}-${right.funnyTitle}`,
    ),
  );

  const companyPool = [...gameState.world.companies].sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  const count = Math.min(
    maximumVacancyCount,
    Math.max(minimumVacancyCount, orderedTemplates.length),
  );

  const offset = orderedTemplates.length
    ? Math.floor(now.getTime() / 60_000) % orderedTemplates.length
    : 0;

  const rotatedTemplates = orderedTemplates
    .slice(offset)
    .concat(orderedTemplates.slice(0, offset))
    .slice(0, count);

  const vacancies = rotatedTemplates.map((template, index) =>
    buildVacancy(
      template,
      companyPool[(offset + index) % companyPool.length],
      index,
      now,
    ),
  );

  const preservedVacancies = gameState.world.activeVacancies.filter(
    (vacancy) => !gameState.career.jobSearchResultIds.includes(vacancy.id),
  );

  return normalizeGameState({
    ...gameState,
    career: {
      ...gameState.career,
      jobSearchInProgress: false,
      jobSearchResultIds: vacancies.map((vacancy) => vacancy.id),
    },
    timers: {
      ...gameState.timers,
      jobSearch: null,
    },
    world: {
      ...gameState.world,
      activeVacancies: [...preservedVacancies, ...vacancies],
    },
  });
}

export function acceptVacancy(
  gameState: GameState,
  vacancyId: string,
  now: Date = new Date(),
): GameState {
  const vacancy = gameState.world.activeVacancies.find((item) => item.id === vacancyId);

  if (!vacancy) {
    throw new Error(`Vacancy not found: ${vacancyId}`);
  }

  const previousEntry = buildCareerHistoryEntry(gameState, now);

  return normalizeGameState({
    ...gameState,
    career: {
      ...gameState.career,
      employmentStatus: "employed",
      currentJobId: vacancy.id,
      currentCompanyId: vacancy.companyId,
      currentTrack: vacancy.track,
      currentCareerLevel: vacancy.careerLevel,
      monthlySalaryBase: vacancy.baseSalary,
      monthlySalaryActual: vacancy.finalSalary,
      promotionAvailable: false,
      lastPromotionRequestAt: null,
      jobSearchInProgress: false,
      jobSearchResultIds: [],
      previousJobHistory: previousEntry
        ? [...gameState.career.previousJobHistory, previousEntry]
        : gameState.career.previousJobHistory,
    },
    timers: {
      ...gameState.timers,
      jobSearch: null,
      salaryCycle: createActivityTimer("salary_cycle", now, 1, vacancy.id),
    },
    world: {
      ...gameState.world,
      activeVacancies: gameState.world.activeVacancies,
    },
  });
}
