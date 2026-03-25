import type { QualificationLevel, SkillTrackId } from "./common";

export type QualificationProgress = {
  track: SkillTrackId;
  level: QualificationLevel;
  points: number;
  booksCompleted: string[];
  practicalTasksCompleted: number;
};

export type SkillState = {
  tracks: Record<SkillTrackId, QualificationProgress>;
};

