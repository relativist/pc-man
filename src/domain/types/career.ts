import type {
  CareerLevel,
  CareerTrackId,
  IsoDateString,
  QualificationLevel,
} from "./common";

export type CareerHistoryEntry = {
  id: string;
  companyId: string;
  title: string;
  track: CareerTrackId;
  level: CareerLevel;
  startedAt: IsoDateString;
  endedAt: IsoDateString | null;
};

export type CareerState = {
  employmentStatus: "unemployed" | "employed";
  currentJobId: string | null;
  currentCompanyId: string | null;
  currentTrack: CareerTrackId | null;
  currentCareerLevel: CareerLevel | null;
  monthlySalaryBase: number | null;
  monthlySalaryActual: number | null;
  promotionAvailable: boolean;
  lastPromotionRequestAt: IsoDateString | null;
  jobSearchInProgress: boolean;
  jobSearchResultIds: string[];
  previousJobHistory: CareerHistoryEntry[];
};

export type VacancyRequirements = {
  requiredTrack: CareerTrackId;
  requiredQualificationLevel: QualificationLevel;
  requiredQualificationPoints?: number;
  requiredPreviousTrack?: CareerTrackId[];
  requiredPreviousTitle?: string[];
};

export type Vacancy = {
  id: string;
  companyId: string;
  track: CareerTrackId;
  formalTitle: string;
  funnyTitle: string;
  careerLevel: CareerLevel;
  baseSalary: number;
  companyModifierPct: number;
  finalSalary: number;
  isGolden: boolean;
  requirements: VacancyRequirements;
  validUntil: IsoDateString;
};

export type VacancyTemplate = Omit<Vacancy, "id" | "companyId" | "finalSalary" | "validUntil">;

export type Company = {
  id: string;
  name: string;
  salaryModifierPct: number;
  flavorText: string;
};

