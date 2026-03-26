import type { QualificationLevel, SkillTrackId } from "./common";

export type BookTrack = SkillTrackId | "universal" | "cto";

export type BookUnlockCondition = {
  track: SkillTrackId;
  minLevel?: QualificationLevel;
  minPoints?: number;
};

export type BookUnlockRequirements = {
  track?: SkillTrackId;
  minLevel?: QualificationLevel;
  minPoints?: number;
  allOf?: BookUnlockCondition[];
  anyOf?: BookUnlockCondition[];
};

export type Book = {
  id: string;
  track: BookTrack;
  title: string;
  funnyTitle: string;
  level: QualificationLevel;
  price: number;
  durationDays: number;
  qualificationPoints: number;
  unlockRequirements?: BookUnlockRequirements;
};

export type LearningState = {
  activeBookId: string | null;
  ownedBookIds: string[];
  completedBookIds: string[];
  availableBookIds: string[];
};
