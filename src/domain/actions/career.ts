import { createActivityTimer } from "../factories";
import { convertGameDaysToMinutes } from "../rules";
import { normalizeGameState } from "../utils";
import type {
  CareerHistoryEntry,
  Company,
  GameState,
  SkillTrackId,
  Vacancy,
  VacancyTemplate,
} from "../types";

const minimumJobSearchDays = 1;
const maximumJobSearchDays = 3;
function buildVacancyId(index: number, at: Date): string {
  return `vacancy-${at.getTime()}-${index + 1}`;
}

function getActiveTrackKeys(gameState: GameState): SkillTrackId[] {
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
  const activeTracks = getActiveTrackKeys(gameState);
  const bestTemplatesByTrack = activeTracks
    .map((track) => {
      const eligibleTemplates = vacancyTemplates
        .filter((template) => template.track === track && meetsVacancyRequirements(gameState, template))
        .sort((left, right) => {
          if (left.requirements.requiredQualificationLevel !== right.requirements.requiredQualificationLevel) {
            return (
              right.requirements.requiredQualificationLevel -
              left.requirements.requiredQualificationLevel
            );
          }

          if (
            (left.requirements.requiredQualificationPoints ?? 0) !==
            (right.requirements.requiredQualificationPoints ?? 0)
          ) {
            return (
              (right.requirements.requiredQualificationPoints ?? 0) -
              (left.requirements.requiredQualificationPoints ?? 0)
            );
          }

          if (left.careerLevel !== right.careerLevel) {
            return right.careerLevel - left.careerLevel;
          }

          if (left.baseSalary !== right.baseSalary) {
            return right.baseSalary - left.baseSalary;
          }

          if (left.isGolden !== right.isGolden) {
            return left.isGolden ? -1 : 1;
          }

          return left.formalTitle.localeCompare(right.formalTitle);
        });

      return eligibleTemplates[0] ?? null;
    })
    .filter((template): template is VacancyTemplate => Boolean(template))
    .sort((left, right) => {
      const leftProgress = gameState.skills.tracks[left.track as SkillTrackId];
      const rightProgress = gameState.skills.tracks[right.track as SkillTrackId];

      if (leftProgress.level !== rightProgress.level) {
        return rightProgress.level - leftProgress.level;
      }

      if (leftProgress.points !== rightProgress.points) {
        return rightProgress.points - leftProgress.points;
      }

      return left.track.localeCompare(right.track);
    });

  const companyPool = [...gameState.world.companies].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const offset = bestTemplatesByTrack.length
    ? Math.floor(now.getTime() / 60_000) % companyPool.length
    : 0;

  const vacancies = bestTemplatesByTrack.map((template, index) =>
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
